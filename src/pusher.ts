const PUSHPLUS_API = 'https://www.pushplus.plus/send';

export async function pushToWechat(title: string, content: string): Promise<void> {
  const token = process.env.PUSHPLUS_TOKEN;
  if (!token) {
    console.log('[PushPlus] 未配置 PUSHPLUS_TOKEN，跳过推送');
    return;
  }

  console.log('[PushPlus] 正在推送到微信...');
  const res = await fetch(PUSHPLUS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      title,
      content,
      template: 'markdown',
    }),
  });

  const data = await res.json();
  if (data.code === 200) {
    console.log('[PushPlus] 推送成功');
  } else {
    console.warn(`[PushPlus] 推送失败: ${data.msg || JSON.stringify(data)}`);
  }
}
