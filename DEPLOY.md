# OA 系统 - 部署指南

## 一、快速开始（Docker Compose）

### 前置条件
- Docker 20+ & Docker Compose v2+
- Node.js 22+ & pnpm（仅开发构建需要）

### 1. 配置环境变量

```bash
# 复制模板
cp .env.example .env

# 编辑 .env 填入真实值
vim .env
```

### 2. 一键部署

```bash
# 使用 Makefile
make docker-up

# 或直接使用 docker compose
docker compose up -d

# 首次运行需初始化数据库
docker compose exec oa-server npx prisma db push
```

### 3. 访问服务

| 服务 | 地址 |
|------|------|
| 管理后台 | http://localhost:8080 |
| 移动端 Web | http://localhost:8081 |
| 后端 API | http://localhost:3000 |
| API 文档 | http://localhost:3000/doc.html |

---

## 二、CI/CD 流水线

### 自动触发

```
push main/master → Lint → Build → Docker镜像 → 部署服务器
PR → Lint → Build（不部署）
每天 02:00 → API集成测试
```

### 手动触发

在 GitHub Actions 页面可手动触发：
- **CI/CD Pipeline** - 完整部署
- **Rollback Deploy** - 回滚到上一版本

### 需要的 GitHub Secrets

| Secret | 说明 |
|--------|------|
| `DOCKERHUB_USERNAME` | Docker Hub 用户名 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token |
| `SSH_HOST` | 服务器 IP |
| `SSH_USER` | SSH 用户名 |
| `SSH_PRIVATE_KEY` | SSH 私钥 |
| `SSH_PORT` | SSH 端口（默认 22） |
| `DEPLOY_PATH` | 部署路径（如 /opt/oa） |

---

## 三、服务器部署脚本

```bash
# 在服务器上执行
git clone <仓库地址> /opt/oa
cd /opt/oa
bash deploy.sh
```

---

## 四、常用命令

```bash
# 查看日志
make docker-logs

# 重启服务
make docker-restart

# 停止服务
make docker-down

# 清理
make clean
```

---

## 五、回滚

```bash
# 方式1: GitHub Actions 手动触发 Rollback Deploy
# 方式2: 服务器上执行
docker compose pull oa-server  # 拉取上一个版本
docker compose up -d oa-server
```
