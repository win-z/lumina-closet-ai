#!/bin/bash
# ================================================================
# Lumina Closet AI - 服务器首次初始化脚本
# 在服务器上只需运行一次
# 使用方法: bash setup-server.sh
# ================================================================

set -e

echo "╔════════════════════════════════════════╗"
echo "║   Lumina Closet AI - 服务器初始化     ║"
echo "╚════════════════════════════════════════╝"

# ── 1. 安装 Node.js 18 ──────────────────────────────────────────
echo ""
echo "📦 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node --version && npm --version

# ── 2. 安装 PM2 ───────────────────────────────────────────────
echo ""
echo "📦 安装 PM2..."
npm install -g pm2
pm2 --version

# ── 3. 配置 PM2 开机自启 ────────────────────────────────────────
echo ""
echo "⚙️  配置 PM2 开机自启..."
pm2 startup
systemctl enable pm2-root 2>/dev/null || true

# ── 4. 创建项目目录 ────────────────────────────────────────────
echo ""
echo "📁 创建项目目录..."
mkdir -p /www/wwwroot
mkdir -p /www/wwwlogs

# ── 5. 从 GitHub 克隆项目 ──────────────────────────────────────
echo ""
echo "📥 克隆项目..."
cd /www/wwwroot

# ⚠️ 替换为你的 GitHub 仓库地址
REPO_URL="https://github.com/你的用户名/lumina-closet-ai.git"

if [ -d "lumina-closet" ]; then
  echo "项目已存在，跳过克隆..."
else
  git clone $REPO_URL lumina-closet
fi

cd lumina-closet

# ── 6. 安装前端依赖并构建 ─────────────────────────────────────
echo ""
echo "🔨 构建前端..."
npm install
npm run build

# ── 7. 配置后端环境变量 ────────────────────────────────────────
echo ""
echo "⚙️  配置后端环境变量..."
cd backend

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  请编辑 /www/wwwroot/lumina-closet/backend/.env 填入以下配置："
  echo "   - DB_HOST / DB_USER / DB_PASSWORD（腾讯云 MySQL）"
  echo "   - SILICONFLOW_API_KEY"
  echo "   - DOUBAO_API_KEY"
  echo "   - TENCENT_COS_* 配置"
  echo "   - CORS_ORIGIN=https://你的域名"
  echo "   - JWT_SECRET=（改成强随机字符串）"
  echo ""
  echo "编辑命令: nano /www/wwwroot/lumina-closet/backend/.env"
  echo ""
  read -p "配置完成后按 Enter 继续..." dummy
fi

# ── 8. 安装后端依赖并构建 ─────────────────────────────────────
echo ""
echo "🔨 构建后端..."
npm install
npm run build 2>/dev/null || npx tsc 2>/dev/null || echo "⚠️  构建跳过（无 build 脚本）"

# ── 9. 启动后端服务 ────────────────────────────────────────────
echo ""
echo "🚀 启动后端服务..."
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "╔════════════════════════════════════════╗"
echo "║            ✅ 初始化完成！             ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📋 下一步："
echo "  1. 在宝塔面板中添加站点，配置 Nginx"
echo "     参考: scripts/nginx.conf"
echo "  2. 在 GitHub 仓库配置 Secrets："
echo "     SERVER_HOST = 服务器IP"
echo "     SERVER_USER = root"
echo "     SERVER_SSH_KEY = SSH私钥内容"
echo "  3. Push 代码到 main 分支即可自动部署 🎉"
echo ""
echo "查看服务状态: pm2 status"
echo "查看日志:     pm2 logs lumina-backend"
