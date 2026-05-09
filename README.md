# AI Daily News Generator

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/DeepSeek-4A90D9?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04IDhzMy41OSA4IDggOCA4LTMuNTkgOC04LTMuNTktOC04LTh6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==" alt="DeepSeek">
  <img src="https://img.shields.io/badge/Playwright-1.52-2EAD33?logo=playwright&logoColor=white" alt="Playwright">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white" alt="Docker">
</p>

<p align="center">
  <b>Automatically collect the latest AI industry news, generate daily digests in Chinese, push to WeChat / WeCom, and save as PDF.</b><br>
  Break down information barriers — make AI news accessible to everyone.
</p>

<p align="center">
  <a href="README.zh.md">🇨🇳 中文版</a>
</p>

---

## Features

| | Feature | Description |
|---|---------|-------------|
| 📡 | **Quad-Source Aggregation** | ArXiv papers · Hacker News top posts · GitHub Trending repos · Jiqizhixin articles |
| 🤖 | **AI Summarization** | Calls DeepSeek API to generate professional daily digests with technical commentary |
| 📄 | **PDF Output** | Automatically formatted A4 PDF with CJK font rendering |
| 📱 | **Multi-Channel Push** | WeCom Bot (primary) + PushPlus (fallback) |
| 📜 | **Push History** | Every push records timestamp, channel, result — fully traceable |
| 🧹 | **Cache Deduplication** | Re-running on the same day automatically skips already-processed items |
| 🔁 | **Auto Retry** | Exponential backoff (3 attempts + jitter) for network flakiness |
| 🩺 | **Health Check** | HEAD probe before scraping; warns without blocking when sources are unreachable |
| 🎯 | **Three Modes** | Light / Standard / Deep — tailored for different reading scenarios |
| ⏰ | **Scheduled Runs** | GitHub Actions daily at 8:00 AM CST, also supports Docker deployment |
| 🛡️ | **Fault Tolerance** | Single-source failure doesn't affect others; graceful degradation when API is down |
| 🖥️ | **Shared Browser** | 3 Playwright scrapers reuse 1 Chromium instance — 60% less memory |
| ☝️ | **One-Click Setup** | `npm run setup` completes all environment configuration automatically |

---

## Quick Start

### Prerequisites

