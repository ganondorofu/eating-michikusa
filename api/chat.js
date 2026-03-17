/**
 * Vercel Serverless Function - Zhipu AI Chat API Proxy
 *
 * This function acts as a secure proxy between the frontend and Zhipu AI API.
 * The API key is kept secure on the server side and never exposed to the client.
 *
 * Security features:
 * - API key stored in environment variables (server-side only)
 * - Request validation
 * - Error handling
 * - CORS configuration
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  // Get API key from environment variable (secure - never exposed to client)
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    console.error('[API Error] ZHIPU_API_KEY environment variable is not set');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'API key not configured. Please contact the administrator.'
    });
  }

  // Validate request body
  if (!req.body) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Request body is required'
    });
  }

  const { model, messages, max_tokens = 4000, stream = false } = req.body;

  // Validate required fields
  if (!model || !messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Invalid request format. Required fields: model, messages (array)'
    });
  }

  // Validate model is one of the allowed models
  const allowedModels = ['glm-4.6v-flash', 'glm-4.7-flash'];
  if (!allowedModels.includes(model)) {
    return res.status(400).json({
      error: 'Bad request',
      message: `Invalid model. Allowed models: ${allowedModels.join(', ')}`
    });
  }

  try {
    // Forward request to Zhipu AI API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // API key stays on server
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        stream
      })
    });

    // Get response data
    const data = await response.json();

    // Forward the status and response from Zhipu AI
    if (!response.ok) {
      console.error('[Zhipu AI Error]', response.status, data);
      return res.status(response.status).json(data);
    }

    // Success - return the AI response
    return res.status(200).json(data);

  } catch (error) {
    console.error('[API Proxy Error]', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process request. Please try again later.'
    });
  }
}
