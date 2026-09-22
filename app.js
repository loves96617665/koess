// 影片生成站主應用程式

// API 客戶端配置
const API_CONFIG = {
    // 把這裡的 API 端點換成你分析到的實際端點
    baseEndpoints: {
        'kling-v1': 'https://api.klingai.com/v1',
        'seedance': 'https://api.seedance.tech/v1',
        'openai-sora': 'https://api.openai.com/v1',
        'custom': '' // 自訂端點
    },
    defaultModel: 'kling-v1'
};

// 影片生成客戶端
class VideoGeneratorClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || '';
        this.apiKey = config.apiKey || '';
        this.headers = config.headers || {
            'Content-Type': 'application/json',
            'User-Agent': 'VideoGenerator/1.0'
        };
    }

    // 設定 API 金鑰
    setApiKey(key) {
        this.apiKey = key;
        this.headers['Authorization'] = `Bearer ${key}`;
    }

    // 設定自訂端點
    setBaseURL(url) {
        this.baseURL = url;
    }

    // 呼叫影片生成 API
    async generateVideo(params) {
        const requestBody = {
            model: params.model,
            prompt: params.prompt,
            duration: params.duration || 8,
            width: this.getResolutionWidth(params.resolution),
            height: this.getResolutionHeight(params.resolution),
            fps: params.fps || 30,
            process_method: params.process_method || 'default',
            // 風格參數
            style: params.style || 'default',
            // 其他可選參數
            seed: params.seed || Math.floor(Math.random() * 1000000),
        };

        // 根據不同模型調整參數
        const modelSpecificParams = this.getModelParams(params.model, requestBody);
        Object.assign(requestBody, modelSpecificParams);

        try {
            const response = await fetch(`${this.baseURL}/video/generate`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API 錯誤: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('生成影片失敗:', error);
            throw error;
        }
    }

    // 取得不同模型的特定參數
    getModelParams(model, baseParams) {
        const params = {};

        // Kling-AIGC 模型參數
        if (model.includes('kling')) {
            params['negative_prompt'] = 'bad quality, blurry, low resolution';
            params['safety_filter'] = true;
        }

        // Seedance 模型參數
        if (model.includes('seedance')) {
            params['refine'] = true;
            params['stylize'] = 0.5;
        }

        // OpenAI Sora 模型參數
        if (model.includes('sora')) {
            params['quality'] = 'medium';
            params['v speed'] = 1.0;
        }

        return params;
    }

    // 解析度轉換
    getResolutionWidth(resolution) {
        const resMap = {
            '480p': 854,
            '720p': 1280,
            '1080p': 1920,
            '4k': 3840
        };
        return resMap[resolution] || 1920;
    }

    getResolutionHeight(resolution) {
        const resMap = {
            '480p': 480,
            '720p': 720,
            '1080p': 1080,
            '4k': 2160
        };
        return resMap[resolution] || 1080;
    }

    // 輪詢影片生成狀態
    async pollVideoStatus(taskId, maxAttempts = 30, interval = 2000) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(`${this.baseURL}/video/status/${taskId}`, {
                    headers: this.headers
                });

                const result = await response.json();

                if (result.status === 'completed' || result.video_url) {
                    return result;
                }

                await new Promise(resolve => setTimeout(resolve, interval));
            } catch (error) {
                console.error('輪詢狀態失敗:', error);
            }
        }
        throw new Error('輪詢超時');
    }
}

// 主應用程式
class VideoGeneratorApp {
    constructor() {
        this.client = new VideoGeneratorClient();
        this.history = JSON.parse(localStorage.getItem('videoHistory') || '[]');
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderHistory();
    }

    bindEvents() {
        const form = document.getElementById('videoForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // 監聽 API 金鑰變更
        const apiKeyInput = document.getElementById('api-key');
        apiKeyInput.addEventListener('change', (e) => {
            if (e.target.value.trim()) {
                this.client.setApiKey(e.target.value.trim());
            }
        });
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const params = Object.fromEntries(formData);

        const btn = document.getElementById('generateBtn');
        const btnText = document.getElementById('btnText');
        const loading = document.getElementById('loading');

        // 顯示 loading 狀態
        btn.disabled = true;
        btnText.style.display = 'none';
        loading.style.display = 'inline';

        try {
            // 取得模型端點
            const modelEndpoint = this.getModelEndpoint(params.model);
            this.client.setBaseURL(modelEndpoint);

            // 生成影片
            const result = await this.client.generateVideo(params);

            // 輪詢完成狀態
            let finalResult = result;
            if (result.task_id) {
                finalResult = await this.client.pollVideoStatus(result.task_id);
            }

            // 顯示結果
            this.showResult(finalResult, params);

            // 加入歷史
            this.addToHistory(params, finalResult);

        } catch (error) {
            alert('生成失敗: ' + error.message);
        } finally {
            btn.disabled = false;
            btnText.style.display = '';
            loading.style.display = 'none';
        }
    }

    getModelEndpoint(model) {
        const endpoints = {
            'kling-v1': 'https://api.klingai.com',
            'seedance': 'https://api.seedance.tech',
            'openai-sora': 'https://api.openai.com',
            'custom': document.getElementById('api-key').value ?
                'https://api.custom.com' : ''
        };
        return endpoints[model] || endpoints['kling-v1'];
    }

    showResult(result, params) {
        const resultDiv = document.getElementById('result');
        const videoContainer = document.getElementById('videoContainer');
        const downloadBtn = document.getElementById('downloadBtn');

        if (result.video_url || result.url) {
            const videoUrl = result.video_url || result.url;
            videoContainer.innerHTML = `
                <video controls>
                    <source src="${videoUrl}" type="video/mp4">
                    您的瀏覽器不支援影片播放。
                </video>
                <p style="color: #8892a0; margin-top: 10px;">模型: ${params.model}</p>
            `;
            downloadBtn.onclick = () => window.open(videoUrl, '_blank');
        } else {
            videoContainer.innerHTML = `<p>影片生成中，請稍候...</p>`;
        }

        resultDiv.style.display = 'block';
    }

    addToHistory(params, result) {
        const historyItem = {
            timestamp: new Date().toISOString(),
            params: params,
            result: {
                success: !!(result.video_url || result.url),
                video_url: result.video_url || result.url
            }
        };

        this.history.unshift(historyItem);
        this.history = this.history.slice(0, 50); // 最多保留 50 筆
        localStorage.setItem('videoHistory', JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');

        if (this.history.length === 0) {
            historyList.innerHTML = '<p style="color: #8892a0;">暫無歷史紀錄</p>';
            return;
        }

        historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <div class="model">${item.params.model}</div>
                <div style="margin: 5px 0;">${new Date(item.timestamp).toLocaleString()}</div>
                <div style="color: #8892a0; font-size: 12px;">
                    ${item.params.prompt.substring(0, 50)}...
                </div>
            </div>
        `).join('');
    }
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    new VideoGeneratorApp();
});

// 導出模組（供測試使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VideoGeneratorClient, VideoGeneratorApp };
}