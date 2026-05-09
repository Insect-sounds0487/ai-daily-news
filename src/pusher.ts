import fs from 'node:fs/promises';
import { CONFIG } from './config';
import type { PushHistoryEntry } from './types';

const PUSHPLUS_API = 'https://www.pushplus.plus/send';
const WECOM_API = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send';
const WECOM_MAX_BYTES = 4096;

const encoder = new TextEncoder();

function byteLength(str: string): number {
  return encoder.encode(str).length;
}

async function sendWeCom(key: string, content: string): Promise<boolean> {
  const res = await fetch(`${WECOM_API}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msgtype: 'markdown', markdown: { content } }),
  });
  const data = await res.json();
  if (data.errcode !== 0) {
    console.warn(`[WeCom] 推送失败: ${data.errmsg || JSON.stringify(data)}`);
    return false;
  }
  return true;
}

async function appendPushHistory(entry: PushHistoryEntry): Promise<void> {
  try {
    const file = CONFIG.PUSH_HISTORY_FILE;
    let history: PushHistoryEntry[] = [];
    try {
      const raw = await fs.readFile(file, 'utf-8');
      history = JSON.parse(raw);
      if (!Array.isArray(history)) history = [];
    } catch {
      // 文件不存在或格式错误，使用空数组
    }
    history.push(entry);
    await fs.mkdir(file.substring(0, file.lastIndexOf('/')), { recursive: true });
    await fs.writeFile(file, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[PushHistory] 写入失败: ${err}`);
  }
}

/**
 * 按段落拆分内容，使每段不超过 maxBytes 字节。
 * 优先按 `\n## ` 章节标题分割，再按 `\n\n` 段落分割。
 */
function splitContent(content: string, maxBytes: number): string[] {
  function splitBy(delim: string): string[] {
    const parts: string[] = [];
    let remaining = content;

    const delimIdx = remaining.indexOf(delim);
    if (delimIdx < 0) return [content];

    const intro = remaining.substring(0, delimIdx);
    remaining = remaining.substring(delimIdx);
    const raw = remaining.split(delim);

    let buf = intro;
    for (let i = 0; i < raw.length; i++) {
      const seg = (i > 0 ? delim : '') + raw[i];
      if (byteLength(buf + seg) > maxBytes) {
        parts.push(buf);
        buf = seg;
      } else {
        buf += seg;
      }
    }
    if (buf) parts.push(buf);
    return parts;
  }

  const byHeading = splitBy('\n## ');
  if (byHeading.every(s => byteLength(s) <= maxBytes)) return byHeading;

  const result: string[] = [];
  for (const segment of byHeading) {
    if (byteLength(segment) <= maxBytes) {
      result.push(segment);
    } else {
      const paragraphs = segment.split('\n\n');
      let buf = '';
      for (const p of paragraphs) {
        const candidate = buf + (buf ? '\n\n' : '') + p;
        if (byteLength(candidate) > maxBytes) {
          if (buf) result.push(buf);
          if (byteLength(p) > maxBytes) {
            let lo = 0, hi = p.length;
            while (lo < hi) {
              const mid = (lo + hi + 1) >> 1;
              if (byteLength(p.substring(0, mid)) <= maxBytes) lo = mid;
              else hi = mid - 1;
            }
            result.push(p.substring(0, lo));
            buf = '';
          } else {
            buf = p;
          }
        } else {
          buf = candidate;
        }
      }
      if (buf) result.push(buf);
    }
  }
  return result;
}

export async function pushToWechat(title: string, content: string): Promise<void> {
  // 企业微信机器人 (优先)
  const wecomKey = process.env.WECOM_WEBHOOK_KEY;
  if (wecomKey) {
    console.log('[WeCom] 正在推送到企业微信...');
    try {
      const header = `# ${title}`;
      const fullContent = `${header}\n\n${content}`;

      if (byteLength(fullContent) <= WECOM_MAX_BYTES) {
        if (await sendWeCom(wecomKey, fullContent)) {
          console.log('[WeCom] 推送成功');
          await appendPushHistory({ timestamp: new Date().toISOString(), channel: 'wecom', title, success: true });
          return;
        } else {
          await appendPushHistory({ timestamp: new Date().toISOString(), channel: 'wecom', title, success: false, error: 'API 返回错误' });
        }
      } else {
        const parts = splitContent(content, WECOM_MAX_BYTES - byteLength(header + '\n\n'));
        let sentCount = 0;
        for (let i = 0; i < parts.length; i++) {
          const partHeader = i === 0 ? header : `${header} (续 ${i + 1}/${parts.length})`;
          const partContent = `${partHeader}\n\n${parts[i]}`;
          if (await sendWeCom(wecomKey, partContent)) {
            sentCount++;
          }
          if (i < parts.length - 1) await new Promise(r => setTimeout(r, 500));
        }
        if (sentCount === parts.length) {
          console.log(`[WeCom] 推送成功 (共 ${sentCount} 段)`);
          await appendPushHistory({ timestamp: new Date().toISOString(), channel: 'wecom', title, success: true, segments: sentCount });
          return;
        }
        await appendPushHistory({ timestamp: new Date().toISOString(), channel: 'wecom', title, success: false, error: `${sentCount}/${parts.length} 段发送成功`, segments: parts.length });
        console.warn(`[WeCom] ${sentCount}/${parts.length} 段发送成功`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[WeCom] 推送异常: ${msg}`);
      await appendPushHistory({ timestamp: new Date().toISOString(), channel: 'wecom', title, success: false, error: msg });
    }
  } else {
    console.log('[WeCom] 未配置 WECOM_WEBHOOK_KEY，跳过');
  }

  // PushPlus (备选)
  const token = process.env.PUSHPLUS_TOKEN;
  if (!token) {
    console.log('[PushPlus] 未配置 PUSHPLUS_TOKEN，跳过推送');
    return;
  }

  console.log('[PushPlus] 正在推送到微信...');
  try {
    const res = await fetch(PUSHPLUS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title, content, template: 'markdown' }),
    });
    const data = await res.json();
    if (data.code === 200) {
      console.log('[PushPlus] 推送成功');
      await appendPushHistory({ timestamp: new Date().toISOString(), channel: 'pushplus', title, success: true });
    } else {
      console.warn(`[PushPlus] 推送失败: ${data.msg || JSON.stringify(data)}`);
      await appendPushHistory({ timestamp: new Date().toISOString(), channel: 'pushplus', title, success: false, error: data.msg || JSON.stringify(data) });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[PushPlus] 推送异常: ${msg}`);
    await appendPushHistory({ timestamp: new Date().toISOString(), channel: 'pushplus', title, success: false, error: msg });
  }
}
