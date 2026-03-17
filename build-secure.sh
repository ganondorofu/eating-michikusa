#!/bin/bash
# ============================================================
# MICHIKUSA — Vercel Build Script (Secure Version)
#
# This script no longer exposes API keys to the frontend.
# API keys are kept secure in environment variables and used
# only by the backend serverless functions.
# ============================================================

echo "🌿 MICHIKUSA ビルドスクリプトを開始します..."

# 環境変数 ZHIPU_API_KEY が設定されているか確認
if [ -z "$ZHIPU_API_KEY" ]; then
  echo "⚠️  警告: ZHIPU_API_KEY 環境変数が設定されていません"
  echo "   Vercel環境変数で ZHIPU_API_KEY を設定してください"
  echo "   バックエンドAPIプロキシが正しく動作しません"
else
  echo "✅ ZHIPU_API_KEY 環境変数が検出されました"
  echo "   バックエンドAPIプロキシで安全に使用されます"
fi

# config.js を生成（フロントエンドにはAPIキーを含めない）
cat > config.js << 'EOF'
// ============================================================
// MICHIKUSA — 設定ファイル（セキュア版）
//
// このファイルは Vercel ビルド時に自動生成されました
// セキュリティのため、API キーはフロントエンドに含まれていません
// すべてのAPI呼び出しはバックエンドプロキシ経由で行われます
// ============================================================

// API キーはバックエンドのみで使用
// フロントエンドには公開されません
let API_KEY = null;
EOF

echo "✅ config.js を生成しました（APIキーなし）"
echo "🔒 API キーはバックエンドのみで安全に管理されます"
echo "🌿 ビルドスクリプトが正常に完了しました"
