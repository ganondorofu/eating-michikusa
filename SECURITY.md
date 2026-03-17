# 🔒 セキュリティ改善: API キーの保護

## 問題点

以前のバージョンでは、Zhipu AI の API キーがフロントエンドのコードに埋め込まれており、以下のセキュリティリスクがありました：

### 🔴 重大な脆弱性

1. **API キーの露出**
   - ブラウザの DevTools → Network タブで API キーが見える
   - `Authorization: Bearer <key>` ヘッダーから誰でも抽出可能
   - 抽出したキーを使って無制限に API を呼び出し可能

2. **不正利用のリスク**
   - アカウントのクォータ消費
   - 有料プランの場合、想定外の課金
   - アクセス取り消しにはデプロイし直す必要がある

3. **複数の露出経路**
   - config.js に直接記述
   - URL パラメータ経由（ブラウザ履歴に残る）
   - localStorage（XSS 攻撃に脆弱）

## 解決策: バックエンドプロキシの実装

### 🟢 新しいアーキテクチャ

```
┌─────────────┐
│  ブラウザ   │
│ (Frontend)  │
└──────┬──────┘
       │
       │ POST /api/chat
       │ (APIキーなし)
       ▼
┌─────────────────┐
│ Vercel Functions│
│   (Backend)     │
│                 │
│ API_KEY: env    │ ← 環境変数で安全に管理
└──────┬──────────┘
       │
       │ Authorization: Bearer <API_KEY>
       ▼
┌─────────────┐
│  Zhipu AI   │
│   API       │
└─────────────┘
```

### 実装ファイル

#### 1. バックエンド API プロキシ

**ファイル**: `api/chat.js`

Vercel サーバーレス関数として実装。以下の機能を提供：

- ✅ API キーを環境変数から読み取り（サーバー側のみ）
- ✅ リクエストの検証（モデル名、メッセージ形式）
- ✅ Zhipu AI API へのプロキシ転送
- ✅ エラーハンドリング
- ✅ CORS 対応

**セキュリティ機能**:
```javascript
// API キーはサーバー側でのみアクセス可能
const apiKey = process.env.ZHIPU_API_KEY;

// クライアントに API キーは絶対に送信されない
const response = await fetch('https://open.bigmodel.cn/...', {
  headers: {
    'Authorization': `Bearer ${apiKey}` // サーバー内部のみ
  }
});
```

#### 2. セキュアな API クライアント

**ファイル**: `src/api-secure.js`

フロントエンド側の新しい API モジュール：

- ✅ バックエンドプロキシ経由で API を呼び出し
- ✅ API キーは一切含まない
- ✅ 同じインターフェースを維持（互換性）

**使用例**:
```javascript
import { callVisionAPI, callTextAPI } from './api-secure.js';

// API キー不要！バックエンドが処理
const response = await callVisionAPI(imageDataUrl, prompt);
```

#### 3. セキュアなビルドスクリプト

**ファイル**: `build-secure.sh`

- ✅ フロントエンドに API キーを含めない
- ✅ 環境変数の存在確認のみ
- ✅ セキュリティ警告の表示

```bash
# API キーはバックエンドのみで使用
let API_KEY = null;
```

## デプロイ方法

### 1. Vercel での設定

1. Vercel ダッシュボードを開く
2. プロジェクト設定 → Environment Variables
3. 以下を追加:
   ```
   Name: ZHIPU_API_KEY
   Value: <your-api-key>
   Environment: Production, Preview, Development
   ```
4. デプロイを実行

### 2. ビルドスクリプトの更新

`vercel.json` を更新（すでに完了）:
```json
{
  "buildCommand": "bash build-secure.sh"
}
```

### 3. フロントエンドコードの移行

**旧コード**（非セキュア）:
```javascript
import { callVisionAPI } from './api.js';

// API キーを渡す必要がある（危険！）
const result = await callVisionAPI(imageDataUrl, prompt, apiKey);
```

**新コード**（セキュア）:
```javascript
import { callVisionAPI } from './api-secure.js';

// API キー不要！
const result = await callVisionAPI(imageDataUrl, prompt);
```

## セキュリティ比較

