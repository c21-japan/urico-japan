# Cloudflare R2 セットアップガイド

このガイドでは、戸建・土地データ（計約945MB）をCloudflare R2にアップロードして、高速で安定したデータ配信を実現する手順を説明します。

## 🎯 目的

- **問題**: 60万件のデータ（945MB）をブラウザで一度に読み込むと、ページが重くなりクラッシュする
- **解決策**: Cloudflare R2から必要なデータだけを動的に取得することで、初期ロードを100倍以上高速化

## 📊 データ構成

```
data/
├── house/
│   ├── area/      # 戸建エリア別データ（府県/市区町村/町名.json）
│   └── station/   # 戸建駅別データ（路線会社/沿線/駅名.json）
└── land/
    ├── area/      # 土地エリア別データ（府県/市区町村/町名.json）
    └── station/   # 土地駅別データ（路線会社/沿線/駅名.json）

合計サイズ: 約945MB（house: 489MB, land: 456MB）
合計件数: 約117万件（house: 586,633件, land: 589,655件）
```

## 🚀 セットアップ手順

### 1. Cloudflare R2 バケットの作成

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログイン
2. **R2** → **Create bucket** をクリック
3. バケット名を入力（例: `urico-kansai-data`）
4. リージョンを選択（推奨: `apac` - アジア太平洋地域）
5. **Create bucket** をクリック

### 2. R2 API トークンの取得

1. Cloudflare ダッシュボード → **R2** → **Manage R2 API Tokens**
2. **Create API Token** をクリック
3. 権限: `Object Read & Write` を選択
4. **Create API Token** をクリック
5. **Access Key ID** と **Secret Access Key** をメモ（後で使用）

### 3. rclone のインストールと設定

#### インストール

```bash
# macOS
brew install rclone

# Linux
curl https://rclone.org/install.sh | sudo bash

# Windows
# https://rclone.org/downloads/ からダウンロード
```

#### rclone の設定

```bash
rclone config
```

以下の手順で設定：

```
n) New remote
name> r2
Storage> s3
Provider> Cloudflare
env_auth> false
access_key_id> [ステップ2で取得したAccess Key ID]
secret_access_key> [ステップ2で取得したSecret Access Key]
region> auto
endpoint> https://[あなたのアカウントID].r2.cloudflarestorage.com
location_constraint> (空欄のままEnter)
acl> (空欄のままEnter)
...
y) Yes this is OK
q) Quit config
```

**アカウントIDの確認方法:**
- Cloudflare ダッシュボード → **R2** → **Overview**
- 右側に表示される Account ID をコピー

### 4. データのアップロード

```bash
cd /Users/milk/urico-kansai
./scripts/upload_to_r2_rclone.sh
```

アップロードには約10〜30分かかります（回線速度による）。

### 5. パブリックアクセスの有効化

1. Cloudflare ダッシュボード → **R2** → バケット名をクリック
2. **Settings** タブ → **Public Access**
3. **Allow Access** をクリック
4. **R2.dev subdomain** が自動生成される
   - 例: `https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev`
5. この URL をメモ

### 6. main.js の URL 確認

`main.js` の以下の箇所で、R2 URL が正しく設定されているか確認：

```javascript
// 行828付近
const jsonPath = `https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev/data/${type}/area/...`;

// 行890付近
const jsonPath = `https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev/data/${type}/station/...`;
```

**既に設定済みの場合**: そのまま使用（新しいバケットの場合は URL を置き換える）

### 7. 動作確認

#### コマンドラインでテスト

```bash
# 戸建データのテスト
curl https://pub-xxxxx.r2.dev/data/house/area/大阪府/大阪市北区.json | jq '.[0]'

# 土地データのテスト
curl https://pub-xxxxx.r2.dev/data/land/station/JR西日本/東海道本線/大阪駅.json | jq 'length'
```

#### ブラウザでテスト

1. ローカルサーバーを起動: `npm start`
2. ブラウザで `http://localhost:3000` を開く
3. 戸建タブまたは土地タブで検索を実行
4. 開発者ツール（F12）→ Network タブで、R2 からのデータ取得を確認

