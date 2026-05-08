import { chromium } from 'playwright';
import { CONFIG } from '../config';
import type { GitHubRepo } from '../types';

/**
 * GitHub Trending AI 相关仓库抓取器。
 *
 * 策略：
 * 1. 打开 GitHub Trending 页面（按日筛选）
 * 2. 提取所有仓库信息
 * 3. 按 topics 和描述中的 AI 关键词过滤
 */
export class GitHubTrendingScraper {
  private aiTopics = [
    'ai', 'artificial-intelligence', 'machine-learning', 'deep-learning',
    'llm', 'gpt', 'transformer', 'neural-network',
    'rag', 'agent', 'chatbot', 'nlp', 'computer-vision',
    'tensorflow', 'pytorch', 'jax', 'generative-ai',
    'large-language-model', 'langchain', 'vector-database',
    'diffusion', 'stable-diffusion', 'reinforcement-learning',
    'fine-tuning', 'openai', 'data-science',
  ];

  async scrape(): Promise<GitHubRepo[]> {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      });

      await page.goto(CONFIG.GITHUB_TRENDING, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // 等待仓库列表加载
      await page.waitForSelector('article.Box-row', { timeout: 30000 });

      const repos = await this.extractRepos(page);
      const filtered = repos.filter((r) => this.isAiRelated(r));

      const max = CONFIG.MODE_PARAMS[CONFIG.REPORT_MODE].githubTrendMax;
      const result = filtered.slice(0, max);
      console.log(`[GitHub] 抓取到 ${result.length} 个 AI 相关仓库（共 ${repos.length} 个）`);
      return result;
    } finally {
      await browser.close();
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

        // 今日 star 数
        const starEl = row.querySelector('.float-sm-right');
        const starsTodayText = starEl?.textContent?.trim() || '';
        const starsToday = parseInt(starsTodayText.replace(/[^0-9]/g, ''), 10) || 0;

        // 总 star 数
        const totalStarEls = row.querySelectorAll('a.Link--muted');
        const totalStarsText = totalStarEls[0]?.textContent?.trim() || '0';
        const totalStars = parseInt(totalStarsText.replace(/,/g, ''), 10) || 0;

        // topics
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
        } as import('../types').GitHubRepo;
      });
    });
  }

  private isAiRelated(repo: GitHubRepo): boolean {
    // 检查 topics
    const hasAiTopic = repo.topics.some((t) =>
      this.aiTopics.includes(t.toLowerCase())
    );
    if (hasAiTopic) return true;

    // 检查描述
    const desc = repo.description.toLowerCase();
    return this.aiTopics.some(
      (t) => desc.includes(t) || desc.includes(t.replace(/-/g, ' '))
    );
  }
}
