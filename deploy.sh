#!/bin/bash

# ==================== Lumina Closet AI PWA 部署脚本 ====================
# 
# 功能：
# 1. 检查并安装依赖
# 2. 验证PWA配置
# 3. 构建生产版本
# 4. 提供部署建议
#
# 使用方法：
# chmod +x deploy.sh
# ./deploy.sh

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       Lumina Closet AI - PWA 部署助手                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 Node.js
echo -e "${BLUE}📦 检查 Node.js 环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${YELLOW}⚠️  Node.js 版本建议 16+，当前版本: $(node -v)${NC}"
else
    echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
fi

# 检查 npm
echo -e "${BLUE}📦 检查 npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

echo ""
echo -e "${BLUE}🔧 步骤 1: 安装依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo "首次运行，安装依赖中..."
    npm install
else
    echo "依赖已存在，跳过安装"
fi
echo -e "${GREEN}✅ 依赖检查完成${NC}"

echo ""
echo -e "${BLUE}🔍 步骤 2: 检查 PWA 配置...${NC}"

# 检查 vite-plugin-pwa
if ! grep -q "vite-plugin-pwa" package.json 2>/dev/null; then
    echo -e "${YELLOW}⚠️  未检测到 vite-plugin-pwa，正在安装...${NC}"
    npm install vite-plugin-pwa -D
fi
echo -e "${GREEN}✅ vite-plugin-pwa 已安装${NC}"

# 检查图标文件
MISSING_ICONS=0
for size in 72 96 128 144 152 192 384 512; do
    if [ ! -f "public/icon-${size}x${size}.png" ]; then
        MISSING_ICONS=$((MISSING_ICONS + 1))
    fi
done

if [ $MISSING_ICONS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  检测到 ${MISSING_ICONS} 个图标文件缺失${NC}"
    echo -e "${YELLOW}   请在浏览器中打开 generate-icons.html 生成图标${NC}"
    echo ""
    read -p "是否继续构建? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}已取消构建。请先生成图标文件。${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✅ 所有图标文件已就位${NC}"
fi

echo ""
echo -e "${BLUE}🏗️  步骤 3: 构建生产版本...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 构建成功！${NC}"
else
    echo -e "${RED}❌ 构建失败，请检查错误信息${NC}"
    exit 1
fi

# 检查构建输出
echo ""
echo -e "${BLUE}📊 构建信息：${NC}"
echo "   - 输出目录: dist/"
echo "   - 文件数量: $(find dist -type f | wc -l)"
echo "   - 总大小: $(du -sh dist 2>/dev/null | cut -f1)"

# 检查 manifest
if [ -f "dist/manifest.webmanifest" ] || [ -f "dist/manifest.json" ]; then
    echo -e "   - ${GREEN}✅ Manifest 文件已生成${NC}"
else
    echo -e "   - ${YELLOW}⚠️  Manifest 文件未找到${NC}"
fi

# 检查 Service Worker
if [ -f "dist/sw.js" ] || [ -f "dist/service-worker.js" ]; then
    echo -e "   - ${GREEN}✅ Service Worker 已生成${NC}"
else
    echo -e "   - ${YELLOW}⚠️  Service Worker 未找到${NC}"
fi

echo ""
echo -e "${BLUE}🚀 步骤 4: 部署选项${NC}"
echo ""
echo "请选择部署方式："
echo ""
echo "  1) Vercel (推荐)"
echo "     命令: vercel --prod"
echo ""
echo "  2) Netlify"
echo "     命令: netlify deploy --prod --dir=dist"
echo ""
echo "  3) GitHub Pages"
echo "     将 dist 文件夹内容推送到 gh-pages 分支"
echo ""
echo "  4) 腾讯云 COS"
echo "     使用 COSCMD 或控制台上传 dist 文件夹"
echo ""
echo "  5) 自有服务器"
echo "     将 dist 文件夹内容上传到服务器"
echo ""
echo "  6) 本地预览"
echo "     命令: npx serve dist"
echo ""

read -p "选择部署方式 (1-6)，或按 Enter 跳过: " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}部署到 Vercel...${NC}"
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo -e "${YELLOW}⚠️  Vercel CLI 未安装${NC}"
            echo "正在安装..."
            npm install -g vercel
            vercel --prod
        fi
        ;;
    2)
        echo ""
        echo -e "${BLUE}部署到 Netlify...${NC}"
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=dist
        else
            echo -e "${YELLOW}⚠️  Netlify CLI 未安装${NC}"
            echo "正在安装..."
            npm install -g netlify-cli
            netlify deploy --prod --dir=dist
        fi
        ;;
    3)
        echo ""
        echo -e "${YELLOW}GitHub Pages 部署说明：${NC}"
        echo "1. 将 dist 文件夹内容复制到单独的仓库"
        echo "2. 推送到 gh-pages 分支"
        echo "3. 在仓库设置中启用 GitHub Pages"
        echo ""
        echo "或使用 gh-pages 包："
        echo "   npm install -g gh-pages"
        echo "   gh-pages -d dist"
        ;;
    4)
        echo ""
        echo -e "${YELLOW}腾讯云 COS 部署说明：${NC}"
        echo "1. 安装 COSCMD: pip install coscmd"
        echo "2. 配置 COSCMD: coscmd config -a <secret_id> -s <secret_key> -b <bucket> -r <region>"
        echo "3. 上传文件: coscmd upload -r dist/ /"
        echo ""
        echo "或使用控制台手动上传 dist 文件夹内容"
        ;;
    5)
        echo ""
        echo -e "${YELLOW}自有服务器部署说明：${NC}"
        echo "1. 将 dist 文件夹内容上传到服务器"
        echo "2. 配置 Web 服务器 (Nginx/Apache) 指向 dist 文件夹"
        echo "3. 确保 HTTPS 已启用 (PWA 必需)"
        echo ""
        echo "Nginx 配置示例："
        echo "   location / {"
        echo "       root /var/www/lumina-closet/dist;"
        echo "       try_files \$uri \$uri/ /index.html;"
        echo "   }"
        ;;
    6)
        echo ""
        echo -e "${BLUE}启动本地预览服务器...${NC}"
        echo -e "${GREEN}访问 http://localhost:3000 预览应用${NC}"
        npx serve dist -l 3000
        ;;
    *)
        echo ""
        echo -e "${GREEN}✅ 构建完成！${NC}"
        echo ""
        echo "dist 文件夹已准备就绪，可以手动部署。"
        echo ""
        echo "下一步操作："
        echo "  1. 打开 generate-icons.html 生成图标（如尚未生成）"
        echo "  2. 将 dist 文件夹部署到你的服务器"
        echo "  3. 在手机上访问网址并添加到主屏幕"
        echo ""
        echo "详细说明请查看 PWA_SETUP.md"
        ;;
esac

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  🎉 部署完成！                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
