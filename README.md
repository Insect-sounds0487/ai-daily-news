# AI 行业日报自动生成器

每天自动抓取 AI 行业最新动态，生成中文日报摘要，推送至企业微信 / 微信，并保存为 PDF。

## 特性

- **4 个数据源**：ArXiv cs.AI 论文、Hacker News AI 热帖、GitHub Trending AI 项目、机器之心文章
- **AI 摘要**：调用 DeepSeek API 生成专业中文日报，含技术点评
- **PDF 输出**：自动排版生成 A4 PDF，支持中文渲染（提供字体下载脚本）
- **多通道推送**：企业微信机器人（优先）、PushPlus（备选），含推送历史记录
- **三种模式**：轻量版 / 标准版 / 深度版，适应不同阅读需求
- **定时运行**：GitHub Actions 每天北京时间 8:00 自动执行
- **容错设计**：单源抓取失败不影响其他源，API 不可用时降级输出原始数据
- **抓取稳定性**：健康检查 + 自动重试 + 请求超时，临时故障自动恢复
- **缓存去重**：同一天重复运行跳过已处理条目，避免重复推送

## 快速开始

### 前置准备

- **Node.js** >= 18
- **DeepSeek API Key**（[获取地址](https://platform.deepseek.com/api_keys)）

### 1. 克隆并一键初始化

```bash
git clone https://github.com/Insect-sounds0487/ai-daily-news.git
cd ai-daily-news
npm run setup
```

`npm run setup` 会自动完成：
- 从 `.env.example` 创建 `.env`
- 安装 npm 依赖
- 安装 Playwright Chromium 浏览器
- 下载中文字体（用于 PDF 渲染）

### 2. 配置环境变量

编辑 `.env` 文件，填入你的 API Key：

```ini
# === 必填 ===
DEEPSEEK_API_KEY=sk-你的key

# === 可选 ===
REPORT_MODE=standard

# 推送方式一：企业微信机器人（选填）
WECOM_WEBHOOK_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 推送方式二：PushPlus（选填，与企业微信二选一或同时使用）
PUSHPLUS_TOKEN=你的pushplus_token
```

### 3. 运行

```bash
# 标准模式（推荐，10-15分钟阅读）
npm run dev

# 轻量模式（~5分钟阅读）
npm run dev:light

# 深度模式（通勤细读）
npm run dev:deep
```

## 三种模式对比

| 模式 | 命令 | 阅读时间 | ArXiv | Hacker News | 机器之心 | GitHub |
|------|------|----------|-------|-------------|----------|--------|
| light | `npm run dev:light` | ~5 分钟 | 8 篇 | 15 条 | 5 篇 | 5 个 |
| standard | `npm run dev` | 10-15 分钟 | 20 篇 | 30 条 | 10 篇 | 8 个 |
| deep | `npm run dev:deep` | 通勤细读 | 30 篇 | 50 条 | 15 篇 | 12 个 |

## 推送配置

### 企业微信机器人（推荐）

1. 在企业微信群中添加群机器人，获取 Webhook URL
2. URL 格式：`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`
3. 将 `key` 参数值填入 `WECOM_WEBHOOK_KEY`
4. 日报内容超过 4096 字节时会自动分段发送

### PushPlus

1. 在 [PushPlus](https://www.pushplus.plus/) 注册并获取 Token
2. 填入 `PUSHPLUS_TOKEN`

> 推送优先级：企业微信机器人 > PushPlus。配置企业微信后，PushPlus 作为备用通道。

## 部署方式

### 方式一：GitHub Actions（推荐）

项目已包含 GitHub Actions 工作流，每天北京时间 8:00 自动运行。

**配置步骤：**

1. Fork 或推送代码到你的 GitHub 仓库
2. 进入仓库 Settings → Secrets and variables → Actions
3. 添加以下 Secrets：

| Secret | 说明 |
|--------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key（必填） |
| `WECOM_WEBHOOK_KEY` | 企业微信 Webhook Key（选填） |
| `PUSHPLUS_TOKEN` | PushPlus Token（选填） |
| `GH_PAT` | GitHub Personal Access Token，用于提交生成的 PDF（需要 `repo` + `workflow` 权限） |

4. 进入 Actions 页面，手动触发一次测试运行：选择 "AI日报自动生成" → "Run workflow"

### 方式二：Docker

```bash
docker build -t ai-daily-news .
docker run -e DEEPSEEK_API_KEY=sk-xxx -e WECOM_WEBHOOK_KEY=xxx ai-daily-news
```

也可以使用 `--env-file` 传入配置：

```bash
docker run --env-file .env ai-daily-news
```

### 方式三：本地开发

```bash
npm run dev          # 标准版（抓取 → 摘要 → PDF → 推送）
npm run dev:light    # 轻量版
npm run dev:deep     # 深度版
```

支持 CLI 参数：

```bash
npm run dev -- --mode=light          # 指定模式（优先级高于 .env 中的 REPORT_MODE）
npm run dev -- --skip-pdf            # 不生成 PDF
npm run dev -- --skip-scrape         # 跳过抓取（使用空数据，用于测试摘要生成）
```

完整命令列表：

| 命令 | 说明 |
|------|------|
| `npm run setup` | 一键初始化（推荐新用户使用） |
| `npm run dev` | 标准模式运行 |
| `npm run dev:light` | 轻量模式运行 |
| `npm run dev:deep` | 深度模式运行 |
| `npm run setup-fonts` | 单独下载中文字体 |
| `npm run build` | TypeScript 编译 |

## 项目结构

```
├── src/
│   ├── index.ts               # 主编排器
│   ├── config.ts              # 配置（数据源、模式参数、关键词）
│   ├── types.ts               # 类型定义
│   ├── cache.ts               # 缓存去重模块（避免同一天重复推送）
│   ├── pusher.ts              # 推送模块（企业微信 + PushPlus，含推送历史记录）
│   ├── utils/
│   │   ├── retry.ts           # 通用重试工具
│   │   └── health.ts          # 健康检查工具
│   ├── scrapers/
│   │   ├── arxiv.ts           # ArXiv 抓取器
│   │   ├── hackernews.ts      # Hacker News 抓取器
│   │   ├── jiqizhixin.ts      # 机器之心抓取器
│   │   └── github.ts          # GitHub Trending 抓取器
│   ├── summarizer/
│   │   ├── deepseek.ts        # DeepSeek API 调用
│   │   └── prompts.ts         # 提示词模板
│   └── pdf/
│       └── generator.ts       # PDF 生成器
├── scripts/
│   ├── setup.ts               # 一键初始化脚本
│   └── download-fonts.ts      # 中文字体下载脚本
├── .github/workflows/
│   └── daily-report.yml       # GitHub Actions 工作流
├── reports/                   # 日报输出目录（含缓存/推送历史）
├── Dockerfile                 # Docker 镜像
└── entrypoint.sh              # 容器入口脚本
```

## 数据源说明

| 来源 | 抓取方式 | 特点 |
|------|----------|------|
| **ArXiv cs.AI** | Playwright 渲染 | 当日最新论文，含标题、作者、摘要链接 |
| **Hacker News** | Firebase REST API | 按 AI 关键词过滤（30+ 关键词），按热度排序 |
| **GitHub Trending** | Playwright 渲染 | AI 相关仓库，按 topics 和描述过滤 |
| **机器之心** | Playwright 点击拦截 | React SPA，需捕获新标签页获取 URL |

## 输出示例

运行后生成：
- `reports/AI日报-YYYY-MM-DD.md` — Markdown 源文件
- `reports/AI日报-YYYY-MM-DD.pdf` — 格式化 PDF
- 企业微信 / 微信推送通知

## 环境变量一览

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API Key |
| `REPORT_MODE` | 否 | 日报模式：`light` / `standard` / `deep`，默认 `standard` |
| `WECOM_WEBHOOK_KEY` | 否 | 企业微信机器人 Webhook Key |
| `PUSHPLUS_TOKEN` | 否 | PushPlus Token |
| `GH_PAT` | 否 | GitHub Personal Access Token，Actions 中提交 PDF 到仓库时需要（`repo` + `workflow` 权限） |
| `GIT_AUTHOR_NAME` | 否 | Git 提交者名称，默认 `AI News Bot` |
| `GIT_AUTHOR_EMAIL` | 否 | Git 提交者邮箱，默认 `bot@ai-daily-news.local` |

## 常见问题

**Q: 报告是中文还是英文？**

日报正文为中文，英文论文/文章标题保留原文，技术点评使用中文。

**Q: 抓取失败怎么办？**

使用 `Promise.allSettled` 并行抓取，单个源失败不影响其他源。如果所有源都失败，程序会报错退出。DeepSeek API 不可用时，自动降级为原始数据报告。

**Q: 日报内容太长怎么办？**

企业微信机器人有 4096 字节限制，程序会自动按章节分段发送，每段标注（续 2/N）等编号。PushPlus 无此限制。

**Q: 如何修改定时运行时间？**

编辑 `.github/workflows/daily-report.yml` 中的 cron 表达式（当前为 `0 0 * * *`，即北京时间 8:00）。

**Q: 同一天多次运行会重复推送吗？**

不会。程序内置去重缓存（`reports/.cache.json`），已处理的条目会自动跳过。缓存会在一段时间后自动清理。

**Q: 如何添加自己的数据源？**

可以。在 `src/scrapers/` 下新建抓取器类，实现 `scrape()` 方法，在 `src/index.ts` 中添加调用即可。

**Q: PDF 中文显示方框怎么办？**

运行 `npm run setup-fonts` 下载中文字体，或手动将 Noto Sans SC 字体放入 `fonts/` 目录。

**Q: 推送历史存在哪里？**

每次推送结果记录在 `reports/push-history.json`，包含时间、渠道、是否成功等。

## 许可证

MIT
