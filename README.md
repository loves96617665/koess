# 影片生成站 🎬

一個支援 API 輸出的影片生成網站，專為 Cloudflare 部署設計。

## ✨ 功能特性

- **精美介面**：現代化的影片生成表單
- **多模型支援**：Kling-AIGC、Seedance、OpenAI Sora 等
- **完整參數**：支援解析度、幀率、風格、持續時間等設定
- **歷史記錄**：自動保存生成紀錄
- **本地存儲**：資料存於瀏覽器本地端
- **Cloudflare 部署**：一鍵部署到 Cloudflare

## 🚀 功能亮目

### 影片參數支援
- **模型選擇**：多個 AI 影片生成模型
- **文本描述**：自然語言描述影片內容
- **持續時間**：2-30 秒可調
- **解析度**：480p/720p/1080p/4K
- **幀率**：24/30/60 FPS
- **風格**：電影、動漫、寫實、插畫、賽博朋克

### 典型影片生成模型
- Kling-AIGC
- Seedance 1.5
- OpenAI Sora (概念稿)
- ModelScope VideoGen
- 其他開放模型

## 📁 專案結構

```
video-generator-site/
├── index.html          # 前端介面
├── app.js              # 前端邏輯與 API 客戶端
├── style.css           # 美觀樣式
├── functions/
│   └── api.js          # Cloudflare Workers 後端代理
├── package.json        # npm 套件配置
└── wrangler.toml       # Cloudflare Workers 配置
```

## 🛠️ 本地測試

### 方法 1：直接開啟
```bash
# 雙擊 index.html 在瀏覽器中開啟
```

### 方法 2：使用 HTTP 伺服器
```bash
# 使用 Python
python -m http.server 8000

# 然後訪問 http://localhost:8000
```

## 🚀 部署到 Cloudflare

### 前置步驟
1. 安裝 Wrangler CLI
```bash
npm install -g wrangler
```

2. 登入 Cloudflare
```bash
wrangler login
```

### 部署步驟

```bash
# 1. 安裝依賴
npm install

# 2. 預覽測試
npm run preview

# 3. 部署到 Cloudflare Pages (前端)
npm run deploy

# 或者使用 Wrangler 部署 Workers
wrangler deploy
```

### 環境變數設定

在 Cloudflare Dashboard 中設定以下變數：

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| CUSTOM_API_URL | API 端點 | https://api.klingai.com |
| API_KEY | API 金鑰 | your-api-key-here |

## 📋 使用說明

1. 打開網站
2. 填寫「影片描述」欄位
3. 選擇模型與參數
4. 點擊「生成影片」
5. 等待生成完成
6. 檢視結果並下載

## 🔄 API 整合

### 請求格式 (POST)
```json
{
  "model": "kling-v1",
  "prompt": "一位科學家在實驗室發現新能源...",
  "duration": 8,
  "resolution": "1080p",
  "fps": 30,
  "style": "cinematic"
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

## 🔧 常見問題

### Q: 需要 API 金鑰嗎？
A: 大多數模型需要，你可以在表單右上角輸入。

### Q: 影片生成多久？
A: 通常 10-60 秒不等，取決於模型和客戶端負載。

### Q: 可以批量生成嗎？
A: 可以使用 Workers API 進行批量處理。

## 📄 授權

MIT 授權