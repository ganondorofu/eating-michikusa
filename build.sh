#!/bin/bash
# ============================================================
# MICHIKUSA — Vercel Build Script
#
# Vercel の環境変数から config.js を生成するスクリプト
# ============================================================

echo "🌿 MICHIKUSA ビルドスクリプトを開始します..."

# 環境変数 ZHIPU_API_KEY が設定されているか確認
if [ -z "$ZHIPU_API_KEY" ]; then
  echo "⚠️  警告: ZHIPU_API_KEY 環境変数が設定されていません"
  echo "   config.example.js をテンプレートとして使用します"
  echo "   デプロイ後は URL パラメータまたは localStorage から API キーを設定してください"

  # config.js が存在しない場合のみ config.example.js をコピー
  if [ ! -f "config.js" ]; then
    cp config.example.js config.js
    echo "✅ config.example.js を config.js にコピーしました（デフォルト設定）"
  else
    echo "ℹ️  既存の config.js を使用します"
  fi
else
  echo "✅ ZHIPU_API_KEY 環境変数が検出されました"
  echo "   config.js を生成します..."

  # config.js を生成（環境変数から API キーを埋め込む）
  cat > config.js << 'EOF'
// ============================================================
// MICHIKUSA — API キー設定ファイル
//
// このファイルは Vercel ビルド時に自動生成されました
// 環境変数 ZHIPU_API_KEY から API キーが設定されています
// ============================================================

// Zhipu AI (智谱AI) の API キー
// Vercel 環境変数から自動設定
let API_KEY = "ENV_API_KEY_PLACEHOLDER";

// 環境変数的な設定をサポート（フォールバック機能）
(function() {
  // 優先順位1: config.js の API_KEY がデフォルト値でない場合はそのまま使用
  if (API_KEY && API_KEY !== "your-zhipu-ai-api-key-here" && API_KEY !== "ENV_API_KEY_PLACEHOLDER") {
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
EOF

  # 環境変数の値で置換（sedを使用）
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS の場合
    sed -i '' "s/ENV_API_KEY_PLACEHOLDER/$ZHIPU_API_KEY/" config.js
  else
    # Linux の場合
    sed -i "s/ENV_API_KEY_PLACEHOLDER/$ZHIPU_API_KEY/" config.js
  fi

  echo "✅ config.js を生成しました（API キー設定済み）"
fi

echo "🌿 ビルドスクリプトが正常に完了しました"
