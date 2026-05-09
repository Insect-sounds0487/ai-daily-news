const PUSHPLUS_API = 'https://www.pushplus.plus/send';
const WECOM_API = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send';

export async function pushToWechat(title: string, content: string): Promise<void> {
  // 企业微信机器人 (优先)
  const wecomKey = process.env.WECOM_WEBHOOK_KEY;
  if (wecomKey) {
    console.log('[WeCom] 正在推送到企业微信...');
    try {
      const wecomContent = `# ${title}\n\n${content}`;
      const res = await fetch(`${WECOM_API}?key=${wecomKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: { content: wecomContent.substring(0, 4096) },
        }),
      });
      const data = await res.json();
      if (data.errcode === 0) {
        console.log('[WeCom] 推送成功');
        return;
      }
      console.warn(`[WeCom] 推送失败: ${data.errmsg || JSON.stringify(data)}`);
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
