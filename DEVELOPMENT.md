# 🌿 MICHIKUSA — 道草グルメ評論 AI

> 道端に佇む、名もなき野草たち。その真価を、今こそ問う。

野草・雑草の写真を撮るだけで、**AI が本格グルメ評論を生成する**エンタメアプリ。
ミシュランガイド風の星評価、ソムリエ風テイスティングノート、ありえない調理法提案まで、終始真剣なトーンで評価します。

> ⚠️ **このアプリは純粋なエンタメです。実際に野草を食べないでください。**

---

## 🎯 機能

- **カメラ撮影 / 画像アップロード** — スマホ・PC 両対応
- **AI 植物認識** — TensorFlow.js MobileNet v2 で植物かどうかを判定（鉢植え・非植物は審査拒否）
- **ML 画像解析スコアリング** — CIELab 色空間 + k-means++ クラスタリング + Sobel エッジ検出による 5 軸スコア算出
  - 外見の気品 / シェフ熱望度 / 珍味感 / 道端感 / 食後の後悔予想（警戒色検出付き）
- **AI グルメレビュー生成** — GLM-4.6V-Flash（ビジョンモデル）が画像を直接見て評価
- **多視点審査モード** — 3 人の専門家が視点を変えて評価
  - Pierre Dubois（パリ三つ星料理長）— フランス語 + 日本語訳
  - 山田宗次郎（江戸天保年間の食通）— 候文・江戸言葉
  - 李 文徳（東洋医学薬草研究家）— 文言漢文 + 日本語訳
- **シェア機能** — 評価結果をクリップボードコピー or ネイティブシェア
- **モジュラーアーキテクチャ** — テスト可能で保守しやすいコード構造
- **包括的なテストスイート** — 単体テストとテストランナー付き

---

## 🏗️ アーキテクチャ

### プロジェクト構造

```
eating-michikusa/
├── index.html          # メイン HTML
├── style.css           # スタイル
├── app.js              # メインアプリケーションロジック
├── src/                # モジュール化されたコード
│   ├── constants.js    # 定数と設定
│   ├── utils.js        # ユーティリティ関数
│   ├── plantDetection.js # AI植物検出
│   ├── imageAnalysis.js  # 画像解析とスコアリング
│   ├── api.js          # Zhipu AI API統合
│   └── ui.js           # UI/DOM操作
├── test/               # テストスイート
│   ├── testFramework.js  # テストフレームワーク
│   ├── testRunner.js     # テストランナー
│   ├── utils.test.js     # ユーティリティのテスト
│   ├── imageAnalysis.test.js # 画像解析のテスト
│   └── api.test.js       # APIのテスト
├── test.html           # テストランナーUI
├── config.example.js   # API キー設定テンプレート
├── config.js           # API キー（.gitignore 対象・要自分で作成）
├── build.sh            # Vercel ビルドスクリプト
├── vercel.json         # Vercel デプロイ設定
└── README.md
```

### 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | HTML / CSS / Vanilla JS（バンドラー不要） |
| モジュールシステム | ES6 Modules |
| 植物認識 | TensorFlow.js + MobileNet v2 (CDN) |
| 画像解析 | Canvas API、CIELab 変換、k-means++、Sobel フィルタ |
| テキスト生成 | Zhipu AI GLM-4.6V-Flash（ビジョン）/ GLM-4.7-Flash（テキスト） |
| テスト | カスタムテストフレームワーク |
| デプロイ | 静的ファイルのみ（サーバー不要） |

### コード品質の特徴

✅ **モジュラーアーキテクチャ** - 関心の分離と再利用性
✅ **包括的なJSDoc** - すべての関数に完全なドキュメント
✅ **ユニットテスト** - 主要モジュールのテストカバレッジ
✅ **型安全性** - JSDocによる型ヒント
✅ **エラーハンドリング** - 堅牢なエラー処理
✅ **パフォーマンス最適化** - k-means++、効率的なアルゴリズム

---

## 🚀 セットアップ

### クイックスタート: Vercel にデプロイ（推奨）

最も簡単な方法は Vercel にデプロイすることです。環境変数で API キーを安全に管理できます。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ganondorofu/eating-michikusa)

