import 'dotenv/config';
import { CONFIG, REPORT_MODES, type ReportMode } from './config';
import { ArxivScraper } from './scrapers/arxiv';
import { HackerNewsScraper } from './scrapers/hackernews';
import { JiqizhixinScraper } from './scrapers/jiqizhixin';
import { GitHubTrendingScraper } from './scrapers/github';
import { DeepseekSummarizer } from './summarizer/deepseek';
import { PdfGenerator } from './pdf/generator';
import { pushToWechat } from './pusher';
import type { ArxivPaper, HNStory, JiqizhixinArticle, GitHubRepo } from './types';
import fs from 'fs/promises';
import path from 'path';

function parseArgs(): { mode: ReportMode; skipScrape: boolean; skipPdf: boolean; skipGit: boolean } {
  const args = process.argv.slice(2);
  return {
    mode: CONFIG.REPORT_MODE,
    skipScrape: args.includes('--skip-scrape'),
    skipPdf: args.includes('--skip-pdf'),
    skipGit: args.includes('--skip-git'),
  };
}

async function main() {
  const { mode, skipScrape, skipPdf } = parseArgs();
  const date = new Date().toISOString().split('T')[0];
  const modeLabel = CONFIG.MODE_PARAMS[mode].label;

  console.log('='.repeat(50));
  console.log(`AI 行业每日大事总结 — ${modeLabel}`);
  console.log(`日期: ${date}`);
  console.log('='.repeat(50));

  // ============ 1. 抓取数据 ============
  let arxivPapers: ArxivPaper[] = [];
  let hnStories: HNStory[] = [];
  let jqxArticles: JiqizhixinArticle[] = [];
  let githubRepos: GitHubRepo[] = [];

  if (!skipScrape) {
    console.log('\n--- 阶段 1/3: 数据抓取 ---');

    const scrapeResults = await Promise.allSettled([
      new ArxivScraper().scrape().then((r) => { arxivPapers = r; }),
      new HackerNewsScraper().scrape().then((r) => { hnStories = r; }),
      new JiqizhixinScraper().scrape().then((r) => { jqxArticles = r; }),
      new GitHubTrendingScraper().scrape().then((r) => { githubRepos = r; }),
    ]);

    const failures = scrapeResults.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`[警告] ${failures.length} 个数据源抓取失败:`);
      failures.forEach((f, i) => {
        if (f.status === 'rejected') console.warn(`  ${i + 1}. ${f.reason}`);
      });
    }

    const total = arxivPapers.length + hnStories.length + jqxArticles.length + githubRepos.length;
    if (total === 0) {
      console.error('[错误] 所有数据源都抓取失败，无法生成日报');
      process.exit(1);
    }
  }

  // ============ 2. 生成摘要 ============
  console.log('\n--- 阶段 2/3: 生成摘要 ---');
  let reportMarkdown: string;

  const summarizer = new DeepseekSummarizer();

  try {
    reportMarkdown = await summarizer.generateReport(
      arxivPapers,
      hnStories,
      jqxArticles,
      githubRepos,
      mode
    );
  } catch (err) {
    console.error('[错误] DeepSeek API 调用失败:', err instanceof Error ? err.message : err);
    console.log('[降级] 使用降级模式生成原始数据报告');
    reportMarkdown = summarizer.generateFallbackReport(arxivPapers, hnStories, jqxArticles, githubRepos);
  }

  // 保存 Markdown 版本作为备份
  const reportsDir = CONFIG.PDF_OUTPUT_DIR;
  await fs.mkdir(reportsDir, { recursive: true });
  const mdPath = path.join(reportsDir, `AI日报-${date}.md`);
  await fs.writeFile(mdPath, reportMarkdown, 'utf-8');
  console.log(`[Markdown] 已保存: ${mdPath}`);

  // ============ 3. 生成 PDF ============
  if (!skipPdf) {
    console.log('\n--- 阶段 3/3: 生成 PDF ---');
    try {
      const pdfGen = new PdfGenerator();
      const pdfPath = await pdfGen.generate(reportMarkdown, date);
      console.log(`[PDF] 已生成: ${pdfPath}`);

      // 同时打印 PDF 路径供 CI/脚本使用
      console.log(`PDF_OUTPUT=${pdfPath}`);
    } catch (err) {
      console.error('[错误] PDF 生成失败:', err instanceof Error ? err.message : err);
      console.log('[信息] Markdown 版本已保存，可直接使用');
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`完成！日报已保存至 ${reportsDir}`);
  console.log('='.repeat(50));

  // ============ 4. 推送到微信 ============
  await pushToWechat(`AI行业日报 | ${date}`, reportMarkdown);
}

main().catch((err) => {
  console.error('[致命错误]', err instanceof Error ? err.message : err);
  process.exit(1);
});
