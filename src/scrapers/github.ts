import type { Browser } from 'playwright';
import { CONFIG, type ReportMode } from '../config';
import type { GitHubRepo } from '../types';
import { BaseScraper } from './base';

export class GitHubTrendingScraper extends BaseScraper<GitHubRepo> {
  protected get sourceName(): string { return 'GitHubTrending'; }
  protected get healthCheckUrl(): string { return CONFIG.GITHUB_TRENDING; }

  private aiTopics = [
    'ai', 'artificial-intelligence', 'machine-learning', 'deep-learning',
    'llm', 'gpt', 'transformer', 'neural-network',
    'rag', 'agent', 'chatbot', 'nlp', 'computer-vision',
    'tensorflow', 'pytorch', 'jax', 'generative-ai',
    'large-language-model', 'langchain', 'vector-database',
    'diffusion', 'stable-diffusion', 'reinforcement-learning',
    'fine-tuning', 'openai', 'data-science',
  ];

  constructor(browser?: Browser) {
    super(browser);
  }

  protected async doScrape(mode?: ReportMode): Promise<GitHubRepo[]> {
    if (!this.browser) throw new Error('GitHub scraper requires a browser instance');
    const page = await this.browser.newPage();
    try {
      await page.setExtraHTTPHeaders({
        'User-Agent':
          CONFIG.USER_AGENT,
      });

      await page.goto(CONFIG.GITHUB_TRENDING, {
        waitUntil: 'domcontentloaded',
        timeout: CONFIG.SCRAPE_TIMEOUT_MS,
      });

      await page.waitForSelector('article.Box-row', { timeout: CONFIG.SCRAPE_TIMEOUT_MS });

      const repos = await this.extractRepos(page);
      const filtered = repos.filter((r) => this.isAiRelated(r));

      const effectiveMode = mode || CONFIG.REPORT_MODE;
      const max = CONFIG.MODE_PARAMS[effectiveMode].githubTrendMax;
      const result = filtered.slice(0, max);
      console.log(`[GitHub] 抓取到 ${result.length} 个 AI 相关仓库（共 ${repos.length} 个）`);
      return result;
    } finally {
      await page.close();
    }
  }

  private async extractRepos(page: import('playwright').Page): Promise<GitHubRepo[]> {
    return page.$$eval('article.Box-row', (rows) => {
      return Array.from(rows).map((row) => {
        const h2 = row.querySelector('h2 a');
        const name = h2?.textContent?.trim().replace(/\s+/g, '') || '';
        const url = h2?.getAttribute('href') || '';

        const descEl = row.querySelector('p');
        const description = descEl?.textContent?.trim() || '';

        const langEl = row.querySelector('span[itemprop="programmingLanguage"]');
        const language = langEl?.textContent?.trim() || '';

        const starEl = row.querySelector('.float-sm-right');
        const starsTodayText = starEl?.textContent?.trim() || '';
        const starsToday = parseInt(starsTodayText.replace(/[^0-9]/g, ''), 10) || 0;

        const totalStarEls = row.querySelectorAll('a.Link--muted');
        const totalStarsText = totalStarEls[0]?.textContent?.trim() || '0';
        const totalStars = parseInt(totalStarsText.replace(/,/g, ''), 10) || 0;

        const topicEls = row.querySelectorAll('a.topic-tag');
        const topics = Array.from(topicEls).map((t) => t.textContent?.trim() || '').filter(Boolean);

        return {
          name: name.startsWith('/') ? name.slice(1) : name,
          description,
          url: `https://github.com${url}`,
          language,
          starsToday,
          totalStars,
          topics,
        } as GitHubRepo;
      });
    });
  }

  private isAiRelated(repo: GitHubRepo): boolean {
    const hasAiTopic = repo.topics.some((t) =>
      this.aiTopics.includes(t.toLowerCase())
    );
    if (hasAiTopic) return true;

    const desc = repo.description.toLowerCase();
    return this.aiTopics.some(
      (t) => desc.includes(t) || desc.includes(t.replace(/-/g, ' '))
    );
  }
}
