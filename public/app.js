// 影片生成站主應用程式

// API 客戶端配置
const API_CONFIG = {
    baseEndpoints: {
        'kling-v1': 'https://api.klingai.com',
        'seedance': 'https://api.seedance.tech',
        'openai-sora': 'https://api.openai.com',
        'custom': ''
    },
    defaultModel: 'kling-v1'
};

class VideoGeneratorClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || '';
        this.apiKey = config.apiKey || '';
        this.headers = config.headers || {
            'Content-Type': 'application/json',
            'User-Agent': 'VideoGenerator/1.0'
        };
    }

    setApiKey(key) {
        this.apiKey = key;
        this.headers['Authorization'] = `Bearer ${key}`;
    }

    setBaseURL(url) {
        this.baseURL = url;
    }

    async generateVideo(params) {
        // 根據模型選擇不同的 API 格式
        if (params.model && params.model.includes('sora')) {
            return this.generateVideoOpenAI(params);
        } else {
            return this.generateVideoDefault(params);
        }
    }

    /**
     * OpenAI Sora 影片生成格式 (假設)
     */
    async generateVideoOpenAI(params) {
        const requestBody = {
            model: 'sora-preview',
            prompt: params.prompt,
            n: 1,
            video: {
                duration: parseInt(params.duration) || 8,
                width: this.getResolutionWidth(params.resolution),
                height: this.getResolutionHeight(params.resolution),
                fps: parseInt(params.fps) || 30
            }
        };

        if (params.style) {
            requestBody.style = params.style;
        }

        console.log('OpenAI Video Request:', JSON.stringify(requestBody, null, 2));

        // 模擬 API 回應 (實際使用時會向真實 API 請求)
        return this.simulateVideoResponse(params);
    }

    /**
     * 預設影片生成格式 (Kling/Seedance)
     */
    async generateVideoDefault(params) {
        const requestBody = {
            model: params.model || 'kling-v1',
            prompt: params.prompt,
            duration: parseInt(params.duration) || 8,
            ...this.getResolutionParams(params.resolution),
            fps: parseInt(params.fps) || 30,
            ...(params.style && { style: params.style }),
            seed: parseInt(params.seed) || Math.floor(Math.random() * 1000000)
        };

        console.log('Default Video Request:', JSON.stringify(requestBody, null, 2));
        return this.simulateVideoResponse(params);
    }

    /**
     * 模擬影片生成回應
     * 實際部署時請替換為真實的 API 請求
     */
    async simulateVideoResponse(params) {
        // 模擬 API 呼叫延遲
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 模擬成功回應
        return {
            id: `video_${Date.now()}`,
            task_id: `task_${Math.random().toString(36).substr(2, 9)}`,
            status: 'completed',
            video_url: `https://example.com/videos/${params.model || 'default'}.mp4?seed=${Math.random().toString(36).substr(2, 5)}`,
            created_at: new Date().toISOString(),
            model: params.model,
            prompt: params.prompt,
            duration: parseInt(params.duration) || 8,
            resolution: params.resolution,
            fps: parseInt(params.fps) || 30
        };
    }

    getModelParams(model, baseParams) {
        const params = {};

        if (model.includes('kling')) {
            params['negative_prompt'] = 'bad quality, blurry, low resolution';
            params['safety_filter'] = true;
        }

        if (model.includes('seedance')) {
            params['refine'] = true;
            params['stylize'] = 0.5;
        }

        return params;
    }

    getResolutionParams(resolution) {
        const resMap = {
            '480p': { width: 854, height: 480 },
            '720p': { width: 1280, height: 720 },
            '1080p': { width: 1920, height: 1080 },
            '4k': { width: 3840, height: 2160 }
        };
        return resMap[resolution] || resMap['1080p'];
    }

    getResolutionWidth(resolution) {
        return this.getResolutionParams(resolution).width;
    }

    getResolutionHeight(resolution) {
        return this.getResolutionParams(resolution).height;
    }

    async pollVideoStatus(taskId, maxAttempts = 60, interval = 2000) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                await new Promise(resolve => setTimeout(resolve, interval));

                // 模擬狀態輪詢
                return {
                    task_id: taskId,
                    status: 'completed',
                    video_url: `https://example.com/videos/${taskId}.mp4`
                };
            } catch (error) {
                console.error('輪詢狀態失敗:', error);
            }
        }
        throw new Error('輪詢超時');
    }
}

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

        btn.disabled = true;
        btnText.style.display = 'none';
        loading.style.display = 'inline';

        try {
            const result = await this.client.generateVideo(params);
            this.showResult(result, params);
            this.saveToHistory(params, result);
        } catch (error) {
            alert('生成失敗: ' + error.message);
        } finally {
            btn.disabled = false;
            btnText.style.display = '';
            loading.style.display = 'none';
        }
    }

    showResult(result, params) {
        const resultDiv = document.getElementById('result');
        const videoContainer = document.getElementById('videoContainer');
        const downloadBtn = document.getElementById('downloadBtn');

        const videoUrl = result.video_url || result.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

        if (result.status === 'completed' || videoUrl) {
            videoContainer.innerHTML = `
                <video controls>
                    <source src="${videoUrl}" type="video/mp4">
                    您的瀏覽器不支援影片播放。
                </video>
                <p style="color: #8892a0; margin-top: 10px;">
                    模型: ${params.model} | 狀態: ${result.status} | 持續時間: ${params.duration}秒
                </p>
            `;
            downloadBtn.style.display = 'block';
        }

        resultDiv.style.display = 'block';
    }

    saveToHistory(params, result) {
        const historyItem = {
            timestamp: new Date().toISOString(),
            params: {
                model: params.model,
                prompt: params.prompt,
                duration: params.duration,
                resolution: params.resolution,
                fps: params.fps
            },
            result: {
                success: true,
                video_url: result.video_url
            }
        };

        this.history.unshift(historyItem);
        this.history = this.history.slice(0, 50);
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

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    window.videoApp = new VideoGeneratorApp();
});

export { VideoGeneratorClient, VideoGeneratorApp };