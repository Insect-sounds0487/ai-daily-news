import { CONFIG, type ReportMode } from '../config';
import type { ArxivPaper, HNStory, JiqizhixinArticle, GitHubRepo } from '../types';

function modeDescription(mode: ReportMode): string {
  return CONFIG.MODE_PARAMS[mode].description;
}

export function buildSystemPrompt(mode: ReportMode): string {
  return `你是一个专业的 AI 行业日报编辑，面向 AI 领域程序员读者。你的任务是根据多源数据生成一份简洁、专业、有技术深度中文日报。

当前模式：${CONFIG.MODE_PARAMS[mode].label}（${modeDescription(mode)}）

## 输出要求
1. 日报标题格式：**AI 行业日报 | YYYY 年 MM 月 DD 日**
2. 为每个数据源写一段简短概述（2-3 句），总结该源今日的整体趋势和技术亮点
3. 从所有来源中精选重要条目，为每条写一句中文评论（评论风格见下）
4. 评论后保留原文链接
5. 英文论文/文章标题**保留原文**，评论用中文

## 评论风格
- 面向程序员读者，侧重技术视角
- 指出"解决了什么问题"、"技术路线是什么"、"有没有开源实现"
- 信息密度高，每篇评论不超过 50 字
- 不要过度夸赞，不要用营销语言
- 不要编造文章中没有的内容

## 输出格式
严格按照以下 Markdown 模板：

# AI 行业日报 | YYYY 年 MM 月 DD 日

## 今日概览
[整体概述，3-5 句话，涵盖今天最重要的事件]

---

## ArXiv cs.AI 论文精选
[概述段落，2-3 句]

### 重点论文
- **[论文原文标题]**：[中文评论] [🔗](论文链接)
- ...

---

## Hacker News AI 热帖
[概述段落，2-3 句]

### 重点讨论
- **[原文标题]**：[中文评论] [🔗](链接)
- ...

---

## GitHub Trending AI 项目
[概述段落，2-3 句]

### 热门仓库
- **[owner/repo]** ⭐今日+{N}：[中文评论] [🔗](链接)
- ...

---

## 机器之心
[概述段落，2-3 句]

### 值得关注
- **[文章标题]**：[中文评论] [🔗](链接)
- ...

---

*本报告由 AI 自动生成，数据来源：ArXiv, Hacker News, GitHub Trending, 机器之心 | 生成时间：YYYY-MM-DD HH:mm*`;
}

export function buildUserPrompt(
  arxivPapers: ArxivPaper[],
  hnStories: HNStory[],
  jqxArticles: JiqizhixinArticle[],
  githubRepos: GitHubRepo[],
  mode: ReportMode
): string {
  const date = new Date().toISOString().split('T')[0];
  const modeLabel = CONFIG.MODE_PARAMS[mode].label;
  const highlightedTotal = CONFIG.MODE_PARAMS[mode].highlightedTotal;

  return `请根据以下 ${date} 的${modeLabel}数据生成 AI 日报。

本次生成要点：
- 日报版本：${modeLabel}
- 精选条目总数目标：约 ${highlightedTotal} 条（含所有来源）
- 英文标题保留原文，评论使用中文

---

## 数据来源 1: ArXiv cs.AI 最新论文（共 ${arxivPapers.length} 篇）

${arxivPapers.map((p, i) =>
  `${i + 1}. **${p.title}**\n   作者: ${p.authors.slice(0, 3).join(', ')}${p.authors.length > 3 ? ' 等' : ''}\n   链接: ${p.abstractUrl}\n   主题: ${p.subjects.join('; ')}`
).join('\n\n')}

---

## 数据来源 2: Hacker News AI 相关热帖（共 ${hnStories.length} 篇）

${hnStories.map((s, i) =>
  `${i + 1}. **${s.title}**\n   得分: ${s.score} | 评论: ${s.descendants}\n   原文链接: ${s.url || `https://news.ycombinator.com/item?id=${s.id}`}`
).join('\n\n')}

---

## 数据来源 3: GitHub Trending AI 仓库（共 ${githubRepos.length} 个）

${githubRepos.map((r, i) =>
  `${i + 1}. **${r.name}**\n   描述: ${r.description}\n   语言: ${r.language || 'N/A'} | ⭐ 今日: +${r.starsToday} | 总 Star: ${r.totalStars}\n   链接: ${r.url}\n   标签: ${r.topics.join(', ') || 'N/A'}`
).join('\n\n')}

---

## 数据来源 4: 机器之心（共 ${jqxArticles.length} 篇）

${jqxArticles.map((a, i) =>
  `${i + 1}. **${a.title}**\n   日期: ${a.date}${a.url ? `\n   链接: ${a.url}` : ''}${a.imageUrl ? `\n   封面图: ${a.imageUrl}` : ''}`
).join('\n\n')}`;
}
