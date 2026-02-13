#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           Lumina Closet AI - Vercel 部署                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 检查是否已登录
if ! vercel whoami &> /dev/null; then
    echo "🔐 请先登录 Vercel 账号"
    echo ""
    echo "运行命令:"
    echo "  vercel login"
    echo ""
    echo "这会打开浏览器让你登录，完成后回来继续运行此脚本"
    exit 1
fi

echo "✅ 已登录 Vercel: $(vercel whoami)"
echo ""

# 部署
echo "🚀 开始部署..."
echo ""
vercel --prod

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  🎉 部署完成！                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "下次更新代码后，只需运行:"
echo "  npm run build && vercel --prod"
echo ""
