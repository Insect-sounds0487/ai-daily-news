import 'dotenv/config';
import path from 'path';

export const REPORT_MODES = ['light', 'standard', 'deep'] as const;
export type ReportMode = (typeof REPORT_MODES)[number];

export function getReportMode(): ReportMode {
  const mode = (process.env.REPORT_MODE || 'standard').toLowerCase() as ReportMode;
  if (REPORT_MODES.includes(mode)) return mode;
  return 'standard';
}

export const CONFIG = {
  // 日报模式
  REPORT_MODE: getReportMode(),

  // --- 各模式参数 ---
  MODE_PARAMS: {
    light: {
      label: '轻量版',
      description: '每源 5-8 条精选 + 一句话技术点评，<5 分钟阅读',
      arxivMax: 8,
      hnMax: 15,
      hnFilterTop: 20,
      jqxMax: 5,
      jqxClickUrls: 3,
      githubTrendMax: 5,
      highlightedTotal: 5,
      deepseekMaxTokens: 2048,
    },
    standard: {
      label: '标准版',
      description: '每源 10-15 条 + 简短摘要段落 + 关键评论，10-15 分钟阅读',
      arxivMax: 20,
      hnMax: 30,
      hnFilterTop: 40,
      jqxMax: 10,
      jqxClickUrls: 5,
      githubTrendMax: 8,
      highlightedTotal: 10,
      deepseekMaxTokens: 4096,
    },
    deep: {
      label: '深度版',
      description: '每源 15-20 条 + 技术要点提炼 + 代码/链接，适合通勤细读',
      arxivMax: 30,
      hnMax: 50,
      hnFilterTop: 60,
      jqxMax: 15,
      jqxClickUrls: 8,
      githubTrendMax: 12,
      highlightedTotal: 15,
      deepseekMaxTokens: 6144,
    },
  } as const,

  // --- 数据源 URL ---
  ARXIV_CS_AI_RECENT: 'https://arxiv.org/list/cs.AI/recent',
  HN_TOP_STORIES: 'https://hacker-news.firebaseio.com/v0/topstories.json',
  HN_ITEM_BASE: 'https://hacker-news.firebaseio.com/v0/item',
  JIQIZHIXIN_HOME: 'https://www.jiqizhixin.com/',
  GITHUB_TRENDING: 'https://github.com/trending?since=daily',

  // --- HN AI 关键词（中英文） ---
  HN_AI_KEYWORDS: [
    'ai', 'artificial intelligence', 'llm', 'gpt', 'claude', 'gemini',
    'machine learning', 'deep learning', 'neural network', 'transformer',
    'openai', 'anthropic', 'meta ai', 'google deepmind',
    'diffusion', 'generative', 'agent', 'rag', 'fine-tuning', 'finetune',
    'nlp', 'computer vision', 'reinforcement learning', 'rlhf',
    'cuda', 'gpu', 'tpu', 'inference',
    'robot', 'robotics', 'autonomous', 'self-driving',
    'langchain', 'vector database', 'embedding', 'token',
    'pytorch', 'tensorflow', 'jax', 'hugging face',
    'copilot', 'code generation', 'codex',
  ],

  // --- DeepSeek ---
  DEEPSEEK_MODEL: 'deepseek-chat',

  // --- 路径 ---
  PDF_OUTPUT_DIR: path.resolve(__dirname, '../reports'),
  FONT_DIR: path.resolve(__dirname, '../fonts'),

  // --- 时间/重试 ---
  SCRAPE_TIMEOUT_MS: 30_000,
  BATCH_DELAY_MS: 1_000,
  RETRY_MAX: 3,
  RETRY_BACKOFF_MS: 2_000,

  // --- 缓存/去重 ---
  CACHE_FILE: path.resolve(__dirname, '../reports/.cache.json'),
  DEDUP_WINDOW_DAYS: 7,

  // --- 推送历史 ---
  PUSH_HISTORY_FILE: path.resolve(__dirname, '../reports/push-history.json'),

  // --- 健康检查 ---
  HEALTH_CHECK_TIMEOUT_MS: 5_000,

  // --- User-Agent ---
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
} as const;
