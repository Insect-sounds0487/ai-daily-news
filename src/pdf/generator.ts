import { chromium } from 'playwright';
import { marked } from 'marked';
import { CONFIG } from '../config';
import fs from 'fs/promises';
import path from 'path';

export class PdfGenerator {
  /**
   * 将 Markdown 日报转换为 PDF。
   * 使用 Playwright 的 CSS 打印引擎渲染，支持中文排版。
   */
  async generate(markdownContent: string, date: string): Promise<string> {
    const html = await this.renderHtml(markdownContent, date);

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle' });

      // 创建输出目录
      const pdfDir = CONFIG.PDF_OUTPUT_DIR;
      await fs.mkdir(pdfDir, { recursive: true });

      const filename = `AI日报-${date}.pdf`;
      const filepath = path.join(pdfDir, filename);

      await page.pdf({
        path: filepath,
        format: 'A4',
        margin: {
          top: '25mm',
          bottom: '25mm',
          left: '20mm',
          right: '20mm',
        },
        printBackground: true,
        displayHeaderFooter: false,
      });

      console.log(`[PDF] 已生成: ${filepath}`);
      return filepath;
    } finally {
      await browser.close();
    }
  }

  private async renderHtml(markdown: string, date: string): Promise<string> {
    // 将 Markdown 转换为 HTML
    const bodyHtml = await marked.parse(markdown);

    // 检查本地是否有中文字体
    const fontFace = await this.buildFontFace();

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  ${fontFace}

  * {
    font-family: ${this.getFontFamily()};
    box-sizing: border-box;
  }

  body {
    max-width: 800px;
    margin: 0 auto;
    padding: 0;
    color: #1a1a1a;
    line-height: 1.8;
    font-size: 11pt;
  }

  h1 {
    font-size: 22pt;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 12px;
    color: #1e3a5f;
    margin-top: 0;
  }

  h2 {
    font-size: 15pt;
    margin-top: 28px;
    margin-bottom: 8px;
    color: #2563eb;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 4px;
  }

  h3 {
    font-size: 12pt;
    margin-top: 20px;
    margin-bottom: 6px;
    color: #374151;
  }

  a {
    color: #2563eb;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  ul, ol {
    padding-left: 24px;
  }

  li {
    margin-bottom: 10px;
    line-height: 1.7;
  }

  strong {
    color: #111827;
  }

  hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 24px 0;
  }

  .overview {
    background: #f0f7ff;
    padding: 16px 20px;
    border-radius: 8px;
    border-left: 4px solid #2563eb;
    margin-bottom: 20px;
  }

  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    font-size: 9pt;
    color: #9ca3af;
    text-align: center;
  }

  .footer a {
    color: #9ca3af;
  }

  blockquote {
    border-left: 3px solid #d1d5db;
    margin: 16px 0;
    padding: 8px 16px;
    color: #4b5563;
    background: #f9fafb;
  }

  code {
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 9.5pt;
    background: #f3f4f6;
    padding: 1px 4px;
    border-radius: 3px;
  }

  pre {
    background: #f3f4f6;
    padding: 12px 16px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.5;
  }

  @media print {
    body { padding: 0; }
    @page {
      size: A4;
      margin: 20mm 25mm;
    }
    a { color: #1a1a1a; text-decoration: none; }
    a[href^="http"]::after {
      content: " (" attr(href) ")";
      font-size: 8pt;
      color: #6b7280;
    }
  }
</style>
</head>
<body>
  ${bodyHtml}
  <div class="footer">
    本报告由 AI 自动生成 | ${date} | 数据来源: ArXiv, Hacker News, GitHub Trending, 机器之心
  </div>
</body>
</html>`;
  }

  /**
   * 构建 @font-face CSS。优先使用本地字体文件，回退到系统字体。
   * Docker 环境安装了 fonts-noto-cjk，直接用系统字体即可。
   */
  private async buildFontFace(): Promise<string> {
    const fontPath = path.join(CONFIG.FONT_DIR, 'NotoSansSC-Regular.ttf');
    try {
      await fs.access(fontPath);
      const fontUrl = `file:///${fontPath.replace(/\\/g, '/')}`;
      return `
@font-face {
  font-family: 'Noto Sans SC Local';
  src: url('${fontUrl}') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}`;
    } catch {
      return ''; // 没有本地字体文件，使用系统字体
    }
  }

  private getFontFamily(): string {
    return [
      "'Noto Sans SC Local'",
      "'Noto Sans SC'",
      "'Noto Sans CJK SC'",
      "'Microsoft YaHei'",
      "'PingFang SC'",
      "'Hiragino Sans GB'",
      'sans-serif',
    ].join(', ');
  }
}
