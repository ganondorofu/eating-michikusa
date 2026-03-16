// ============================================================
// MICHIKUSA — API キー設定ファイル (テンプレート)
//
// このファイルをコピーして config.js を作成し、
// 実際の API キーを設定してください。
//
//   cp config.example.js config.js
//
// config.js は .gitignore により Git 管理対象外です。
// 絶対に API キーを直接コミットしないでください。
// ============================================================

// Zhipu AI (智谱AI) の API キー
// 取得: https://open.bigmodel.cn/usercenter/apikeys
//
// 設定方法（優先順位順）:
// 1. config.js ファイル（このファイルをコピーして作成）
// 2. URL パラメータ: ?api_key=your-key-here
// 3. localStorage: localStorage.setItem('MICHIKUSA_API_KEY', 'your-key-here')
//
// 注意: URL パラメータは履歴に残る可能性があるため、
// 本番環境では config.js の使用を推奨します。

let API_KEY = "your-zhipu-ai-api-key-here";

// 環境変数的な設定をサポート（フォールバック機能）
(function() {
  // 優先順位1: config.js の API_KEY がデフォルト値でない場合はそのまま使用
  if (API_KEY && API_KEY !== "your-zhipu-ai-api-key-here") {
    return;
  }

  // 優先順位2: URL パラメータから取得
  const urlParams = new URLSearchParams(window.location.search);
  const urlApiKey = urlParams.get('api_key') || urlParams.get('apiKey') || urlParams.get('API_KEY');
  if (urlApiKey) {
    API_KEY = urlApiKey;
    console.log('[MICHIKUSA] API キーを URL パラメータから読み込みました');
    return;
  }

  // 優先順位3: localStorage から取得
  const storedApiKey = localStorage.getItem('MICHIKUSA_API_KEY');
  if (storedApiKey) {
    API_KEY = storedApiKey;
    console.log('[MICHIKUSA] API キーを localStorage から読み込みました');
    return;
  }

  // どこからも取得できない場合は警告
  console.warn('[MICHIKUSA] API キーが設定されていません。config.js、URL パラメータ、または localStorage から設定してください。');
})();
