#!/bin/bash
set -e

echo "=============================================="
echo " AI 行业每日大事总结 — 容器入口"
echo " 启动时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

cd /app

# 加载环境变量
if [ -f .env ]; then
  set -a; source .env; set +a
fi

# 创建 reports 目录
mkdir -p reports

# 如果是 Git 仓库，拉取最新代码
if [ -d .git ]; then
  echo "[Git] 拉取最新代码..."
  # 注入 GH_PAT 凭据（如有配置）
  if [ -n "$GH_PAT" ]; then
    git remote set-url origin "https://git:${GH_PAT}@github.com/Insect-sounds0487/ai-daily-news.git" 2>/dev/null || true
  fi
  git pull origin main 2>/dev/null || echo "[Git] 无远程配置，跳过拉取"
fi

# 生成日报
echo ""
echo "[运行] 开始生成日报..."
node dist/index.js "$@"

# 保存退出状态
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "[错误] 日报生成失败，退出码: $EXIT_CODE"
  exit $EXIT_CODE
fi

# 如果配置了 Git 远程，提交生成的日报
if [ -d .git ] && git remote get-url origin &>/dev/null; then
  echo ""
  echo "[Git] 提交日报文件..."

  DATE=$(date '+%Y-%m-%d')

  git config user.name "${GIT_AUTHOR_NAME:-AI News Bot}"
  git config user.email "${GIT_AUTHOR_EMAIL:-bot@ai-daily-news.local}"

  git add reports/
  if git diff --cached --quiet; then
    echo "[Git] 无新文件需要提交"
  else
    git commit -m "[AI日报] ${DATE} - AI行业每日新闻摘要

Co-Authored-By: AI News Bot <bot@ai-daily-news.local>"
    git push origin main 2>/dev/null && echo "[Git] 推送成功" || echo "[Git] 推送失败（忽略）"
  fi
fi

echo ""
echo "=============================================="
echo " 完成！"
echo "=============================================="