1. 上のボタンをクリックして Vercel にデプロイ
2. デプロイ後、Vercel ダッシュボードで **Settings** → **Environment Variables** に移動
3. 以下の環境変数を追加:
   - **Name**: `ZHIPU_API_KEY`
   - **Value**: あなたの Zhipu AI API キー（[ここから取得](https://open.bigmodel.cn/usercenter/apikeys)）
4. **Deployments** タブから最新のデプロイを **Redeploy** して環境変数を反映

これで API キーが安全に設定され、誰にも見られることなく動作します 🎉

---

### ローカル開発セットアップ

#### 1. リポジトリをクローン

```bash
git clone https://github.com/ganondorofu/eating-michikusa.git
cd eating-michikusa
```

#### 2. API キーを設定

API キーは [Zhipu AI コンソール](https://open.bigmodel.cn/usercenter/apikeys) から取得できます（無料枠あり）。

設定方法は4つあります（優先順位順）:

##### 方法 A: config.js ファイル（ローカル開発推奨）

```bash
cp config.example.js config.js
```

`config.js` を開き、Zhipu AI の API キーを設定してください。

```js
let API_KEY = "your-zhipu-ai-api-key-here";
```

##### 方法 B: 環境変数（Vercel デプロイ時）

Vercel にデプロイする場合、環境変数 `ZHIPU_API_KEY` を設定すると、ビルド時に自動的に `config.js` が生成されます。

##### 方法 C: URL パラメータ

URL に直接 API キーを指定できます（開発・テスト用）:

```
http://localhost:8080/?api_key=your-zhipu-ai-api-key-here
```

⚠️ **注意**: URL パラメータはブラウザ履歴に残ります。本番環境では環境変数または config.js を使用してください。

##### 方法 D: localStorage（ブラウザ保存）

ブラウザの開発者コンソールで以下を実行:

```js
localStorage.setItem('MICHIKUSA_API_KEY', 'your-zhipu-ai-api-key-here');
```

#### 3. 起動

**方法 A: ファイルをブラウザで直接開く**（最も簡単）

```
index.html をブラウザにドラッグ＆ドロップ
```

**方法 B: ローカルサーバーで起動**（推奨 — カメラ API が使いやすい）

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .

# どちらも http://localhost:8080 でアクセス
```

**方法 C: スマホからアクセス**（同一 LAN 内）

```bash
python3 -m http.server 8080
# スマホから http://<PCのIPアドレス>:8080 にアクセス
```

---

## 🧪 テストの実行

### ブラウザでテストを実行

```bash
# ローカルサーバーを起動
python3 -m http.server 8080

# ブラウザで開く
open http://localhost:8080/test.html
```

テストは自動的に実行され、結果が表示されます。

### テストモジュール

- **testFramework.js** - シンプルなテストフレームワーク（describe, it, expect）
- **utils.test.js** - ユーティリティ関数のテスト
- **imageAnalysis.test.js** - 画像解析アルゴリズムのテスト
- **api.test.js** - API統合とプロンプト生成のテスト

### テストの追加

新しいテストを追加するには:

1. `test/` ディレクトリに `yourModule.test.js` を作成
2. テストをインポート: `import { describe, it, expect } from './testFramework.js'`
3. テストを記述
4. `test/testRunner.js` でインポート

---

## 📖 使い方

1. 「道草を選ぶ」または「カメラで撮る」で野草の画像を用意
2. AI が植物かどうかを自動判定（鉢植えや非植物は審査拒否）
3. CIELab + k-means++ で 5 軸スコアを算出
4. 「道草を食わせる」で単体レビュー / 「多視点審査」で 3 専門家による評価
5. 結果をシェア

---

## 🔬 技術詳細

### 画像解析アルゴリズム

1. **RGB → CIELab 変換**
   - 知覚的に均一な色空間で解析
   - D65白色点を使用

2. **k-means++ クラスタリング**
   - 4クラスタで色領域を分割
   - Lab a*軸（緑-赤）で植物クラスタを同定

3. **植物マスク生成**
   - a* < -2 のクラスタを植物領域として抽出

4. **統計量計算**
   - Chroma（彩度）、Hue entropy、Luma entropy
   - 警戒色検出（赤・橙・紫系高彩度色）

5. **Sobelエッジ検出**
   - テクスチャ・ざらつきの定量化

### スコアリングロジック

- **外見の気品** (elegance): 平均Chroma / 35 × 5
- **シェフ熱望度** (chefDesire): 緑度 × 0.65 + 彩度均一性 × 0.35
- **珍味感** (rarity): Hue entropy（正規化）× 5.5
- **道端感** (roadside): 植物被覆率^0.6 × 0.7 + Luma entropy × 0.3
- **食後の後悔予想** (regret): 暗部率 × 0.15 + 不審色率 × 0.2 + エッジ密度 × 0.15 + 警戒色率 × 0.5

### AI モデル

- **植物認識**: TensorFlow.js MobileNet v2 (alpha=0.5, ~5MB)
- **テキスト生成**: Zhipu AI GLM-4.6V-Flash (Vision) / GLM-4.7-Flash (Text)
- **多視点審査**: 3つの異なるペルソナプロンプト

---

## 🤝 コントリビューション

コントリビューションを歓迎します！

### 開発ワークフロー

1. このリポジトリをフォーク
2. フィーチャーブランチを作成: `git checkout -b feature/amazing-feature`
3. 変更をコミット: `git commit -m 'Add amazing feature'`
4. ブランチをプッシュ: `git push origin feature/amazing-feature`
5. プルリクエストを作成

### コード品質

- すべての関数にJSDocを追加
- 新機能には単体テストを追加
- モジュラーな設計を維持
- ESLintルール（将来追加予定）に従う

---

## ⚠️ 注意事項

- 実際の野草・山菜の採取・摂取は専門家の指導のもとで行ってください
- API キー（`config.js`）は絶対にコミットしないでください
- GLM-4.6V-Flash は無料枠に流量制限があります。混雑時は自動リトライします
- このアプリは教育・エンタメ目的です。実際に野草を食べないでください

---

## 📄 ライセンス

[MIT License](LICENSE)

---

## 🙏 謝辞

- TensorFlow.js チーム - MobileNet v2
- Zhipu AI - GLM ビジョン・テキストモデル
- すべてのコントリビューター

---

**Made with 🌿 by the MICHIKUSA team**
