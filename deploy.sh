#!/bin/bash
# 部署腳本 - 為 Cloudflare Pages 創建檔案結構

# 建立 public 目錄
mkdir -p public

# 複製靜態文件
cp index.html public/
cp style.css public/
cp app.js public/

echo "✅ 檔案已複製到 public/ 目錄"
echo "📂 目錄結構："
ls -la public/

# 顯示部署說明
echo ""
echo "🚀 部署步驟："
echo "1. 確保 wrangler.toml 中的 pages_build_output_dir = 'public'"
echo "2. 執行 npx wrangler pages deploy public"
echo ""
echo "或使用 GitHub Actions 自動部署"