import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { CacheManifest } from './types';
import type { ArxivPaper, HNStory, JiqizhixinArticle, GitHubRepo } from './types';

export async function loadCache(filePath: string): Promise<CacheManifest> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as CacheManifest;
    if (parsed && typeof parsed.entries === 'object' && !Array.isArray(parsed.entries)) return parsed;
    console.warn('[Cache] 缓存格式异常，重置');
    return { entries: {} };
  } catch {
    return { entries: {} };
  }
}

export async function saveCache(
  filePath: string,
  cache: CacheManifest,
  maxAgeDays: number
): Promise<void> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxAgeDays);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    for (const [key, date] of Object.entries(cache.entries)) {
      if (date < cutoffStr) delete cache.entries[key];
    }

    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(cache), 'utf-8');
  } catch (err) {
    console.warn(`[Cache] 写入失败: ${err}`);
  }
}

export function getDedupKey(
  item: ArxivPaper | HNStory | JiqizhixinArticle | GitHubRepo,
  source: 'arxiv' | 'hn' | 'jqx' | 'github'
): string {
  switch (source) {
    case 'arxiv':
      return `arxiv:${(item as ArxivPaper).id}`;
    case 'hn':
      return `hn:${(item as HNStory).id}`;
    case 'github':
      return `github:${(item as GitHubRepo).name}`;
    case 'jqx': {
      const a = item as JiqizhixinArticle;
      const hash = createHash('sha256').update(`${a.title}|${a.date}`).digest('hex');
      return `jqx:${hash.substring(0, 12)}`;
    }
  }
}

export function dedupItems<T extends ArxivPaper | HNStory | JiqizhixinArticle | GitHubRepo>(
  items: T[],
  source: 'arxiv' | 'hn' | 'jqx' | 'github',
  cache: CacheManifest,
  today: string
): { fresh: T[]; cache: CacheManifest } {
  const fresh: T[] = [];

  for (const item of items) {
    const key = getDedupKey(item, source);
    const seenDate = cache.entries[key];
    if (seenDate === today) continue; // 今天已处理过，跳过
    cache.entries[key] = today; // 更新/记录为今日已处理
    fresh.push(item);
  }

  return { fresh, cache };
}
