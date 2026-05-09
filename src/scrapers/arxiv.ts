import { chromium, type Page } from 'playwright';
import { CONFIG } from '../config';
import type { ArxivPaper } from '../types';
import type { HealthCheckResult } from '../types';
import { withRetry } from '../utils/retry';
import { checkUrlHealth } from '../utils/health';

export class ArxivScraper {
  async scrape(): Promise<ArxivPaper[]> {
    return withRetry(() => this.doScrape(), {
      maxRetries: CONFIG.RETRY_MAX,
      backoffMs: CONFIG.RETRY_BACKOFF_MS,
      label: 'ArXiv',
    });
  }

  async isHealthy(): Promise<HealthCheckResult> {
    const result = await checkUrlHealth(CONFIG.ARXIV_CS_AI_RECENT, CONFIG.HEALTH_CHECK_TIMEOUT_MS);
    return { ...result, sourceName: 'ArXiv' };
  }

  private async doScrape(): Promise<ArxivPaper[]> {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      });

      await page.goto(CONFIG.ARXIV_CS_AI_RECENT, {
        waitUntil: 'networkidle',
        timeout: CONFIG.SCRAPE_TIMEOUT_MS,
      });

      await page.waitForSelector('dl#articles', { timeout: 15000 });

      const papers = await this.extractPapers(page);
      console.log(`[ArXiv] 抓取到 ${papers.length} 篇论文`);
      return papers.slice(0, CONFIG.MODE_PARAMS[CONFIG.REPORT_MODE].arxivMax);
    } finally {
      await browser.close();
    }
  }

  private async extractPapers(page: Page): Promise<ArxivPaper[]> {
    return page.$$eval('#articles > dt', (dtElements) => {
      const ddElements = document.querySelectorAll('#articles > dd');
      const scrapedAt = new Date().toISOString();

      return Array.from(dtElements).map((dt, i) => {
        const dd = ddElements[i];
        if (!dd) return null;

        const idLink = dt.querySelector<HTMLAnchorElement>('a[title="Abstract"]');
        const paperId = idLink?.id || idLink?.href.replace('/abs/', '') || '';

        const titleEl = dd.querySelector('.list-title');
        const title = titleEl?.textContent?.replace(/^Title:\s*/i, '').trim() || '';

        const authorsEl = dd.querySelector('.list-authors');
        const authorsText = authorsEl?.textContent?.replace(/^Authors:\s*/i, '').trim() || '';
        const authors = authorsText.split(',').map((a) => a.trim()).filter(Boolean);

        const subjectsEl = dd.querySelector('.list-subjects');
        const subjectsText = subjectsEl?.textContent?.replace(/^Subjects:\s*/i, '').trim() || '';
        const subjects = subjectsText.split(';').map((s) => s.trim()).filter(Boolean);

        return {
          id: paperId,
          title,
          authors,
          subjects,
          abstractUrl: `https://arxiv.org/abs/${paperId}`,
          pdfUrl: `https://arxiv.org/pdf/${paperId}`,
          scrapedAt,
        } as import('../types').ArxivPaper;
      }).filter((p): p is import('../types').ArxivPaper => p !== null);
    });
  }
}
