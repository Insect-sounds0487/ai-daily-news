import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';

const FONT_URL =
  'https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansSC-Regular.otf';
const OUTPUT_DIR = path.resolve(__dirname, '../fonts');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'NotoSansSC-Regular.ttf');

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest).catch(() => {});
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        file.close();
        fs.unlink(dest).catch(() => {});
        reject(err);
      });
  });
}

async function main() {
  // 检查是否已存在
  try {
    await fs.access(OUTPUT_FILE);
    const stat = await fs.stat(OUTPUT_FILE);
    if (stat.size > 0) {
      console.log(`[字体] 已存在: ${OUTPUT_FILE} (${(stat.size / 1024 / 1024).toFixed(1)} MB)，跳过下载`);
      return;
    }
  } catch {
    // 不存在，继续下载
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  console.log('[字体] 正在下载 Noto Sans SC...');
  console.log(`[字体] URL: ${FONT_URL}`);
  await download(FONT_URL, OUTPUT_FILE);

  const stat = await fs.stat(OUTPUT_FILE);
  console.log(`[字体] 下载完成: ${OUTPUT_FILE} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch((err) => {
  console.error(`[字体] 下载失败: ${err}`);
  process.exit(1);
});
