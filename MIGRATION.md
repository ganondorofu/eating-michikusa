# 🔄 セキュアアーキテクチャへの移行ガイド

## 概要

このガイドでは、既存の MICHIKUSA デプロイをセキュアなバックエンドプロキシアーキテクチャに移行する手順を説明します。

## 移行が必要な理由

現在のバージョンでは API キーがフロントエンドに露出しており、以下のリスクがあります：

- 🔴 API キーが DevTools から抽出可能
- 🔴 不正利用によるクォータ消費
- 🔴 有料プランの場合、想定外の課金

**新しいアーキテクチャ** では、API キーを完全にサーバー側で管理し、これらのリスクを排除します。

## 移行手順

### ステップ 1: 環境変数の確認

Vercel ダッシュボードで環境変数を確認・設定します。

1. Vercel ダッシュボードを開く
2. プロジェクトを選択
3. **Settings** → **Environment Variables** に移動
4. `ZHIPU_API_KEY` が設定されているか確認

**設定されている場合**:
- ✅ そのまま次のステップへ

**設定されていない場合**:
```
Name: ZHIPU_API_KEY
Value: <your-api-key>
Environment: Production, Preview, Development
```

### ステップ 2: コードの更新

リポジトリを最新版に更新します。

```bash
git pull origin main
```

以下のファイルが追加されます：

**新規ファイル**:
- ✅ `api/chat.js` - バックエンド API プロキシ
- ✅ `src/api-secure.js` - セキュアな API クライアント
- ✅ `build-secure.sh` - セキュアビルドスクリプト
- ✅ `SECURITY.md` - セキュリティドキュメント
- ✅ `README-SECURITY.md` - セキュリティ補足

**更新されるファイル**:
- ✅ `vercel.json` - API ルーティング設定を追加

### ステップ 3: vercel.json の更新

`vercel.json` のビルドコマンドを更新します：

**変更前**:
```json
{
  "buildCommand": "bash build.sh"
}
```

**変更後**:
```json
{
  "buildCommand": "bash build-secure.sh",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### ステップ 4: フロントエンドコードの更新（オプション）

既存のコードをセキュアバージョンに切り替えます。

#### オプション A: シンボリックリンク（推奨）

```bash
cd src
mv api.js api-legacy.js
ln -s api-secure.js api.js
```

#### オプション B: インポート文の更新

すべてのファイルで `api.js` のインポートを `api-secure.js` に変更：

**変更前**:
```javascript
import { callVisionAPI } from './api.js';
```

**変更後**:
```javascript
import { callVisionAPI } from './api-secure.js';
```

**対象ファイル**:
- `app.js`（既存の場合）
- その他 API を使用するファイル

#### オプション C: 段階的移行

まず新規デプロイでテストし、問題がなければ本番に適用：

1. プレビュー環境でテスト
2. 動作確認
3. 本番環境に適用

### ステップ 5: デプロイ

変更をコミットしてデプロイします。

```bash
git add .
git commit -m "Migrate to secure backend proxy architecture"
git push origin main
```

Vercel が自動的にデプロイを開始します。

### ステップ 6: 動作確認

デプロイ後、以下を確認します：

#### 6.1 基本動作のテスト

1. デプロイされた URL にアクセス
2. 画像をアップロード
3. AI レビューが生成されることを確認

#### 6.2 セキュリティの確認

1. ブラウザの DevTools を開く（F12）
2. **Network** タブを選択
3. 画像をアップロードして AI レビューを生成
4. `/api/chat` リクエストを確認

**確認ポイント**:
- ✅ Request Headers に `Authorization` ヘッダーがない
- ✅ Request Body に API キーが含まれていない
- ✅ Response に API キーが含まれていない

**DevTools スクリーンショット例**:
```
Request Headers:
  Content-Type: application/json
  (Authorization ヘッダーなし ✓)

