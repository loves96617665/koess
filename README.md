# 影片生成站 🎬

一個支援 API 輸出的影片生成網站，支援 Cloudflare Pages 部署。

## ✨ 功能特性

- **精美介面**：現代化的影片生成表單
- **多模型支援**：Kling-AIGC、Seedance、OpenAI Sora 等
- **完整參數**：支援解析度、幀率、風格、持續時間等設定
- **歷史記錄**：自動保存生成紀錄
- **本地存儲**：資料存於瀏覽器本地端

## 📁 專案結構

```
video-generator-site/
├── index.html          # 前端介面
├── app.js              # 前端邏輯與 API 客戶端
├── style.css           # 美觀樣式
├── package.json        # npm 套件配置
├── wrangler.toml       # Cloudflare 部署配置
├── deploy.sh           # 部署腳本
└── README.md           # 說明文件
```

## 🚀 部署到 Cloudflare Pages

### 方法 1：使用命令行部署

```bash
# 1. 安裝 Wrangler
npm install -g wrangler

# 2. 登入 Cloudflare
wrangler login

# 3. 部署
npx wrangler pages deploy .
```

### 方法 2：使用 GitHub Actions

1. 把專案推到 GitHub
2. 在 Cloudflare Dashboard 創建新的 Pages
3. 連接 GitHub 倉庫
4. 設定构建設定：
   - Build command: `bash deploy.sh`
   - Build directory: `public`

### 方法 3：直接上傳

1. 壓縮 `public/` 目錄下的檔案
2. 上傳到 Cloudflare Pages

## 🛠️ 本地測試

```bash
# 使用 Python 簡單伺服器
python -m http.server 8000

# 或使用 Node.js
npx serve .

# 然後訪問 http://localhost:8000
```

## 🔧 如何設定 API 端點

打開 `app.js` 檔案，找到 `API_CONFIG` 變數：

```javascript
const API_CONFIG = {
    baseEndpoints: {
        'kling-v1': 'https://api.klingai.com/v1',
        'seedance': 'https://api.seedance.tech/v1',
        'openai-sora': 'https://api.openai.com/v1',
        'custom': '' // 自訂端點
    }
};
```

根據你發現的實際 API，修改對應的端點！

## 📋 使用說明

1. 打開網站
2. 填寫「影片描述」欄位
3. 選擇模型與參數
4. 點擊「生成影片」
5. 等待生成完成
6. 檢視結果並下載

## 🔄 API 格式

### 請求格式
```json
{
  "model": "kling-v1",
  "prompt": "一位科學家在實驗室發現新能源...",
  "duration": 8,
  "resolution": "1080p",
  "fps": 30
}
```

### 回應格式
```json
{
  "task_id": "xxx",
  "status": "processing",
  "video_url": null
}
```

完成後：
```json
{
  "task_id": "xxx",
  "status": "completed",
  "video_url": "https://cdn.example.com/video.mp4"
}
```

## 🎯 下一步

請觀察 https://h3video.haizhuapi.bond 網站：
1. 按 F12 開發者工具
2. Network → XHR 選擇 XHR 過濾
3. 執行一個影片生成操作
4. 找到對應的請求
5. 貼出 Request URL 和 Payload 給我

我會幫你更新 `app.js`，使其能正確對接那個 API！