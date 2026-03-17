/**
 * API module for Zhipu AI GLM integration (Backend Proxy Version)
 *
 * This version uses a secure backend proxy instead of direct API calls.
 * The API key is kept secure on the server and never exposed to the frontend.
 *
 * @module api
 */

import { fetchWithRetry } from './utils.js';

/**
 * Gets the base URL for API calls
 * In production, this uses the backend proxy to keep API keys secure
 * @returns {string} API base URL
 */
function getAPIBaseURL() {
  // In production, always use the backend proxy
  // This keeps the API key secure on the server side
  return '/api/chat';
}

/**
 * Builds prompt for gourmet review
 * @param {Object} scores - Analyzed scores
 * @param {string} [detectedClass] - Detected plant class name
 * @returns {string} Formatted prompt
 */
export function buildGourmetPrompt(scores, detectedClass) {
  const plantInfo = detectedClass
    ? `\n【AI植物認識結果】\nMobileNet v2による植物クラス分類: ${detectedClass}\n`
    : '';

  const warningRatio = scores._warningRatio ?? 0;
  const warningNote =
    warningRatio > 0.25
      ? `\n【警戒色アラート】警戒色比率 ${(warningRatio * 100).toFixed(0)}% — 赤・橙・紫系の高彩度色が植物の${(warningRatio * 100).toFixed(0)}%を占めています。「食後の後悔予想」の評価文では、この外見の禍々しさを修辞的かつ婉曲に、しかし明確に表現してください。`
      : '';

  // Remove internal fields from display
  const { _warningRatio: _, ...displayScores } = scores;

  return `あなたは世界的に著名なグルメ評論家です。今、目の前に「道端で採取された野草」が持ち込まれました。
添付の画像と以下の解析スコア（各軸0〜5点満点）をもとに、真剣なグルメレビューを日本語で書いてください。
${plantInfo}${warningNote}
【画像解析スコア】
${JSON.stringify(displayScores, null, 2)}

【スコアの算出根拠】
- elegance（外見の気品）: 色相ShannonエントロピーH×平均彩度^0.6の幾何平均
- chefDesire（シェフ熱望度）: 緑ピクセル平均彩度×空間連結性√coherence
- rarity（珍味感）: 輝度ヒストグラムの正規化Shannonエントロピー
- roadside（道端感）: 緑被覆率^0.6×ゾーン均一性(1/(1+CV))
- regret（食後の後悔予想）: 暗部率×0.35+不審色率×0.35+輝度コントラストtanh×0.30

【出力形式（必ずこの構成で出力すること）】

[タグライン]
一言で表す詩的なキャッチコピー（20字以内）

[総評]
全体的なグルメ評価（150〜200字。ミシュランガイドのような格調ある文体で）

[各軸コメント]
- 外見の気品：（スコア${scores.elegance}点をもとに、見た目の評価を2〜3文で）
- シェフ熱望度：（スコア${scores.chefDesire}点をもとに、プロの調理人が唸るかどうかを2〜3文で）
- 珍味感：（スコア${scores.rarity}点をもとに、希少性・複雑さを2〜3文で）
- 道端感：（スコア${scores.roadside}点をもとに、野生のテロワールを2〜3文で）
- 食後の後悔予想：（スコア${scores.regret}点をもとに、リスクを婉曲に2〜3文で）

[推奨ペアリング]
このグルメ体験に相応しい飲み物を1〜2種類、具体的に理由とともに提案

[ありえない調理法]
この野草を最大限に活かす、本格的だが完全に非現実的な調理法を1つ提案（100〜150字）

重要：全編にわたって終始真剣なトーンを保つこと。笑いを狙わず、本物のグルメ評論として書くこと。
末尾に必ず「※食べないでください」と添えること。`;
}

/**
 * Calls backend API proxy for Zhipu AI
 * The backend handles API key securely - frontend never sees it
 * @param {string} model - Model name (glm-4.6v-flash or glm-4.7-flash)
 * @param {Array} messages - Message array with content
 * @returns {Promise<string>} AI response text
 */
async function callBackendAPI(model, messages) {
  const apiURL = getAPIBaseURL();

  const response = await fetchWithRetry(
    apiURL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4000,
        stream: false
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content ?? '';
}

/**
 * Calls Zhipu AI vision API via backend proxy (GLM-4.6V-Flash)
 * @param {string} imageDataUrl - Base64 encoded image data URL
 * @param {string} prompt - Text prompt
 * @returns {Promise<string>} AI response text
 */
export async function callVisionAPI(imageDataUrl, prompt) {
  return await callBackendAPI('glm-4.6v-flash', [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageDataUrl } },
        { type: 'text', text: prompt }
      ]
    }
  ]);
}

