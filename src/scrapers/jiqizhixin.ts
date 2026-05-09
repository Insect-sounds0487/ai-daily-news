import type { Browser, Page, BrowserContext } from 'playwright';
import { CONFIG, type ReportMode } from '../config';
import type { JiqizhixinArticle } from '../types';
import { BaseScraper } from './base';

export class JiqizhixinScraper extends BaseScraper<JiqizhixinArticle> {
  protected get sourceName(): string { return '机器之心'; }
  protected get healthCheckUrl(): string { return CONFIG.JIQIZHIXIN_HOME; }

  constructor(browser?: Browser) {
    super(browser);
  }

  protected async doScrape(mode?: ReportMode): Promise<JiqizhixinArticle[]> {
    if (!this.browser) throw new Error('机器之心 scraper requires a browser instance');
    const context = await this.browser.newContext({
      userAgent:
        CONFIG.USER_AGENT,
    });
    const page = await context.newPage();
    try {
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
      await page.close();
      await context.close();
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
    try {
      const titleEls = page.locator('.home__article-item__title');
      const count = await titleEls.count();
      if (index >= count) return null;

      const [newPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 8000 }),
        titleEls.nth(index).click({ timeout: 5000 }),
      ]);

      try {
        await newPage.waitForLoadState('domcontentloaded', { timeout: 5000 });
        const url = newPage.url();
        await newPage.close();
        return url;
      } catch {
        await newPage.close().catch(() => {});
        return null;
      }
    } catch {
      return null;
    }
  }
}
