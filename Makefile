# ============================================
# OA 系统 - Makefile 开发&部署命令
# 用法: make <命令>
# ============================================

.PHONY: help dev dev-server dev-admin dev-domes build lint docker-up docker-down docker-build deploy clean

# 默认帮助
help:
	@echo "OA 系统 - 可用命令："
	@echo ""
	@echo "  开发:"
	@echo "    make dev          启动所有服务（开发模式）"
	@echo "    make dev-server   仅启动后端"
	@echo "    make dev-admin    仅启动管理后台"
	@echo "    make dev-domes    仅启动移动端"
	@echo ""
	@echo "  构建:"
	@echo "    make build        构建所有项目"
	@echo "    make lint         代码检查"
	@echo ""
	@echo "  Docker:"
	@echo "    make docker-build 构建所有 Docker 镜像"
	@echo "    make docker-up    启动所有服务（Docker）"
	@echo "    make docker-down  停止所有服务"
	@echo "    make docker-logs  查看日志"
	@echo ""
	@echo "  部署:"
	@echo "    make deploy       部署到生产服务器"
	@echo ""
	@echo "  清理:"
	@echo "    make clean        清理构建产物和缓存"

# ========== 开发 ==========
dev:
	@echo "启动所有开发服务..."
	@echo "后端 (3000):"
	cd oa_server && pnpm dev &
	@sleep 2
	@echo "管理后台 (5174):"
	cd oa_admin && pnpm dev &
	@sleep 2
	@echo "移动端 (8081):"
	cd oa_domes && pnpm start --web &
	@echo "全部启动完成！"

dev-server:
	cd oa_server && pnpm dev

dev-admin:
	cd oa_admin && pnpm dev

dev-domes:
	cd oa_domes && pnpm start --web

# ========== 构建 ==========
build:
	@echo "构建后端..."
	cd oa_server && pnpm install --frozen-lockfile && npx prisma generate && npx tsc
	@echo "构建管理后台..."
	cd oa_admin && pnpm install --frozen-lockfile && pnpm build
	@echo "构建完成！"

lint:
	@echo "后端 TypeScript 检查..."
	cd oa_server && npx tsc --noEmit
	@echo "管理后台 TypeScript 检查..."
	cd oa_admin && npx vue-tsc --noEmit

# ========== Docker ==========
docker-build:
	docker compose build --no-cache

docker-up:
	docker compose up -d --remove-orphans
	@echo "等待服务启动..."
	@sleep 5
	@echo "健康检查..."
	@curl -s http://localhost:3000/api/health || echo "后端未就绪"
	@echo ""
	@echo "管理后台:  http://localhost:8080"
	@echo "移动端Web: http://localhost:8081"

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f --tail=100

docker-restart:
	docker compose restart oa-server oa-admin oa-domes

# ========== 部署 ==========
deploy:
	bash deploy.sh

# ========== 清理 ==========
clean:
	@echo "清理构建产物..."
	rm -rf oa_server/dist
	rm -rf oa_admin/dist
	rm -rf oa_domes/dist oa_domes/.expo
	@echo "清理 Docker 资源..."
	docker compose down -v 2>/dev/null || true
	docker system prune -f 2>/dev/null || true
	@echo "清理完成！"