## ✅ 実装済みの最適化

以下の最適化が既に実装されています：

### 1. 不要なインポートの削除

```javascript
// 修正前（945MBをダウンロード）
import { HOUSE_DB } from './house_db.js';  // 489MB
import { LAND_DB } from './land_db.js';    // 456MB

// 修正後（マンションのみインポート）
import { MANSION_DB } from './mansion_db.js';
// HOUSE_DB と LAND_DB は Cloudflare R2 から動的に読み込む
```

### 2. 空配列での初期化

```javascript
// houseDatabase と landDatabase は空配列で初期化
houseDatabase = [];
landDatabase = [];
```

### 3. 統計数値の更新

```javascript
// R2に格納されている全データ件数を表示
totalBuyers = 586633; // house
totalBuyers = 589655; // land
```

### 4. 動的データ取得

検索時にのみ必要なデータを R2 から取得：

```javascript
// エリア検索
const jsonPath = `https://pub-xxxxx.r2.dev/data/house/area/${pref}/${city}.json`;
const buyers = await fetch(jsonPath).then(r => r.json());

// 駅検索
const jsonPath = `https://pub-xxxxx.r2.dev/data/house/station/${company}/${line}/${station}.json`;
const buyers = await fetch(jsonPath).then(r => r.json());
```

## 📈 パフォーマンス改善効果

| 項目 | 修正前 | 修正後 | 改善率 |
|------|--------|--------|--------|
| 初期ロードサイズ | 945MB | ~5MB | **99%削減** |
| 初回表示時間 | 60〜180秒<br>（またはクラッシュ） | 2〜3秒 | **95%改善** |
| メモリ使用量 | 117万件 | 数十〜数百件 | **99%削減** |
| 検索時データ取得 | 0秒<br>（全て読み込み済み） | 0.5〜1秒<br>（必要な分だけ取得） | 若干増加するが許容範囲 |

## 🔧 トラブルシューティング

### データが取得できない

**症状**: ブラウザコンソールに `Failed to fetch` エラー

**原因**:
1. R2 バケットのパブリックアクセスが有効化されていない
2. R2 URL が間違っている
3. データがアップロードされていない

**解決策**:
```bash
# 1. パブリックアクセスを確認
# Cloudflare ダッシュボード → R2 → Settings → Public Access

# 2. R2 にデータが存在するか確認
rclone ls r2:urico-kansai-data/data/house/area | head

# 3. ブラウザで直接 URL を開いて確認
# https://pub-xxxxx.r2.dev/data/house/area/大阪府/大阪市北区.json
```

### CORS エラー

**症状**: ブラウザコンソールに CORS エラー

**解決策**:
Cloudflare ダッシュボード → R2 → バケット設定 → CORS ポリシーを追加：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### アップロードが遅い

**原因**: 回線速度の制限

**解決策**:
```bash
# 並列アップロード数を増やす（スクリプト内で調整）
--transfers 16  # デフォルト: 8
--s3-upload-concurrency 16  # デフォルト: 8
```

## 💰 コスト

Cloudflare R2 の料金（2025年1月時点）:

- **ストレージ**: $0.015/GB/月
  - 945MB = 約 $0.014/月（約2円/月）
- **Class A 操作** (アップロード): $4.50/百万リクエスト
  - 初回アップロード: 約40,000ファイル = 約 $0.18（約27円）
- **Class B 操作** (ダウンロード): $0.36/百万リクエスト
  - 月10,000検索 = 約 $0.004/月（約0.6円/月）
- **データ転送**: 無料（Cloudflare の CDN 経由）

**月額コスト概算**: 約 $0.02/月（約3円/月）

## 📚 参考リンク

- [Cloudflare R2 公式ドキュメント](https://developers.cloudflare.com/r2/)
- [rclone 公式サイト](https://rclone.org/)
- [Cloudflare R2 料金](https://developers.cloudflare.com/r2/pricing/)
