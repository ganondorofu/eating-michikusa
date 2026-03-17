#!/bin/bash
# ============================================================
# MICHIKUSA — Secure Build Script for Production
#
# APIキーをフロントエンドに露出させない安全なビルド設定
# Vercel環境変数ZHIPU_API_KEYはバックエンド（Serverless Functions）でのみ使用
# ============================================================

echo "🔒 MICHIKUSA セキュアビルドスクリプトを開始します..."

# config.js を生成（APIキーは含めない）
cat > config.js << 'EOF'
// ============================================================
// MICHIKUSA — セキュア設定ファイル
//
// このファイルはビルド時に自動生成されました
// APIキーはサーバーサイド（Vercel Serverless Functions）で管理されます
// フロントエンドにはAPIキーを含めません
// ============================================================

// APIキーはバックエンドで管理（フロントエンドには null を設定）
let API_KEY = null;

console.log('[MICHIKUSA] セキュアモード: APIキーはバックエンドで管理されています');
EOF

echo "✅ config.js を生成しました（APIキーなし・セキュアモード）"
echo "🔒 APIキーはVercel Serverless Functions（api/chat.js）でのみ使用されます"
echo "🌿 セキュアビルドスクリプトが正常に完了しました"
