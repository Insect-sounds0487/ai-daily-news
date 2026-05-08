# === AI 日报生成器 — Docker 镜像 ===
# 基于 Playwright 官方镜像（内含 Chromium + 系统依赖）
FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

# 安装中文字体（PDF 渲染需要）、Git（自动提交需要）
RUN apt-get update && \
    apt-get install -y \
      fonts-noto-cjk \
      git \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖清单并安装
COPY package*.json tsconfig.json ./
RUN npm install

# 复制源码并编译
COPY src/ ./src/
RUN npx tsc

# 创建 reports 目录
RUN mkdir -p reports

# 复制入口脚本
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENV NODE_ENV=production

CMD ["/bin/bash", "/app/entrypoint.sh"]
