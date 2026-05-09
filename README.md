# AI 行业日报自动生成器

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/DeepSeek-4A90D9?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04IDhzMy41OSA4IDggOCA4LTMuNTkgOC04LTMuNTktOC04LTh6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==" alt="DeepSeek">
  <img src="https://img.shields.io/badge/Playwright-1.52-2EAD33?logo=playwright&logoColor=white" alt="Playwright">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white" alt="Docker">
</p>

<p align="center">
  <b>每天自动抓取 AI 行业最新动态，生成中文日报摘要，推送至微信 / 企业微信，并保存为 PDF。</b><br>
  打破信息壁垒，让 AI 资讯触手可及。
</p>

---

## 特性

| | 特性 | 说明 |
|---|------|------|
| 📡 | **四源聚合** | ArXiv 论文 · Hacker News 热帖 · GitHub Trending 仓库 · 机器之心文章 |
| 🤖 | **AI 摘要** | 调用 DeepSeek API 生成专业中文日报，含技术点评 |
| 📄 | **PDF 输出** | 自动排版 A4 PDF，支持中文字体渲染 |
| 📱 | **多通道推送** | 企业微信机器人（优先） + PushPlus（备选） |
| 📜 | **推送历史** | 每次推送记录时间、渠道、结果，可追溯 |
| 🧹 | **缓存去重** | 同一天重复运行自动跳过已处理条目，避免重复推送 |
| 🔁 | **自动重试** | 网络波动自动重试（3 次指数退避），临时故障自动恢复 |
| 🩺 | **健康检查** | 抓取前探活，源不可达时 warn 不阻断 |
| 🎯 | **三种模式** | 轻量版 / 标准版 / 深度版，适应不同阅读场景 |
| ⏰ | **定时运行** | GitHub Actions 每天 8:00 自动执行，也支持 Docker 部署 |
| 🛡️ | **容错设计** | 单源失败不影响其他源，API 不可用时降级输出原始数据 |
| ☝️ | **一键初始化** | `npm run setup` 自动完成全部环境配置 |

---

## 快速开始

### 前置准备