/**
 * Calls Zhipu AI text API via backend proxy (GLM-4.7-Flash)
 * @param {string} prompt - Text prompt
 * @returns {Promise<string>} AI response text
 */
export async function callTextAPI(prompt) {
  return await callBackendAPI('glm-4.7-flash', [
    { role: 'user', content: prompt }
  ]);
}

/**
 * Runs vision analysis to get objective image description
 * @param {string} imageDataUrl - Base64 encoded image data URL
 * @param {string} [detectedClass] - Detected plant class
 * @returns {Promise<string>} Image description
 */
export async function runVisionAnalysis(imageDataUrl, detectedClass) {
  const prompt = `この植物の画像を客観的に観察し、以下の項目を箇条書きで簡潔に記述してください。評価・感想は一切含めず、観察事実のみ。
- 形態：葉の形・大きさ・縁の形状・茎や枝の特徴
- 色彩：全体の色、グラデーション、斑点・縞・変色の有無
- 質感：表面の艶・毛・ざらつき・肉厚感
- 状態：生育状況・鮮度・傷みの有無
- 特徴的部位：花・実・とげ・根・その他目立つ部位
${detectedClass ? `AI認識クラス: ${detectedClass}` : ''}`;

  return await callVisionAPI(imageDataUrl, prompt);
}

/**
 * Builds persona-specific prompt for multi-review
 * @param {string} personaId - Persona identifier
 * @param {Object} scores - Analysis scores
 * @param {string} [imageContext] - Vision analysis context
 * @returns {string} Persona prompt
 */
export function buildPersonaPrompt(personaId, scores, imageContext = '') {
  const context = imageContext || '（画像分析なし）';

  switch (personaId) {
    case 'french':
      return `You are Pierre Dubois, head chef of the three-Michelin-star restaurant "La Maison Verte" in Paris.
Evaluate the wild herb described below with absolute seriousness.

【Objective image analysis】
${context}

Scores: ${JSON.stringify(scores)}

Output in the following format. Each section must be written FIRST in French, then followed immediately by a Japanese translation in parentheses （日本語訳：…）:

[一言]
A brief evaluation in 20 characters or fewer — write in French first, then （日本語訳：〇〇）

[評価文]
Your assessment as head chef (~150 characters of Japanese equivalent). Write the French paragraph first, then （日本語訳：…） with the full translation. Discuss comparisons to French cuisine and potential as an ingredient with full seriousness.

[一押しポイント]
How this herb could be used in French cuisine, including specific techniques or dish names (~50 characters of Japanese equivalent). French first, then （日本語訳：…）.

Maintain an entirely serious tone throughout. End with "※食べないでください".`;

    case 'edo':
      return `あなたは江戸時代天保年間の食通、山田宗次郎です。
古風な日本語（候文や江戸言葉）を用いて、以下の野草を真剣に評価してください。

【客観的画像分析】
${context}

スコア: ${JSON.stringify(scores)}

以下の形式で出力してください：

[一言]
20字以内の古風な評価

[評価文]
この野草についての食通としての評価（150字程度）。季節感、侘び寂び、自然との調和を重視しつつ真剣に論じること。

[一押しポイント]
この野草を江戸料理に活かすとしたら（50字程度）

終始真剣かつ古風なトーンで。※食べないでください を末尾に。`;

    case 'herbalist':
      return `汝乃東洋醫學藥草研究家李文徳。以「氣・陰陽・五行」之觀點，嚴肅分析以下野草。

【客觀畫像分析】
${context}

評分數據: ${JSON.stringify(scores)}

請依下列格式輸出。各節先以文言漢文（古典的な漢文）で記述し、直後に（日本語訳：…）を付すこと：

[一言]
二十字以內之藥草評語——先に漢文、次に（日本語訳：〇〇）

[評価文]
此野草之藥草評價（日本語換算150字相当）。先に漢文の段落、次に（日本語訳：…）にて全文翻訳。氣の流れ・陰陽バランス・五臓への作用を論じること。評分數値も漢方的に解釈すること。

[一押しポイント]
此野草之藥效與適合之體質・症狀（日本語換算50字相当）。先に漢文、次に（日本語訳：…）。

終始嚴肅な漢方醫のトーンで。末尾に「※食べないでください」を付すこと。`;

    default:
      throw new Error(`Unknown persona: ${personaId}`);
  }
}
