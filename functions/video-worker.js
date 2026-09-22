/**
 * Cloudflare Workers Video Generator Proxy
 * 用於代理影片生成 API 請求
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 處理 CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
                }
            });
        }

        // 取得目標 API
        const targetApi = this.getTargetApi(url);

        // 轉發請求
        return await this.proxyRequest(request, targetApi, env);
    },

    getTargetApi(url) {
        const model = url.searchParams.get('model') || 'kling';

        // 需要的 API 端點
        const endpoints = {
            'kling': 'https://api.klingai.com',
            'seedance': 'https://api.seedance.tech',
            'sora': 'https://api.openai.com',
            'default': 'https://api.klingai.com'
        };

        // 可以從環境變數讀取
        return env.API_BASE_URL || endpoints[model] || endpoints['default'];
    },

    async proxyRequest(request, targetApi, env) {
        try {
            const targetUrl = new URL(request.url);
            targetUrl.protocol = 'https:';

            // 取得 API 金鑰
            const apiKey = env.API_KEY || request.headers.get('X-API-Key') || '';

            const headers = new Headers(request.headers);
            headers.set('Authorization', `Bearer ${apiKey}`);
            headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || 'unknown');
            headers.set('Accept', 'application/json');

            const body = request.method !== 'GET' && request.method !== 'HEAD'
                ? await request.text()
                : undefined;

            const response = await fetch(targetUrl.toString(), {
                method: request.method,
                headers,
                body
            });

            // 回傳結果
            return new Response(response.body, {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        } catch (error) {
            return new Response(JSON.stringify({
                error: 'API 代理失敗',
                details: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};