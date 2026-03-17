# セキュリティガイド

## 概要

MICHIKUSA プロジェクトは、APIキーをバックエンド（Vercel Serverless Functions）で安全に管理する設計に変更されました。このドキュメントでは、セキュリティアーキテクチャと設定方法について説明します。

---

## 🔒 セキュリティアーキテクチャ

### 従来の問題点（修正前）

- ❌ APIキーがフロントエンド（`config.js`）に直接埋め込まれていた
- ❌ ブラウザの開発者ツールでAPIキーが簡単に取得可能
- ❌ APIキーの不正利用リスク

### 新しいアーキテクチャ（修正後）

```
クライアント（ブラウザ）
    ↓ 画像データ + プロンプト
    ↓ POST /api/chat
    ↓
Vercel Serverless Functions (api/chat.js)
    ↓ 環境変数 ZHIPU_API_KEY を使用
    ↓ Authorization: Bearer ${ZHIPU_API_KEY}
    ↓
Zhipu AI API
```

**セキュリティ対策**:
- ✅ APIキーはサーバーサイド（環境変数）でのみ管理
- ✅ フロントエンドには露出しない（`config.js`に`API_KEY = null`）
- ✅ レート制限（1分間に10リクエスト/IP）
- ✅ ペイロードサイズ制限（5MB）
- ✅ CORS設定（許可されたオリジンのみ）

---

## 🚀 デプロイ設定

### Vercel 環境変数の設定

1. Vercelプロジェクトのダッシュボードを開く
2. **Settings** → **Environment Variables** に移動
3. 以下の環境変数を追加：

| 変数名 | 値 | 環境 |
|-------|-----|------|
| `ZHIPU_API_KEY` | あなたのZhipu AI APIキー | Production, Preview, Development |

**APIキーの取得方法**:
- [Zhipu AI コンソール](https://open.bigmodel.cn/usercenter/apikeys) でAPIキーを取得

4. 環境変数を追加後、再デプロイする

---

## 🛡️ セキュリティ機能の詳細

### 1. レート制限

**設定**: 1分間に10リクエスト/IP

```javascript
// api/chat.js
function checkRateLimit(ip, windowMs = 60000, maxRequests = 10) {
  // ...
}
```

**超過時の動作**:
- HTTPステータス: `429 Too Many Requests`
- レスポンス: `{ "error": "リクエストが多すぎます。しばらくお待ちください。" }`

### 2. ペイロードサイズ制限

**設定**: 5MB

```javascript
// api/chat.js
const bodySize = JSON.stringify(req.body).length;
if (bodySize > 5 * 1024 * 1024) {
  return res.status(413).json({ error: 'Payload too large' });
}
```

### 3. CORS設定

**許可されたオリジン**:
- `https://${VERCEL_URL}` （Vercel自動生成URL）
- `https://eating-michikusa.vercel.app` （本番ドメイン）
- `http://localhost:3000`, `http://localhost:8080` （開発環境）

### 4. モデル検証

**サポートされているモデル**:
- `glm-4.6v-flash` （ビジョンモデル）
- `glm-4.7-flash` （テキストモデル）

```javascript
// api/chat.js
const supportedModels = ['glm-4.6v-flash', 'glm-4.7-flash'];
if (!supportedModels.includes(model)) {
  return res.status(400).json({ error: 'Unsupported model' });
}
```

---

## 🔧 ローカル開発

### 開発環境での設定

ローカル開発では、Vercel CLIを使用して環境変数を管理します。

1. **Vercel CLIのインストール**:
```bash
npm install -g vercel
```

2. **プロジェクトのリンク**:
```bash
vercel link
```

3. **環境変数の取得**:
```bash
vercel env pull .env.local
```

4. **ローカルサーバーの起動**:
```bash
vercel dev
```

これで、`http://localhost:3000` でローカル環境が起動し、Serverless Functionsも動作します。

---

## 🧪 テスト

### APIエンドポイントのテスト

```bash
# ビジョンモデルのテスト
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-4.6v-flash",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "こんにちは"}
      ]
    }],
    "max_tokens": 100
  }'
```

### レート制限のテスト

```bash
# 連続して11回リクエストを送信（11回目で429エラー）
for i in {1..11}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"model":"glm-4.7-flash","messages":[{"role":"user","content":"test"}]}'
  echo ""
done
```

---

## 📚 関連ファイル

| ファイル | 説明 |
|---------|------|
| `api/chat.js` | Vercel Serverless Function（APIプロキシ） |
| `build-secure.sh` | セキュアビルドスクリプト（APIキーをフロントエンドに含めない） |
| `vercel.json` | Vercel設定（Serverless Functions設定を含む） |
| `app.js` | フロントエンド（バックエンドAPI経由で呼び出す） |

---

## 🔐 セキュリティのベストプラクティス

1. **APIキーを絶対にGitにコミットしない**
   - `.gitignore` で `config.js` が除外されていることを確認

2. **本番環境では必ずセキュアビルドを使用**
   - `vercel.json` で `buildCommand: "bash build-secure.sh"` を設定

3. **環境変数はVercelダッシュボードで管理**
   - コードに直接書かない

4. **定期的にAPIキーをローテーション**
   - 3-6ヶ月ごとにZhipu AIコンソールで新しいキーを生成

5. **異常なアクセスを監視**
   - Vercelログでレート制限エラーを確認
   - 異常なトラフィックがあればAPIキーを再生成

---

## 🆘 トラブルシューティング

### エラー: "Server configuration error"

**原因**: 環境変数 `ZHIPU_API_KEY` が設定されていない

**解決策**:
1. Vercelダッシュボードで環境変数を確認
2. 設定後、再デプロイ

### エラー: "Too many requests"

**原因**: レート制限超過（1分間に10リクエスト）

**解決策**:
- 1分間待ってから再試行
- 開発環境であれば、`api/chat.js` の `maxRequests` を一時的に増やす

### エラー: "CORS error"

**原因**: 許可されていないオリジンからのリクエスト

**解決策**:
- `api/chat.js` の `allowedOrigins` にドメインを追加
- 再デプロイ

---

## 📝 変更履歴

| 日付 | バージョン | 変更内容 |
|------|----------|---------|
| 2026-03-17 | 2.0.0 | APIキーをバックエンド管理に変更、Serverless Functions導入 |
| 2026-03-17 | 1.0.0 | 初版（フロントエンドでAPIキー管理） |

---

## 📞 サポート

セキュリティに関する問題を発見した場合は、GitHubのIssueで報告してください。

**セキュリティ脆弱性の報告**:
- 公開せずに報告したい場合は、リポジトリオーナーに直接連絡してください

---

**最終更新**: 2026年3月17日
