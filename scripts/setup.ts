import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

function run(cmd: string): void {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

async function main() {
  console.log('=== AI 日报生成器 — 一键初始化 ===\n');

  // 1. 创建 .env
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(path.join(ROOT, '.env.example'), envPath);
    console.log('[1/4] 已创建 .env（请编辑填入你的 API Key）');
  } else {
    console.log('[1/4] .env 已存在，跳过');
  }

  // 2. npm install
  console.log('[2/4] 安装依赖...');
  run('npm install');

  // 3. Playwright 浏览器
  console.log('[3/4] 安装 Playwright 浏览器...');
  run('npx playwright install chromium');

  // 4. 下载字体
  console.log('[4/4] 下载中文字体...');
  run('npm run setup-fonts');

  console.log('\n=== 初始化完成 ===');
  console.log('运行 npm run dev 即可生成日报');
}

main().catch((err) => {
  console.error('初始化失败:', err);
  process.exit(1);
});
