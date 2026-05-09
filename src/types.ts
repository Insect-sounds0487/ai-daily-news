// ========== ArXiv ==========
export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  subjects: string[];
  abstractUrl: string;
  pdfUrl: string;
  scrapedAt: string;
}

// ========== Hacker News ==========
export interface HNStory {
  id: number;
  title: string;
  url: string | null;
  score: number;
  by: string;
  descendants: number;
  time: number;
  type: string;
}

// ========== 机器之心 ==========
export interface JiqizhixinArticle {
  title: string;
  date: string;
  url: string | null;
  imageUrl: string | null;
}

// ========== GitHub Trending ==========
export interface GitHubRepo {
  name: string;           // owner/repo
  description: string;
  url: string;
  language: string;
  starsToday: number;
  totalStars: number;
  topics: string[];
}

// ========== 日报 ==========
export interface SourceSection<T> {
  sourceName: string;
  sourceUrl: string;
  items: T[];
}

export interface DailyReport {
  date: string;
  generatedAt: string;
  mode: string;
  sources: {
    arxiv: SourceSection<ArxivPaper>;
    hackernews: SourceSection<HNStory>;
    jiqizhixin: SourceSection<JiqizhixinArticle>;
    github: SourceSection<GitHubRepo>;
  };
}

// ========== CLI 参数 ==========
export interface CLIOptions {
  mode?: 'light' | 'standard' | 'deep';
  skipScrape?: boolean;
  skipPdf?: boolean;
  skipGit?: boolean;
}

// ========== 缓存/去重 ==========
export interface CacheManifest {
  entries: Record<string, string>; // key -> firstSeenDate (YYYY-MM-DD)
}

// ========== 推送历史 ==========
export interface PushHistoryEntry {
  timestamp: string;
  channel: 'wecom' | 'pushplus';
  title: string;
  success: boolean;
  segments?: number;
  error?: string;
}

// ========== 健康检查 ==========
export interface HealthCheckResult {
  sourceName: string;
  healthy: boolean;
  latencyMs: number;
  url: string;
  error?: string;
}
