import { CONFIG, type ReportMode } from '../config';
import type { HNStory } from '../types';
import { BaseScraper } from './base';

export class HackerNewsScraper extends BaseScraper<HNStory> {
  protected get sourceName(): string { return 'HackerNews'; }
  protected get healthCheckUrl(): string { return CONFIG.HN_TOP_STORIES; }

  private baseUrl = CONFIG.HN_ITEM_BASE;
  private keywords: string[];

  constructor() {
    super();
    this.keywords = CONFIG.HN_AI_KEYWORDS.map((k) => k.toLowerCase());
  }

  protected async doScrape(mode?: ReportMode): Promise<HNStory[]> {
    const effectiveMode = mode || CONFIG.REPORT_MODE;
    const topIds = await this.fetchTopStoryIds();
    const idsToFetch = topIds.slice(0, CONFIG.MODE_PARAMS[effectiveMode].hnFilterTop);
    const stories = (await this.fetchStoriesBatch(idsToFetch, 5)).filter((s): s is HNStory => s !== null);

    const filtered = stories
      .filter((s) => this.isAiRelated(s.title))
      .sort((a, b) => b.score - a.score);

    const result = filtered.slice(0, CONFIG.MODE_PARAMS[effectiveMode].hnMax);
    console.log(`[HackerNews] 抓取到 ${result.length} 篇 AI 相关文章（原始 ${idsToFetch.length} 篇中过滤）`);
    return result;
  }

  private async fetchTopStoryIds(): Promise<number[]> {
    const res = await this.fetchWithTimeout(CONFIG.HN_TOP_STORIES);
    if (!res.ok) throw new Error(`HN API error: ${res.status}`);
    return res.json() as Promise<number[]>;
  }

  private async fetchStoriesBatch(ids: number[], concurrency: number): Promise<(HNStory | null)[]> {
    const results: (HNStory | null)[] = [];
    for (let i = 0; i < ids.length; i += concurrency) {
      const batch = ids.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map((id) => this.fetchStory(id))
      );
      results.push(...batchResults.map((r) => (r.status === 'fulfilled' ? r.value : null)));
    }
    return results;
  }

  private async fetchStory(id: number): Promise<HNStory | null> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/${id}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.type !== 'story') return null;
    return data as unknown as HNStory;
  }

  private async fetchWithTimeout(url: string, timeoutMs: number = CONFIG.SCRAPE_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  private isAiRelated(title: string): boolean {
    const lower = title.toLowerCase();
    return this.keywords.some((kw) => lower.includes(kw));
  }
}
