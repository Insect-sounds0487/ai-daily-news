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

/**
 * 按段落拆分内容，使每段不超过 maxBytes 字节。
 * 优先按 `\n## ` 章节标题分割，再按 `\n\n` 段落分割。
 */
function splitContent(content: string, maxBytes: number): string[] {
  // 尝试按二级标题分割
  function splitBy(delim: string): string[] {
    const parts: string[] = [];
    let remaining = content;

    // 分隔符前的标题内容
    const delimIdx = remaining.indexOf(delim);
    if (delimIdx < 0) return [content]; // 无此分隔符

    const intro = remaining.substring(0, delimIdx);
    remaining = remaining.substring(delimIdx);
    const raw = remaining.split(delim);

    // 第一段包含 intro
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
  // 如果每段都已满足大小，直接返回
  if (byHeading.every(s => byteLength(s) <= maxBytes)) return byHeading;

  // 仍有超长段，进一步按段落拆分
  const result: string[] = [];
  for (const segment of byHeading) {
    if (byteLength(segment) <= maxBytes) {
      result.push(segment);
    } else {
      // 按双换行拆
      const paragraphs = segment.split('\n\n');
      let buf = '';
      for (const p of paragraphs) {
        const candidate = buf + (buf ? '\n\n' : '') + p;
        if (byteLength(candidate) > maxBytes) {
          if (buf) result.push(buf);
          // 如果单个段落仍然超长，按行截断
          if (byteLength(p) > maxBytes) {
            // 按字符截断到 maxBytes
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
        // 单条发送
        if (await sendWeCom(wecomKey, fullContent)) {
          console.log('[WeCom] 推送成功');
          return;
        }
      } else {
        // 分段发送
        const parts = splitContent(content, WECOM_MAX_BYTES - byteLength(header + '\n\n'));
        let sentCount = 0;
        for (let i = 0; i < parts.length; i++) {
          const partHeader = i === 0 ? header : `${header} (续 ${i + 1}/${parts.length})`;
          const partContent = `${partHeader}\n\n${parts[i]}`;
          if (await sendWeCom(wecomKey, partContent)) {
            sentCount++;
          }
          // 避免发送过快
          if (i < parts.length - 1) await new Promise(r => setTimeout(r, 500));
        }
        if (sentCount === parts.length) {
          console.log(`[WeCom] 推送成功 (共 ${sentCount} 段)`);
          return;
        }
        console.warn(`[WeCom] ${sentCount}/${parts.length} 段发送成功`);
      }
    } catch (e) {
      console.warn(`[WeCom] 推送异常: ${e}`);
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
    } else {
      console.warn(`[PushPlus] 推送失败: ${data.msg || JSON.stringify(data)}`);
    }
  } catch (e) {
    console.warn(`[PushPlus] 推送异常: ${e}`);
  }
}
