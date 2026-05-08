import OpenAI from 'openai';
import { CONFIG, type ReportMode } from '../config';
import { buildSystemPrompt, buildUserPrompt } from './prompts';
import type { ArxivPaper, HNStory, JiqizhixinArticle, GitHubRepo } from '../types';

export class DeepseekSummarizer {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.DEEPSEEK_API_KEY || '';
      if (!apiKey) {
        throw new Error('未设置 DEEPSEEK_API_KEY 环境变量');
      }
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.deepseek.com',
      });
    }
    return this.client;
  }

  async generateReport(
    arxivPapers: ArxivPaper[],
    hnStories: HNStory[],
    jqxArticles: JiqizhixinArticle[],
    githubRepos: GitHubRepo[],
    mode: ReportMode = CONFIG.REPORT_MODE
  ): Promise<string> {
    const maxTokens = CONFIG.MODE_PARAMS[mode].deepseekMaxTokens;

    console.log(`[DeepSeek] 正在生成${CONFIG.MODE_PARAMS[mode].label}日报...`);
    console.log(`[DeepSeek] 输入数据: ArXiv ${arxivPapers.length} 篇, HN ${hnStories.length} 条, GitHub ${githubRepos.length} 个, 机器之心 ${jqxArticles.length} 篇`);

    const response = await this.getClient().chat.completions.create({
      model: CONFIG.DEEPSEEK_MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: buildSystemPrompt(mode) },
        { role: 'user', content: buildUserPrompt(arxivPapers, hnStories, jqxArticles, githubRepos, mode) },
      ],
    });

    const text = response.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('DeepSeek 返回内容为空');
    }

    console.log(`[DeepSeek] 日报生成完成，约 ${text.length} 字`);
    return text;
  }

  generateFallbackReport(
    arxivPapers: ArxivPaper[],
    hnStories: HNStory[],
    jqxArticles: JiqizhixinArticle[],
    githubRepos: GitHubRepo[]
  ): string {
    const date = new Date().toISOString().split('T')[0];

    return [
      `# AI 行业日报 | ${date}（降级版 - API 不可用）`,
      ``,
      `## 说明`,
      `DeepSeek API 暂时不可用，以下为原始抓取数据的直接呈现。`,
      ``,
      `## ArXiv cs.AI 论文（${arxivPapers.length} 篇）`,
      ...arxivPapers.map((p) => `- **${p.title}** — ${p.abstractUrl}`),
      ``,
      `## Hacker News AI 热帖（${hnStories.length} 条）`,
      ...hnStories.map((s) => `- **${s.title}** (得分: ${s.score}) — ${s.url || `https://news.ycombinator.com/item?id=${s.id}`}`),
      ``,
      `## GitHub Trending AI 仓库（${githubRepos.length} 个）`,
      ...githubRepos.map((r) => `- **${r.name}** ⭐+${r.starsToday} — ${r.description} — ${r.url}`),
      ``,
      `## 机器之心（${jqxArticles.length} 篇）`,
      ...jqxArticles.map((a) => `- **${a.title}** (${a.date})${a.url ? ` — ${a.url}` : ''}`),
      ``,
      `*降级报告由 AI 自动生成 | ${new Date().toISOString()}*`,
    ].join('\n');
  }
}