- **Node.js** >= 18
- **DeepSeek API Key**（[免费获取](https://platform.deepseek.com/api_keys)）

### 1. 克隆并一键初始化

```bash
git clone https://github.com/Insect-sounds0487/ai-daily-news.git
cd ai-daily-news
npm run setup
```

`npm run setup` 会自动完成：
1. 从 `.env.example` 创建 `.env`
2. 安装 npm 依赖
3. 安装 Playwright Chromium 浏览器
4. 下载中文字体（用于 PDF 渲染）

### 2. 配置环境变量

编辑 `.env`，填入你的 API Key：

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

也可通过 CLI 参数指定模式：

```bash
npm run dev -- --mode=light    # 临时切换模式
npm run dev -- --skip-pdf      # 跳过 PDF 生成
npm run dev -- --skip-scrape   # 跳过抓取（用于测试摘要）
```

---

## 三种模式对比

| 模式 | 命令 | 阅读时间 | ArXiv | Hacker News | 机器之心 | GitHub |
|------|------|----------|-------|-------------|----------|--------|
| 🌤️ 轻量版 | `npm run dev:light` | ~5 分钟 | 8 篇 | 15 条 | 5 篇 | 5 个 |
| ☀️ 标准版 | `npm run dev` | 10-15 分钟 | 20 篇 | 30 条 | 10 篇 | 8 个 |
| 🔬 深度版 | `npm run dev:deep` | 通勤细读 | 30 篇 | 50 条 | 15 篇 | 12 个 |

---

## 推送配置

### 企业微信机器人（推荐）

1. 在企业微信群中添加群机器人，获取 Webhook URL
2. URL 格式：`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`
3. 将 `key` 参数值填入 `WECOM_WEBHOOK_KEY`
4. 日报内容超过 4096 字节限制时会自动按章节分段发送，标注 `(续 2/N)` 编号

### PushPlus

1. 在 [PushPlus](https://www.pushplus.plus/) 注册并获取 Token
2. 填入 `PUSHPLUS_TOKEN`

> 推送优先级：企业微信机器人 → PushPlus。配置企业微信后，PushPlus 作为备用通道。

### 推送历史

每次推送结果记录在 `reports/push-history.json`：

```json
[
  {
    "timestamp": "2026-05-09T08:00:00.000Z",
    "channel": "wecom",
    "title": "AI行业日报 | 2026-05-09",
    "success": true,
    "segments": 3
  }
]
```

---

## 部署方式

### 方式一：GitHub Actions（推荐）

项目已包含 GitHub Actions 工作流，每天北京时间 8:00 自动运行。

**配置步骤：**

1. Fork 或推送代码到你的 GitHub 仓库
2. 进入仓库 **Settings → Secrets and variables → Actions**
3. 添加以下 Secrets：

| Secret | 必填 | 说明 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API Key |
| `WECOM_WEBHOOK_KEY` | ❌ | 企业微信 Webhook Key |
| `PUSHPLUS_TOKEN` | ❌ | PushPlus Token |
| `GH_PAT` | ❌ | GitHub PAT（用于自动提交 PDF，需 `repo` + `workflow` 权限） |

4. 进入 Actions 页面 → **AI日报自动生成** → **Run workflow** 手动触发测试

### 方式二：Docker

```bash
docker build -t ai-daily-news .
docker run -e DEEPSEEK_API_KEY=sk-xxx \
           -e WECOM_WEBHOOK_KEY=xxx \
           -e GH_PAT=github_pat_xxx \
           ai-daily-news
```

或使用环境变量文件：

```bash
docker run --env-file .env ai-daily-news
```

> Docker 镜像基于 Playwright 官方镜像，内置 Chromium + 中文字体（`fonts-noto-cjk`）。
> 设置 `GH_PAT` 可让容器自动提交生成的 PDF 到仓库。

### 方式三：本地开发

```bash
npm run dev              # 标准版（抓取 → AI 摘要 → PDF → 推送）
npm run dev:light        # 轻量版
npm run dev:deep         # 深度版
npm run dev -- --mode=light --skip-pdf  # 组合参数
```

---

## 命令参考

| 命令 | 说明 |
|------|------|
| `npm run setup` | **一键初始化**（推荐新用户使用） |
| `npm run dev` | 标准模式运行 |
| `npm run dev:light` | 轻量模式运行 |
| `npm run dev:deep` | 深度模式运行 |
| `npm run setup-fonts` | 单独下载中文字体 |
| `npm run build` | TypeScript 编译 |
| `npm run start` | 运行编译后的版本 |

### CLI 参数

| 参数 | 说明 |
|------|------|
| `--mode=light\|standard\|deep` | 指定日报模式（优先级高于 `.env` 中的 `REPORT_MODE`） |
| `--skip-pdf` | 跳过 PDF 生成 |
| `--skip-scrape` | 跳过抓取（使用空数据，用于测试摘要生成） |

---

## 项目结构

```
ai-daily-news/
├── src/
│   ├── index.ts               # 主编排器
│   ├── config.ts              # 配置（数据源、模式参数、关键词）
│   ├── types.ts               # 类型定义
│   ├── cache.ts               # 缓存去重模块（避免同天重复推送）
│   ├── pusher.ts              # 推送模块（企业微信 + PushPlus，含推送历史）
│   ├── utils/
│   │   ├── retry.ts           # 通用重试工具（3 次指数退避）
│   │   └── health.ts          # 健康检查工具（fetch + AbortSignal 探活）
│   ├── scrapers/
│   │   ├── arxiv.ts           # ArXiv cs.AI 抓取器
│   │   ├── hackernews.ts      # Hacker News 抓取器（AI 关键词过滤）
│   │   ├── jiqizhixin.ts      # 机器之心抓取器（React SPA 新标签页捕获）
│   │   └── github.ts          # GitHub Trending 抓取器（AI topics/描述过滤）
│   ├── summarizer/
│   │   ├── deepseek.ts        # DeepSeek API 调用 + 降级报告
│   │   └── prompts.ts         # 提示词模板（三种模式差异化 prompt）
│   └── pdf/
│       └── generator.ts       # PDF 生成器（Playwright 渲染引擎）
├── scripts/
│   ├── setup.ts               # 一键初始化脚本
│   └── download-fonts.ts      # 中文字体下载脚本（Noto Sans SC）
├── reports/                   # 日报输出目录（MD + PDF + 缓存 + 推送历史）
├── .github/workflows/
│   └── daily-report.yml       # GitHub Actions 工作流
├── Dockerfile                 # Docker 镜像
└── entrypoint.sh              # 容器入口脚本（含 Git 自动提交）
```

---

## 数据源说明

| 来源 | 抓取方式 | 特点 |
|------|----------|------|
| **ArXiv cs.AI** | Playwright 渲染 | 当日最新论文，含标题、作者、摘要链接 |
| **Hacker News** | Firebase REST API | 按 30+ AI 关键词过滤，按热度排序，带超时 + 重试 |
| **GitHub Trending** | Playwright 渲染 | 按 20+ AI topics 和描述过滤 |
| **机器之心** | Playwright 点击拦截 | React SPA，捕获新标签页获取 URL |

### 稳定性保障

| 机制 | 说明 |
|------|------|
| 🔁 自动重试 | 每个源最多重试 3 次，2000ms 指数退避间隔 |
| 🩺 健康检查 | 抓取前对所有源执行 HTTP 探活，失败仅 warn 不阻断 |
| ⏱️ 请求超时 | 所有请求 30 秒超时，配套 AbortController 清理 |
| 🛡️ 单源容错 | `Promise.allSettled` 并行抓取，单源失败不影响其他源 |
| 📉 API 降级 | DeepSeek API 不可用时，自动降级为原始数据汇编报告 |
| 🧹 缓存去重 | 同一天重复运行自动跳过已处理条目（缓存保存 7 天） |

---

## 环境变量一览

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DEEPSEEK_API_KEY` | ✅ | — | DeepSeek API Key |
| `REPORT_MODE` | ❌ | `standard` | 日报模式：`light` / `standard` / `deep` |
| `WECOM_WEBHOOK_KEY` | ❌ | — | 企业微信机器人 Webhook Key |
| `PUSHPLUS_TOKEN` | ❌ | — | PushPlus Token |
| `GH_PAT` | ❌ | — | GitHub PAT，用于 Docker 中自动提交 PDF |
| `GIT_AUTHOR_NAME` | ❌ | `AI News Bot` | Git 提交者名称 |
| `GIT_AUTHOR_EMAIL` | ❌ | `bot@ai-daily-news.local` | Git 提交者邮箱 |

---

## 常见问题

<details>
<summary><b>报告是中文还是英文？</b></summary>
日报正文为中文，英文论文/文章标题保留原文，技术点评使用中文。
</details>

<details>
<summary><b>抓取失败怎么办？</b></summary>
使用 `Promise.allSettled` 并行抓取，单个源失败不影响其他源。如果所有源都失败，程序会报错退出。DeepSeek API 不可用时，自动降级为原始数据报告。
</details>

<details>
<summary><b>日报内容太长怎么办？</b></summary>
企业微信机器人有 4096 字节限制，程序会自动按章节分段发送，每段标注 `(续 2/N)` 等编号。PushPlus 无此限制。
</details>

<details>
<summary><b>同一天多次运行会重复推送吗？</b></summary>
不会。程序内置去重缓存（`reports/.cache.json`），已处理的条目会自动跳过。缓存保留 7 天，过期自动清理。
</details>

<details>
<summary><b>如何查看推送历史？</b></summary>
每次推送结果记录在 `reports/push-history.json`，包含时间、渠道、是否成功、分段数等。
</details>

<details>
<summary><b>PDF 中文显示方框怎么办？</b></summary>
运行 `npm run setup-fonts` 下载中文字体，或在 Docker 中使用内置的 `fonts-noto-cjk`。
</details>

<details>
<summary><b>如何添加自己的数据源？</b></summary>
在 `src/scrapers/` 下新建抓取器类，实现 `scrape()` 和 `isHealthy()` 方法，在 `src/index.ts` 中添加调用即可。
</details>

<details>
<summary><b>如何修改定时运行时间？</b></summary>
编辑 `.github/workflows/daily-report.yml` 中的 cron 表达式（当前为 `0 0 * * *`，即北京时间 8:00）。
</details>

---

## 输出示例

运行后会生成：

```
reports/
├── AI日报-2026-05-09.md        # Markdown 源文件
├── AI日报-2026-05-09.pdf       # 格式化 PDF
├── .cache.json                  # 去重缓存（自动管理）
└── push-history.json            # 推送历史记录
```

推送通知（企业微信 / PushPlus）同步送达。

---

## 许可证

MIT © Insect-sounds0487
