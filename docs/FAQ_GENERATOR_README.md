# URICO FAQ生成システム

外部サイトの情報を基にしたFAQページ生成システムの実装ドキュメント

## 概要

このシステムは、外部サイトからコンテンツを収集し、URICO向けのよくある質問（FAQ）ページを自動生成します。

## 実装内容

### 1. クローラスクリプト

#### フッターリンク抽出 (`scripts/crawl-ikura-footer-links.mjs`)
- 指定されたベースURLからHTMLを取得
- フッター領域のリンクを抽出・正規化
- 同一ドメインのリンクをクロール対象として識別
- 結果を `data/sources/ikura/links.json` に保存

#### ページ取得・本文抽出 (`scripts/crawl-ikura-pages.mjs`)
- リンク一覧からページを順次取得
- レート制限、リトライ、タイムアウトを実装
- 本文領域を抽出（`<main>`, `<article>`, または本文推定）
- ノイズ（ヘッダー、ナビ、フッター等）を除去
- 見出し構造とテキストを保存
- 結果を `data/sources/ikura/pages/*.json` に保存

### 2. FAQ生成スクリプト (`scripts/generate-urico-faq-from-ikura.mjs`)

#### 機能
- 各ページデータからFAQ項目を抽出
- URICO向けに再構成（一般論 + URICOの価値提案）
- カテゴリ別に整理：
  - **まずはここから**: 会社選び、査定、相場、準備
  - **こんなときどうする**: 住み替え、ローン、相続等
  - **基礎知識**: 媒介契約、費用・税金、流れ
  - **売却の流れ**: 全体の流れとスケジュール

#### 出力
- 構造化JSON: `data/faq/ikura_based_faq.json`
- 閲覧用HTML: `public/faq/ikura-based.html`

### 3. 生成されたFAQページ

#### 特徴
- レスポンシブデザイン
- モダンなUI（グラデーション、カード型レイアウト）
- 全12個のFAQ項目を4カテゴリに整理
- 各回答にURICOの独自価値を自然に組み込み

#### FAQ項目の例
- 不動産売却の流れ
- 査定の無料性と種類
- 媒介契約の選び方
- 費用・税金の詳細
- 住み替えのポイント

## 使用方法

### npmスクリプト

```bash
# ページデータ収集（サンプルデータ生成）
npm run crawl:ikura

# FAQ生成
npm run generate:faq

# または両方を順次実行
npm run crawl:ikura && npm run generate:faq
```

### 手動実行

```bash
# 1. フッターリンク抽出
node scripts/crawl-ikura-footer-links.mjs

# 2. ページ取得
node scripts/crawl-ikura-pages.mjs

# 3. FAQ生成
node scripts/generate-urico-faq-from-ikura.mjs
```

### ベースURLの変更

実際のサイトURLが異なる場合は、環境変数で指定可能：

```bash
BASE_URL=https://example.com node scripts/crawl-ikura-footer-links.mjs
```

または、スクリプト内の `BASE_URL` 定数を直接編集：

```javascript
const BASE_URL = 'https://your-actual-site.com/';
```

## ディレクトリ構造

```
urico-kansai/
├── scripts/
│   ├── crawl-ikura-footer-links.mjs    # フッターリンク抽出
│   ├── crawl-ikura-pages.mjs           # ページ取得・本文抽出
│   └── generate-urico-faq-from-ikura.mjs  # FAQ生成
├── data/
│   ├── sources/ikura/
│   │   ├── links.json                  # 抽出リンク一覧
│   │   └── pages/                      # 取得ページデータ
│   │       ├── guide_selling-flow.json
│   │       ├── guide_price-assessment.json
│   │       └── ...
│   └── faq/
│       └── ikura_based_faq.json        # 構造化FAQ
└── public/
    └── faq/
        └── ikura-based.html            # 公開FAQページ
```

## デプロイ情報

### 本番URL
- **FAQページ**: https://client-igrto2kfp-c21japans-projects.vercel.app/faq/ikura-based.html
- **プロジェクト**: Vercel (c21japans-projects/client)

### デプロイ方法

```bash
# 本番デプロイ
vercel --prod

# または特定のデプロイ
vercel --prod --yes
```

## 技術仕様

### 依存パッケージ
- **undici**: HTTPクライアント
- **cheerio**: HTMLパース・操作
- **p-limit**: 並列処理の制限

### 安全対策
- robots.txt の尊重（実装推奨）
- User-Agent の明示: "URICO Research Bot (for FAQ generation)"
- レート制限: 最大3並列、200-400msのジッター
- リトライ: 指数バックオフで最大3回
- タイムアウト: 10秒

### 文章生成ポリシー
- 原文の長文コピーは禁止
- 要約→再構成→URICO向けに改変
- すべてオリジナルの文章として生成
- URICOの価値提案を自然に組み込み（押し売りにならない）

## 今後の拡張案

### 1. 実サイトクロール対応
現在はサンプルデータを使用していますが、実際のサイトが利用可能になった場合：
- `scripts/crawl-ikura-pages.mjs` の実サイトクロール機能を有効化
- robots.txt パーサーを追加
- より詳細なエラーハンドリング

### 2. コンテンツの定期更新
- cron ジョブまたはGitHub Actionsで定期実行
- 差分検出により変更があった場合のみ再生成
- 自動コミット・デプロイ

### 3. FAQ項目の拡充
- より多くのページからFAQを抽出
- AIモデル（Claude API等）を使った高度な要約・再構成
- ユーザーフィードバックに基づく優先順位付け

### 4. 検索機能の追加
- FAQ内のキーワード検索
- カテゴリフィルター
- よく検索される質問のハイライト

### 5. アクセス解析
- どのFAQがよく読まれているかを追跡
- ユーザー行動に基づくコンテンツ改善
- Google Analyticsやヒートマップの統合

### 6. 多言語対応
- 英語・中国語等の多言語FAQ生成
- 機械翻訳APIとの連携

### 7. インタラクティブ機能
- FAQ項目の展開・折りたたみ
- 「この回答は役に立ちましたか？」フィードバック
- 関連FAQ項目の自動提案

## ライセンス・注意事項

- 外部サイトの許可を得た前提での実装
- コンテンツは要約・再構成されたオリジナル
- 商用利用時は著作権・利用規約を再確認すること

## お問い合わせ

FAQ生成システムに関する質問や改善提案は、プロジェクト管理者までご連絡ください。