Request Payload:
  {
    "model": "glm-4.6v-flash",
    "messages": [...],
    (API キーなし ✓)
  }
```

#### 6.3 エラーハンドリングのテスト

意図的にエラーを発生させてエラーハンドリングを確認：

1. 環境変数を一時的に削除してデプロイ
2. "API key not configured" エラーが表示されることを確認
3. 環境変数を復元

### ステップ 7: 旧 config.js の削除（クリーンアップ）

セキュア版では `config.js` に API キーが含まれないため、古いファイルを削除できます。

**注意**: ローカル開発用に保持する場合は、API キーを削除してダミー値にしてください。

```bash
# ローカルの config.js を更新
echo "let API_KEY = null;" > config.js
```

### ステップ 8: チームへの通知

他の開発者に移行を通知します。

**通知内容のテンプレート**:
```
🔒 セキュリティアップデート

MICHIKUSA を安全なバックエンドプロキシアーキテクチャに移行しました。

【変更点】
- API キーはサーバー側でのみ管理
- フロントエンドには一切露出しない
- api-secure.js を使用

【必要な対応】
1. 最新コードを pull
2. ローカルで vercel dev でテスト
3. 問題があれば報告

詳細: MIGRATION.md
```

## トラブルシューティング

### 問題 1: "API key not configured" エラー

**症状**:
```
Server configuration error
API key not configured
```

**原因**: 環境変数 `ZHIPU_API_KEY` が設定されていない

**解決策**:
1. Vercel ダッシュボード → Settings → Environment Variables
2. `ZHIPU_API_KEY` を確認・追加
3. Redeploy

### 問題 2: 404 Not Found on `/api/chat`

**症状**:
```
POST /api/chat -> 404 Not Found
```

**原因**: `vercel.json` の設定が反映されていない

**解決策**:
1. `vercel.json` に `rewrites` セクションがあるか確認
2. `api/chat.js` ファイルが存在するか確認
3. Redeploy

### 問題 3: CORS エラー

**症状**:
```
Access to fetch at '/api/chat' from origin 'https://...' has been blocked by CORS policy
```

**原因**: CORS ヘッダーが正しく設定されていない

**解決策**:
1. `api/chat.js` の CORS ヘッダー設定を確認
2. `vercel.json` の headers セクションを確認
3. Redeploy

### 問題 4: 機能は動作するが API キーが見える

**症状**: レビューは生成されるが、DevTools で API キーが見える

**原因**: まだ旧バージョンの `api.js` を使用している

**解決策**:
1. `api-secure.js` を使用しているか確認
2. インポート文を更新
3. キャッシュをクリア
4. Redeploy

## ロールバック手順

何らかの理由で旧バージョンに戻す必要がある場合：

```bash
# vercel.json を元に戻す
git checkout HEAD~1 vercel.json

# デプロイ
git add vercel.json
git commit -m "Rollback to legacy architecture"
git push origin main
```

**⚠️ 警告**: ロールバックすると API キーが再び露出します。一時的な対応としてのみ使用してください。

## 移行チェックリスト

移行完了前に以下を確認：

- [ ] 環境変数 `ZHIPU_API_KEY` が設定されている
- [ ] `api/chat.js` が存在する
- [ ] `src/api-secure.js` が存在する
- [ ] `vercel.json` に API ルーティング設定がある
- [ ] ビルドコマンドが `build-secure.sh` になっている
- [ ] デプロイが成功している
- [ ] 基本機能が動作している
- [ ] DevTools で API キーが見えない
- [ ] エラーハンドリングが正常に動作
- [ ] チームに通知済み

## サポート

移行で問題が発生した場合：

1. [SECURITY.md](SECURITY.md) を確認
2. Issues で既存の問題を検索
3. 新しい Issue を作成（テンプレート使用）

---

**重要**: この移行により、API キーは完全にサーバー側で管理され、セキュリティが大幅に向上します。
