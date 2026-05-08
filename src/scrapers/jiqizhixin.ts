import { chromium, type Page, type BrowserContext } from 'playwright';
import { CONFIG } from '../config';
import type { JiqizhixinArticle } from '../types';

/**
 * 机器之心抓取器。
 *
 * 机器之心是 React SPA，文章列表没有 <a> 标签，URL 通过 JS click 处理。
 * 策略：
 * 1. 打开首页，等 React 水合完成
 * 2. 提取所有文章标题、日期、封面图
 * 3. 对顶部 N 篇文章，通过 click 捕获新标签页获取真实 URL
 * 4. 使用 Promise.race 和超时机制防止点击后没有新页面打开
 */
export class JiqizhixinScraper {
  async scrape(): Promise<JiqizhixinArticle[]> {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();

      await page.goto(CONFIG.JIQIZHIXIN_HOME, {
        waitUntil: 'networkidle',
        timeout: CONFIG.SCRAPE_TIMEOUT_MS,
      });

      // 等待 React 水合，确保动态内容加载完成
      await page.waitForSelector('.home__article-item', { timeout: 15000 });
      // 额外等待确保 JS 渲染完成
      await page.waitForTimeout(2000);

      // 提取静态 DOM 中的元信息
      const articles = await this.extractArticles(page);
      const maxArticles = CONFIG.MODE_PARAMS[CONFIG.REPORT_MODE].jqxMax;
      const clickCount = CONFIG.MODE_PARAMS[CONFIG.REPORT_MODE].jqxClickUrls;

      // 为顶部文章获取真实 URL
      const urls = await this.captureArticleUrls(context, page, Math.min(clickCount, articles.length));

      // 合并 URL
      const result = articles.map((a, i) => ({
        ...a,
        url: urls[i] || null,
      })).slice(0, maxArticles);

      console.log(`[机器之心] 抓取到 ${result.length} 篇文章，获取到 ${urls.filter(Boolean).length} 个 URL`);
      return result;
    } finally {
      await browser.close();
    }
  }

  private async extractArticles(page: Page): Promise<JiqizhixinArticle[]> {
    return page.$$eval('.home__article-item', (items) => {
      return Array.from(items).map((item) => {
        const titleEl = item.querySelector('.home__article-item__title');
        const timeEl = item.querySelector('.home__article-item__time');
        const imgEl = item.querySelector('img');

        return {
          title: titleEl?.textContent?.trim() || '',
          date: timeEl?.textContent?.trim() || '',
          imageUrl: imgEl?.getAttribute('src') || null,
          url: null as string | null,
        };
      }).filter((a) => a.title.length > 0);
    });
  }

  /**
   * 通过点击文章标题，捕获新标签页获取真实 URL。
   * 使用超时机制防止点击无响应。
   */
  private async captureArticleUrls(
    context: BrowserContext,
    page: Page,
    count: number
  ): Promise<(string | null)[]> {
    const urls: (string | null)[] = [];

    for (let i = 0; i < count; i++) {
      const url = await this.clickAndCaptureUrl(context, page, i);
      urls.push(url);
      // 礼貌延迟，避免触发反爬
      if (i < count - 1) {
        await new Promise((r) => setTimeout(r, CONFIG.BATCH_DELAY_MS));
      }
    }

    return urls;
  }

  /**
   * 点击第 index 个文章标题，等待新标签页出现并获取其 URL。
   */
  private async clickAndCaptureUrl(
    context: BrowserContext,
    page: Page,
    index: number
  ): Promise<string | null> {
    // 创建一个 Promise 来监听新页面
    const newPagePromise = new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 8000);

      context.on('page', async (newPage) => {
        try {
          await newPage.waitForLoadState('domcontentloaded', { timeout: 5000 });
          const url = newPage.url();
          await newPage.close();
          clearTimeout(timeout);
          resolve(url);
        } catch {
          clearTimeout(timeout);
          resolve(null);
        }
      });
    });

    try {
      // 点击文章标题
      const titleEls = page.locator('.home__article-item__title');
      const count = await titleEls.count();
      if (index >= count) return null;

      await titleEls.nth(index).click({ timeout: 5000 });
    } catch {
      // 点击失败不影响其他文章
      return null;
    }

    return newPagePromise;
  }
}
