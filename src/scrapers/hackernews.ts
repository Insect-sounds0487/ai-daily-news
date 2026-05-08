import { CONFIG } from '../config';
import type { HNStory } from '../types';

export class HackerNewsScraper {
  private baseUrl = CONFIG.HN_ITEM_BASE;
  private keywords: string[];

  constructor() {
    this.keywords = CONFIG.HN_AI_KEYWORDS.map((k) => k.toLowerCase());
  }

  async scrape(): Promise<HNStory[]> {
    // 1. 获取 top stories ID 列表
    const topIds = await this.fetchTopStoryIds();
    const idsToFetch = topIds.slice(0, CONFIG.MODE_PARAMS[CONFIG.REPORT_MODE].hnFilterTop);

    // 2. 并行抓取每个 story 详情（5 并发）
    const stories = await this.fetchStoriesBatch(idsToFetch, 5);

    // 3. 按 AI 关键词过滤并按热度排序
    const filtered = stories
      .filter((s) => s !== null && this.isAiRelated(s.title))
      .sort((a, b) => b.score - a.score);

    const result = filtered.slice(0, CONFIG.MODE_PARAMS[CONFIG.REPORT_MODE].hnMax);
    console.log(`[HackerNews] 抓取到 ${result.length} 篇 AI 相关文章（原始 ${idsToFetch.length} 篇中过滤）`);
    return result;
  }

  private async fetchTopStoryIds(): Promise<number[]> {
    const res = await fetch(CONFIG.HN_TOP_STORIES);
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
    const res = await fetch(`${this.baseUrl}/${id}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.type !== 'story') return null;
    return data as HNStory;
  }

  private isAiRelated(title: string): boolean {
    const lower = title.toLowerCase();
    return this.keywords.some((kw) => lower.includes(kw));
  }
}