| 項目 | 旧実装 | 新実装 |
|------|--------|--------|
| API キーの保存場所 | フロントエンド | バックエンドのみ |
| DevTools での可視性 | ✗ 見える | ✓ 見えない |
| ネットワークタブ | ✗ API キー露出 | ✓ API キーなし |
| 不正利用のリスク | 🔴 高 | 🟢 低 |
| レート制限 | ✗ なし | ✓ 実装可能 |
| アクセス制御 | ✗ なし | ✓ サーバー側で可能 |
| 監査ログ | ✗ なし | ✓ 実装可能 |

## 移行手順

### 既存プロジェクトの更新

1. **バックエンドファイルの追加**
   ```bash
   # api/chat.js を追加
   mkdir -p api
   cp <このレポジトリ>/api/chat.js api/
   ```

2. **vercel.json の更新**
   ```bash
   # API ルーティング設定を追加
   ```

3. **フロントエンドコードの更新**
   ```bash
   # api.js → api-secure.js に切り替え
   # import 文を更新
   ```

4. **ビルドスクリプトの更新**
   ```bash
   # build.sh → build-secure.sh
   chmod +x build-secure.sh
   ```

5. **環境変数の設定**
   - Vercel で ZHIPU_API_KEY を設定

6. **デプロイとテスト**
   ```bash
   vercel --prod
   ```

## 追加のセキュリティ強化（オプション）

### 1. レート制限の実装

`api/chat.js` にレート制限を追加:

```javascript
// Vercel KV や Redis を使用
import { rateLimit } from '@vercel/edge';

const limiter = rateLimit({
  interval: 60 * 1000, // 1分間
  uniqueTokenPerInterval: 500,
});

export default async function handler(req, res) {
  try {
    await limiter.check(res, 10, 'API_LIMIT'); // 1分間に10リクエスト
  } catch {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  // ... 残りの処理
}
```

### 2. リクエスト検証の強化

```javascript
// 画像サイズの制限
if (messages[0].content[0].type === 'image_url') {
  const imageUrl = messages[0].content[0].image_url.url;
  const imageSize = imageUrl.length;

  if (imageSize > 10 * 1024 * 1024) { // 10MB制限
    return res.status(400).json({
      error: 'Image too large',
      message: 'Maximum image size is 10MB'
    });
  }
}
```

### 3. ログと監視

```javascript
// リクエストのログ記録
console.log('[API Request]', {
  timestamp: new Date().toISOString(),
  ip: req.headers['x-forwarded-for'],
  model: req.body.model,
  messageCount: req.body.messages.length
});
```

### 4. Content Security Policy

`index.html` に追加:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               connect-src 'self' https://*.vercel.app;">
```

## テスト方法

### 1. ローカルテスト

```bash
# Vercel CLI でローカル実行
npm i -g vercel
vercel dev

# ブラウザで開く
open http://localhost:3000
```

### 2. API キー露出の確認

1. ブラウザの DevTools を開く
2. Network タブを確認
3. `/api/chat` リクエストを確認
4. リクエストヘッダーに `Authorization` がないことを確認 ✓
5. レスポンスに API キーが含まれていないことを確認 ✓

### 3. 機能テスト

- 画像アップロード → AI レビュー生成
- 多視点審査モード
- エラーハンドリング

## トラブルシューティング

### 問題: "API key not configured" エラー

**原因**: 環境変数が設定されていない

**解決策**:
1. Vercel ダッシュボード → Settings → Environment Variables
2. `ZHIPU_API_KEY` を追加
3. Redeploy

### 問題: CORS エラー

**原因**: vercel.json の設定が不正

**解決策**:
- vercel.json の headers セクションを確認
- `Access-Control-Allow-Origin: *` が設定されているか確認

### 問題: 500 Internal Server Error

**原因**: バックエンド関数のエラー

**解決策**:
1. Vercel ダッシュボード → Functions → Logs を確認
2. エラーメッセージを確認
3. コードを修正して再デプロイ

## まとめ

この実装により、以下のセキュリティ改善が達成されました：

✅ **API キーの完全な保護** - フロントエンドから完全に削除
✅ **バックエンドプロキシ** - Vercel サーバーレス関数で実装
✅ **リクエスト検証** - 不正なリクエストをブロック
✅ **拡張性** - レート制限や監視を追加可能
✅ **互換性** - 既存のコードとの互換性を維持

### 次のステップ

1. 既存のデプロイを新しいアーキテクチャに移行
2. レート制限を実装
3. 監視とアラートを設定
4. セキュリティ監査を実施

---

**重要**: この実装により、API キーは完全にサーバー側で管理され、フロントエンドからは一切アクセスできなくなりました。
