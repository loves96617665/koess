/**
 * API 客戶端 - 影片生成站
 * 支援多種影片生成 API 格式
 */

class VideoGeneratorClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || '';
        this.apiKey = config.apiKey || '';
        this.headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'VideoGenerator/1.0',
            ...config.headers
        };
    }

    setApiKey(key) {
        this.apiKey = key;
        this.headers['Authorization'] = `Bearer ${key}`;
    }

    setBaseURL(url) {
        this.baseURL = url;
    }

    /**
     * 使用 OpenAI 格式生成影片
     * OpenAI video 模型假設格式 (模擬)
     */
    async generateVideoOpenAI(params) {
        const requestBody = {
            model: params.model || 'video-model',
            prompt: params.prompt,
            // OpenAI video 格式
            video: {
                duration: params.duration || 8,
                width: this.getResolutionWidth(params.resolution),
                height: this.getResolutionHeight(params.resolution),
                fps: params.fps || 30
            }
        };

        // Add quality and style options
        if (params.style) {
            requestBody.style = params.style;
        }

        try {
            const response = await fetch(`${this.baseURL}/v1/videos/generations`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API 錯誤: ${response.status} ${response.statusText}\n${JSON.stringify(errorData)}`);
            }

            const result = await response.json();
            return this.formatResponse(result, 'openai');
        } catch (error) {
            console.error('生成影片失敗:', error);
            throw error;
        }
    }

    /**
     * 使用 Kling-AIGC 格式生成影片
     */
    async generateVideoKling(params) {
        const requestBody = {
            model: params.model || 'kling-v1',
            prompt: params.prompt,
            duration: params.duration || 8,
            negative_prompt: 'bad quality, blurry, low resolution',
            safety_filter: true,
            // 解析度轉換
            ...this.getResolutionParams(params.resolution),
            fps: params.fps || 30,
            style: params.style || 'default',
            seed: params.seed || Math.floor(Math.random() * 1000000)
        };

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
            return this.formatResponse(result, 'kling');
        } catch (error) {
            console.error('生成影片失敗:', error);
            throw error;
        }
    }

    /**
     * 使用 Seedance 格式生成影片
     */
    async generateVideoSeedance(params) {
        const requestBody = {
            prompt: params.prompt,
            duration: params.duration || 8,
            resolution: params.resolution || '1080p',
            fps: params.fps || 30,
            model_version: params.model || 'seedance-v1.5',
            refine: true,
            stylize: 0.5,
            ...(params.style && { style: params.style }),
            seed: params.seed || Math.floor(Math.random() * 1000000)
        };

        try {
            const response = await fetch(`${this.baseURL}/v1/generate`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API 錯誤: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return this.formatResponse(result, 'seedance');
        } catch (error) {
            console.error('生成影片失敗:', error);
            throw error;
        }
    }

    /**
     * 格式化 API 回應
     */
    formatResponse(result, apiType) {
        // 根據不同 API 類型格式化回應
        switch (apiType) {
            case 'openai':
                return {
                    task_id: result.id || result.task_id,
                    status: result.status || 'processing',
                    video_url: result.output?.video_url || result.video_url,
                    created_at: result.created_at,
                    model: result.model
                };
            case 'kling':
                return {
                    task_id: result.task_id || result.id,
                    status: result.status || 'processing',
                    video_url: result.video_url || result.url,
                    created_at: result.created_at,
                    model: result.model
                };
            case 'seedance':
                return {
                    task_id: result.task_id || result.id,
                    status: result.status || 'processing',
                    video_url: result.video_url || result.url,
                    created_at: result.created_at,
                    model: result.model_version
                };
            default:
                return result;
        }
    }

    /**
     * 獲取解析度參數
     */
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

    /**
     * 輪詢影片生成狀態
     */
    async pollVideoStatus(taskId, maxAttempts = 60, interval = 2000) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(`${this.baseURL}/v1/videos/status/${taskId}`, {
                    headers: this.headers
                });

                const result = await response.json();

                if (result.status === 'completed' || result.video_url || result.output?.video_url) {
                    return result;
                }

                await new Promise(resolve => setTimeout(resolve, interval));
            } catch (error) {
                console.error('輪詢狀態失敗:', error);
            }
        }
        throw new Error('輪詢超時，影片生成失敗');
    }
}

/**
 * 影片生成應用程式
 */
class VideoGeneratorApp {
    constructor(config = {}) {
        this.client = new VideoGeneratorClient(config);
        this.history = JSON.parse(localStorage.getItem('videoHistory') || '[]');
        this.apiType = 'kling'; // 預設使用 Kling 格式
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadHistory();
    }

    bindEvents() {
        const form = document.getElementById('videoForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const apiKeyInput = document.getElementById('api-key');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('change', (e) => {
                if (e.target.value.trim()) {
                    this.client.setApiKey(e.target.value.trim());
                }
            });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const params = Object.fromEntries(formData);

        const btn = document.getElementById('generateBtn');
        const btnText = document.getElementById('btnText');
        const loading = document.getElementById('loading');

        if (btn) btn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (loading) loading.style.display = 'inline';

        try {
            const result = await this.generateVideo(params);
            this.showResult(result, params);
            this.saveToHistory(params, result);
        } catch (error) {
            alert('生成失敗: ' + error.message);
        } finally {
            if (btn) btn.disabled = false;
            if (btnText) btnText.style.display = '';
            if (loading) loading.style.display = 'none';
        }
    }

    async generateVideo(params) {
        // 設定 API 端點
        const endpoints = {
            'kling-v1': 'https://api.klingai.com',
            'seedance': 'https://api.seedance.tech',
            'openai-sora': 'https://api.openai.com',
            'custom': params['api-key'] ? 'https://api.custom.com' : ''
        };

        const endpoint = endpoints[params.model] || endpoints['kling-v1'];
        this.client.setBaseURL(endpoint);

        // 根據模型類型選擇不同的生成方法
        if (params.model && params.model.includes('sora')) {
            return await this.client.generateVideoOpenAI(params);
        } else if (params.model && params.model.includes('seedance')) {
            return await this.client.generateVideoSeedance(params);
        } else {
            return await this.client.generateVideoKling(params);
        }
    }

    showResult(result, params) {
        const resultDiv = document.getElementById('result');
        const videoContainer = document.getElementById('videoContainer');
        const downloadBtn = document.getElementById('downloadBtn');

        const videoUrl = result.video_url || result.url || result.output?.video_url;

        if (videoUrl) {
            if (videoContainer) {
                videoContainer.innerHTML = `
                    <video controls>
                        <source src="${videoUrl}" type="video/mp4">
                        您的瀏覽器不支援影片播放。
                    </video>
                    <p style="color: #8892a0; margin-top: 10px;">
                        模型: ${params.model} | 狀態: ${result.status}
                    </p>
                `;
            }
            if (downloadBtn) {
                downloadBtn.onclick = () => window.open(videoUrl, '_blank');
                downloadBtn.style.display = 'block';
            }
        } else {
            if (videoContainer) {
                videoContainer.innerHTML = `<p>影片生成中，請稍候...（工作中）</p>`;
            }
        }

        if (resultDiv) {
            resultDiv.style.display = 'block';
        }
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
                success: !!(result.video_url || result.url),
                task_id: result.task_id,
                video_url: result.video_url || result.url
            }
        };

        this.history.unshift(historyItem);
        this.history = this.history.slice(0, 50);
        localStorage.setItem('videoHistory', JSON.stringify(this.history));
        this.renderHistory();
    }

    loadHistory() {
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

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

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VideoGeneratorClient, VideoGeneratorApp };
}

// 自動初始化
document.addEventListener('DOMContentLoaded', () => {
    window.videoApp = new VideoGeneratorApp();
});