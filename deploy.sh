# ============================================
# OA 系统 - 服务器部署脚本
# 在服务器上首次运行或更新时使用
# 用法: bash deploy.sh
# ============================================

set -e

echo "🚀 开始部署 OA 系统..."

# 1. 拉取最新代码（如果是 Git 仓库）
if [ -d ".git" ]; then
  echo "📦 拉取最新代码..."
  git pull origin main --ff-only || echo "⚠️  git pull 失败，使用当前代码"
fi

# 2. 登录 Docker Hub（需要先设置环境变量）
if [ -n "$DOCKERHUB_USERNAME" ] && [ -n "$DOCKERHUB_TOKEN" ]; then
  echo "🔐 登录 Docker Hub..."
  echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
fi

# 3. 检查 .env 文件
if [ ! -f ".env" ]; then
  echo "❌ 缺少 .env 文件！请先复制 .env.example 并填入真实值"
  echo "   cp .env.example .env"
  echo "   vim .env"
  exit 1
fi

# 4. 拉取/构建镜像并启动
echo "🏗️  构建并启动服务..."
docker compose up -d --build --remove-orphans

# 5. 等待 MySQL 就绪
echo "⏳ 等待 MySQL 启动..."
for i in $(seq 1 30); do
  if docker compose exec -T mysql mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD:-root}" --silent 2>/dev/null; then
    echo "✅ MySQL 已就绪"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ MySQL 启动超时"
    exit 1
  fi
  sleep 2
done

# 6. 初始化/更新数据库
echo "🗄️  同步数据库结构..."
docker compose exec -T oa-server npx prisma db push --accept-data-loss 2>/dev/null || \
  echo "⚠️  数据库同步警告（可能已是最新）"

# 7. 健康检查
echo "🏥 健康检查..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 后端服务健康 (HTTP $HTTP_CODE)"
else
  echo "⚠️  后端服务状态: HTTP $HTTP_CODE"
fi

echo ""
echo "🎉 部署完成！"
echo "   管理后台:  http://localhost:${ADMIN_PORT:-8080}"
echo "   移动端Web: http://localhost:${DOMES_PORT:-8081}"
echo "   API文档:   http://localhost:${SERVER_PORT:-3000}/api-docs"
