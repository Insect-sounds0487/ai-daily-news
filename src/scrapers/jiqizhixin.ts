import { chromium, type Page, type BrowserContext } from 'playwright';
import { CONFIG, type ReportMode } from '../config';
import type { JiqizhixinArticle } from '../types';
import type { HealthCheckResult } from '../types';
import { withRetry } from '../utils/retry';
import { checkUrlHealth } from '../utils/health';

export class JiqizhixinScraper {
  async scrape(mode?: ReportMode): Promise<JiqizhixinArticle[]> {
    return withRetry(() => this.doScrape(mode), {
      maxRetries: CONFIG.RETRY_MAX,
      backoffMs: CONFIG.RETRY_BACKOFF_MS,
      label: '机器之心',
    });
  }

  async isHealthy(): Promise<HealthCheckResult> {
    const result = await checkUrlHealth(CONFIG.JIQIZHIXIN_HOME, CONFIG.HEALTH_CHECK_TIMEOUT_MS);
    return { ...result, sourceName: '机器之心' };
  }

  private async doScrape(mode?: ReportMode): Promise<JiqizhixinArticle[]> {
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

      await page.waitForSelector('.home__article-item', { timeout: 15000 });
      await page.waitForTimeout(2000);

      const effectiveMode = mode || CONFIG.REPORT_MODE;
      const articles = await this.extractArticles(page);
      const maxArticles = CONFIG.MODE_PARAMS[effectiveMode].jqxMax;
      const clickCount = CONFIG.MODE_PARAMS[effectiveMode].jqxClickUrls;

      const urls = await this.captureArticleUrls(context, page, Math.min(clickCount, articles.length));

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

  private async captureArticleUrls(
    context: BrowserContext,
    page: Page,
    count: number
  ): Promise<(string | null)[]> {
    const urls: (string | null)[] = [];

    for (let i = 0; i < count; i++) {
      const url = await this.clickAndCaptureUrl(context, page, i);
      urls.push(url);
      if (i < count - 1) {
        await new Promise((r) => setTimeout(r, CONFIG.BATCH_DELAY_MS));
      }
    }

    return urls;
  }

  private async clickAndCaptureUrl(
    context: BrowserContext,
    page: Page,
    index: number
  ): Promise<string | null> {
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
      const titleEls = page.locator('.home__article-item__title');
      const count = await titleEls.count();
      if (index >= count) return null;

      await titleEls.nth(index).click({ timeout: 5000 });
    } catch {
      return null;
    }

    return newPagePromise;
  }
}