- **Node.js** >= 18
- **DeepSeek API Key** ([Get one free](https://platform.deepseek.com/api_keys))

### 1. Clone and One-Click Setup

```bash
git clone https://github.com/Insect-sounds0487/ai-daily-news.git
cd ai-daily-news
npm run setup
```

`npm run setup` automates:
1. Creates `.env` from `.env.example`
2. Installs npm dependencies
3. Installs Playwright Chromium browser
4. Downloads CJK fonts (for PDF rendering)

### 2. Configure Environment Variables

Edit `.env` and fill in your API Key:

```ini
# === Required ===
DEEPSEEK_API_KEY=sk-your-key

# === Optional ===
REPORT_MODE=standard

# Push Channel 1: WeCom Bot (optional)
WECOM_WEBHOOK_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Push Channel 2: PushPlus (optional, use alongside or instead of WeCom)
PUSHPLUS_TOKEN=your_pushplus_token
```

### 3. Run

```bash
# Standard mode (recommended, 10-15 min read)
npm run dev

# Light mode (~5 min read)
npm run dev:light

# Deep mode (commute-friendly deep read)
npm run dev:deep
```

Or specify mode via CLI arguments:

```bash
npm run dev -- --mode=light      # Switch mode temporarily
npm run dev -- --skip-pdf        # Skip PDF generation
npm run dev -- --skip-scrape     # Skip scraping (test summarization only)
```

---

## Mode Comparison

| Mode | Command | Read Time | ArXiv | Hacker News | Jiqizhixin | GitHub |
|------|---------|-----------|-------|-------------|------------|--------|
| 🌤️ Light | `npm run dev:light` | ~5 min | 8 papers | 15 posts | 5 articles | 5 repos |
| ☀️ Standard | `npm run dev` | 10-15 min | 20 papers | 30 posts | 10 articles | 8 repos |
| 🔬 Deep | `npm run dev:deep` | Commute read | 30 papers | 50 posts | 15 articles | 12 repos |

---

## Push Configuration

### WeCom Bot (Recommended)

1. Add a group bot in WeCom and get the Webhook URL
2. URL format: `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`
3. Fill the `key` parameter value into `WECOM_WEBHOOK_KEY`
4. If the digest exceeds the 4096-byte limit, it's automatically split and sent in sections with `(cont. 2/N)` numbering

### PushPlus

1. Register at [PushPlus](https://www.pushplus.plus/) and get your Token
2. Fill it in as `PUSHPLUS_TOKEN`

> Push priority: WeCom Bot → PushPlus. PushPlus serves as a backup channel when WeCom is configured.

### Push History

Push results are recorded in `reports/push-history.json`:

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

## Deployment

### Option 1: GitHub Actions (Recommended)

The project includes a GitHub Actions workflow that runs daily at 8:00 AM CST.

**Setup:**

1. Fork or push code to your GitHub repository
2. Go to **Settings → Secrets and variables → Actions**
3. Add the following Secrets:

| Secret | Required | Description |
|--------|----------|-------------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API Key |
| `WECOM_WEBHOOK_KEY` | ❌ | WeCom Webhook Key |
| `PUSHPLUS_TOKEN` | ❌ | PushPlus Token |
| `GH_PAT` | ❌ | GitHub PAT (for auto-committing PDFs, needs `repo` + `workflow` scope) |

4. Go to Actions → **AI日报自动生成** → **Run workflow** to trigger a manual test

### Option 2: Docker

```bash
docker build -t ai-daily-news .
docker run -e DEEPSEEK_API_KEY=sk-xxx \
           -e WECOM_WEBHOOK_KEY=xxx \
           -e GH_PAT=github_pat_xxx \
           ai-daily-news
```

Or use an environment file:

```bash
docker run --env-file .env ai-daily-news
```

> The Docker image is based on the Playwright official image, with Chromium + CJK fonts (`fonts-noto-cjk`) built in.
> Setting `GH_PAT` enables the container to auto-commit generated PDFs back to the repository.

### Option 3: Local Development

```bash
npm run dev              # Standard mode (scrape → AI summary → PDF → push)
npm run dev:light        # Light mode
npm run dev:deep         # Deep mode
npm run dev -- --mode=light --skip-pdf  # Combine flags
```

---

## Command Reference

| Command | Description |
|---------|-------------|
| `npm run setup` | **One-click setup** (recommended for new users) |
| `npm run dev` | Run in standard mode |
| `npm run dev:light` | Run in light mode |
| `npm run dev:deep` | Run in deep mode |
| `npm run setup-fonts` | Download CJK fonts only |
| `npm run build` | TypeScript compilation |
| `npm run start` | Run compiled version |

### CLI Flags

| Flag | Description |
|------|-------------|
| `--mode=light\|standard\|deep` | Specify report mode (overrides `REPORT_MODE` in `.env`) |
| `--skip-pdf` | Skip PDF generation |
| `--skip-scrape` | Skip scraping (use empty data, useful for testing summarization) |

---

## Project Structure

```
ai-daily-news/
├── src/
│   ├── index.ts               # Main orchestrator
│   ├── config.ts              # Configuration (sources, mode params, keywords)
│   ├── types.ts               # Type definitions
│   ├── cache.ts               # Cache deduplication module
│   ├── pusher.ts              # Push module (WeCom + PushPlus, with push history)
│   ├── utils/
│   │   ├── retry.ts           # General retry utility (3 attempts, exp. backoff + jitter)
│   │   └── health.ts          # Health check utility (HEAD + AbortSignal probe)
│   ├── scrapers/
│   │   ├── base.ts            # BaseScraper abstract class (shared browser instance)
│   │   ├── arxiv.ts           # ArXiv cs.AI scraper
│   │   ├── hackernews.ts      # Hacker News scraper (AI keyword filtering)
│   │   ├── jiqizhixin.ts      # Jiqizhixin scraper (React SPA new-tab capture)
│   │   └── github.ts          # GitHub Trending scraper (AI topics/desc filtering)
│   ├── summarizer/
│   │   ├── deepseek.ts        # DeepSeek API client + graceful degradation
│   │   └── prompts.ts         # Prompt templates (differentiated for 3 modes)
│   └── pdf/
│       └── generator.ts       # PDF generator (Playwright rendering engine)
├── scripts/
│   ├── setup.ts               # One-click setup script
│   └── download-fonts.ts      # CJK font download script (Noto Sans SC)
├── reports/                   # Report output directory (MD + PDF + cache + push history)
├── .github/workflows/
│   └── daily-report.yml       # GitHub Actions workflow
├── Dockerfile                 # Docker image
└── entrypoint.sh              # Container entry script (with Git auto-commit)
```

---

## Data Sources

| Source | Scraping Method | Notes |
|--------|----------------|-------|
| **ArXiv cs.AI** | Playwright rendering | Latest papers with titles, authors, and abstract links |
| **Hacker News** | Firebase REST API | Filtered by 30+ AI keywords, sorted by popularity, with timeout + retry |
| **GitHub Trending** | Playwright rendering | Filtered by 20+ AI topics and descriptions |
| **Jiqizhixin** | Playwright click interception | React SPA, captures new tabs for URL extraction |

### Reliability Guarantees

| Mechanism | Description |
|-----------|-------------|
| 🔁 Auto Retry | Each source retries up to 3 times with exponential backoff + jitter |
| 🩺 Health Check | HTTP HEAD probe before scraping; warns without blocking on failure |
| ⏱️ Request Timeout | All requests have a 30-second timeout with AbortController cleanup |
| 🛡️ Single-Source Fault Tolerance | `Promise.allSettled` parallel scraping; one failure doesn't affect others |
| 📉 API Degradation | Falls back to raw data compilation when DeepSeek API is unavailable |
| 🧹 Cache Deduplication | Re-running on the same day skips already-processed items (cache TTL: 7 days) |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEEPSEEK_API_KEY` | ✅ | — | DeepSeek API Key |
| `REPORT_MODE` | ❌ | `standard` | Report mode: `light` / `standard` / `deep` |
| `WECOM_WEBHOOK_KEY` | ❌ | — | WeCom Bot Webhook Key |
| `PUSHPLUS_TOKEN` | ❌ | — | PushPlus Token |
| `GH_PAT` | ❌ | — | GitHub PAT for auto-committing PDFs in Docker |

---

## FAQ

<details>
<summary><b>What language is the report in?</b></summary>
The digest body is in Chinese. English paper/article titles are kept in their original language. Technical commentary is in Chinese.
</details>

<details>
<summary><b>What if scraping fails?</b></summary>
Scraping uses `Promise.allSettled` — a single source failure doesn't affect others. If all sources fail, the program exits with an error. When the DeepSeek API is unavailable, it automatically degrades to a raw data report.
</details>

<details>
<summary><b>The digest is too long for WeCom?</b></summary>
WeCom Bot has a 4096-byte limit. The program splits content into sections and sends them sequentially with `(cont. 2/N)` numbering. PushPlus has no such limit.
</details>

<details>
<summary><b>Will re-running on the same day cause duplicate pushes?</b></summary>
No. A deduplication cache (`reports/.cache.json`) tracks processed items and skips them automatically. The cache is retained for 7 days and cleaned up on expiration.
</details>

<details>
<summary><b>How do I view push history?</b></summary>
Push results are recorded in `reports/push-history.json`, including timestamp, channel, success status, and segment count.
</details>

<details>
<summary><b>PDF shows boxes instead of Chinese characters?</b></summary>
Run `npm run setup-fonts` to download CJK fonts, or use Docker which includes `fonts-noto-cjk` out of the box.
</details>

<details>
<summary><b>How do I add my own data source?</b></summary>
Create a new scraper class under `src/scrapers/`, extend `BaseScraper<T>` and implement the `doScrape()` method, then register it in `src/index.ts`. Use the shared browser instance passed in by Playwright.
</details>

<details>
<summary><b>How do I change the scheduled run time?</b></summary>
Edit the cron expression in `.github/workflows/daily-report.yml` (currently `0 0 * * *`, which is 8:00 AM CST).
</details>

---

## Sample Output

After running, the following files are generated:

```
reports/
├── AI日报-2026-05-09.md        # Markdown source file
├── AI日报-2026-05-09.pdf       # Formatted PDF
├── .cache.json                  # Deduplication cache (auto-managed)
└── push-history.json            # Push history records
```

Push notifications (WeCom / PushPlus) are delivered simultaneously.

---

## License

MIT © Insect-sounds0487
