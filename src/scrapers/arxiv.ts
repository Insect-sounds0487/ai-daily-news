import type { Browser, Page } from 'playwright';
import { CONFIG, type ReportMode } from '../config';
import type { ArxivPaper } from '../types';
import { BaseScraper } from './base';

export class ArxivScraper extends BaseScraper<ArxivPaper> {
  protected get sourceName(): string { return 'ArXiv'; }
  protected get healthCheckUrl(): string { return CONFIG.ARXIV_CS_AI_RECENT; }

  constructor(browser?: Browser) {
    super(browser);
  }

  protected async doScrape(mode?: ReportMode): Promise<ArxivPaper[]> {
    if (!this.browser) throw new Error('ArXiv scraper requires a browser instance');
    const page = await this.browser.newPage();
    try {
      await page.setExtraHTTPHeaders({
        'User-Agent': CONFIG.USER_AGENT,
      });

      await page.goto(CONFIG.ARXIV_CS_AI_RECENT, {
        waitUntil: 'networkidle',
        timeout: CONFIG.SCRAPE_TIMEOUT_MS,
      });

      await page.waitForSelector('dl#articles', { timeout: 15000 });

      const papers = await this.extractPapers(page);
      console.log(`[ArXiv] 抓取到 ${papers.length} 篇论文`);
      const effectiveMode = mode || CONFIG.REPORT_MODE;
      return papers.slice(0, CONFIG.MODE_PARAMS[effectiveMode].arxivMax);
    } finally {
      await page.close();
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
        } as ArxivPaper;
      }).filter((p): p is ArxivPaper => p !== null);
    });
  }
}
