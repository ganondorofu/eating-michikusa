/**
 * MICHIKUSA — Vercel Serverless Function
 *
 * Zhipu AI APIへのプロキシエンドポイント
 * APIキーをサーバーサイドで安全に扱う
 */

// レート制限用のメモリストア（本番環境ではRedis推奨）
const rateLimitStore = new Map();

/**
 * レート制限チェック
 * @param {string} ip - クライアントIP
 * @param {number} windowMs - 時間窓（ミリ秒）
 * @param {number} maxRequests - 最大リクエスト数
 * @returns {boolean} - リクエストを許可するか
 */
function checkRateLimit(ip, windowMs = 60000, maxRequests = 10) {
  const now = Date.now();

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }

  const requests = rateLimitStore.get(ip).filter(time => now - time < windowMs);
  requests.push(now);
  rateLimitStore.set(ip, requests);

  // 古いエントリをクリーンアップ（メモリ節約）
  if (rateLimitStore.size > 1000) {
    const oldestAllowed = now - windowMs;
    for (const [key, times] of rateLimitStore.entries()) {
      if (times.every(t => t < oldestAllowed)) {
        rateLimitStore.delete(key);
      }
    }
  }

  return requests.length <= maxRequests;
}

/**
 * Vercel Serverless Function ハンドラー
 */
export default async function handler(req, res) {
  // CORS設定
  const allowedOrigins = [
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'https://eating-michikusa.vercel.app',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : null,
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // APIキーの存在確認
  if (!process.env.ZHIPU_API_KEY) {
    console.error('[API] ZHIPU_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // クライアントIPの取得（レート制限用）
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown';

  // レート制限チェック（1分間に10リクエスト）
  if (!checkRateLimit(clientIp, 60000, 10)) {
    console.warn(`[API] Rate limit exceeded for IP: ${clientIp}`);
    return res.status(429).json({
      error: 'リクエストが多すぎます。しばらくお待ちください。'
    });
  }

  // リクエストボディのサイズチェック（5MB制限）
  const bodySize = JSON.stringify(req.body).length;
  if (bodySize > 5 * 1024 * 1024) {
    console.warn(`[API] Payload too large: ${bodySize} bytes from IP: ${clientIp}`);
    return res.status(413).json({ error: 'Payload too large' });
  }

  try {
    const { model, messages, max_tokens, stream } = req.body;

    // 入力検証
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // サポートされているモデルのチェック
    const supportedModels = ['glm-4.6v-flash', 'glm-4.7-flash'];
    if (!supportedModels.includes(model)) {
      return res.status(400).json({ error: 'Unsupported model' });
    }

    // Zhipu AI APIへのリクエスト
    console.log(`[API] Calling Zhipu AI with model: ${model}, IP: ${clientIp}`);

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: max_tokens || 4000,
        stream: stream || false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Zhipu AI error: ${response.status} - ${errorText}`);

      // 429エラー（レート制限）の特別処理
      if (response.status === 429) {
        return res.status(429).json({
          error: 'AI APIが混雑しています。しばらくお待ちください。',
          retryAfter: response.headers.get('retry-after') || 60,
        });
      }

      return res.status(response.status).json({
        error: 'AI API error',
        details: errorText,
      });
    }

    const data = await response.json();
    console.log(`[API] Success for IP: ${clientIp}`);

    return res.status(200).json(data);

  } catch (error) {
    console.error('[API] Internal error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
