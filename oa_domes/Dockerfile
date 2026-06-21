# ============================================
# OA Domes - 移动端 Web 版本 Docker 镜像
# ============================================
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile --ignore-scripts

COPY . .
RUN npx expo export --platform web

# ============================================
# 生产运行阶段（Nginx）
# ============================================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1
