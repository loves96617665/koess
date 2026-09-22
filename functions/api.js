// Cloudflare Workers API Proxy
// 用於代理影片生成 API 請求

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 取得要轉發的目標 API
        const targetApi = this.getTargetApi(url);

        // 轉發請求
        const response = await this.proxyRequest(request, targetApi, env);

        return response;
    },

    getTargetApi(url) {
        // 根據路由決定目標 API
        // 這裡可以使用環境變數或硬編碼的 API 端點
        const apiEndpoints = {
            // Kling-AIGC API
            'kling': 'https://api.klingai.com',
            // Seedance API
            'seedance': 'https://api.seedance.tech',
            // OpenAI API
            'openai': 'https://api.openai.com',
            // 自訂 API
            'custom': env.CUSTOM_API_URL || 'https://your-custom-api.com'
        };

        // 從 URL 參數獲取模型類型
        const model = url.searchParams.get('model') || 'kling';
        return apiEndpoints[model] || apiEndpoints['kling'];
    },

    async proxyRequest(request, targetApi, env) {
        // 取得 API 金鑰
        const apiKey = env.API_KEY || request.headers.get('X-API-Key') || '';

        // 建立新的請求
        const targetUrl = new URL(request.url);
        targetUrl.protocol = 'https:';
        targetUrl.host = targetApi.replace('https://', '').replace('http://', '');

        // 轉發請求
        const newHeaders = new Headers(request.headers);
        newHeaders.set('Authorization', `Bearer ${apiKey}`);
        newHeaders.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || 'unknown');

        const init = {
            method: request.method,
            headers: newHeaders,
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
        };

        try {
            const response = await fetch(targetUrl.toString(), init);

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
            return new Response(JSON.stringify({ error: 'API 代理失敗', details: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};

// 處理 CORS 預檢請求
// export const config = {
//     cors: true
// };