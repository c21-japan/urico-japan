#!/bin/bash

# Cloudflare R2 へのデータアップロードスクリプト
#
# 前提条件:
# 1. Wrangler CLI がインストールされている (npm install -g wrangler)
# 2. Cloudflare アカウントでログインしている (wrangler login)
# 3. R2 バケットが作成されている
#
# 使い方:
# 1. このスクリプトの BUCKET_NAME を実際のバケット名に変更
# 2. chmod +x scripts/upload_to_r2.sh
# 3. ./scripts/upload_to_r2.sh

# R2バケット名（実際のバケット名に変更してください）
BUCKET_NAME="urico-kansai-data"

# カラーコード
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Cloudflare R2 データアップロード ===${NC}\n"

# Wrangler のインストール確認
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}エラー: Wrangler CLI がインストールされていません${NC}"
    echo "インストール: npm install -g wrangler"
    exit 1
fi

# 戸建データのアップロード
echo -e "${BLUE}戸建データをアップロード中...${NC}"
if [ -d "data/house/area" ]; then
    echo "  - data/house/area/ → data/house/area/"
    wrangler r2 object put "${BUCKET_NAME}/data/house/area" --file=data/house/area --recursive
else
    echo -e "${RED}  警告: data/house/area/ が見つかりません${NC}"
fi

if [ -d "data/house/station" ]; then
    echo "  - data/house/station/ → data/house/station/"
    wrangler r2 object put "${BUCKET_NAME}/data/house/station" --file=data/house/station --recursive
else
    echo -e "${RED}  警告: data/house/station/ が見つかりません${NC}"
fi

# 土地データのアップロード
echo -e "\n${BLUE}土地データをアップロード中...${NC}"
if [ -d "data/land/area" ]; then
    echo "  - data/land/area/ → data/land/area/"
    wrangler r2 object put "${BUCKET_NAME}/data/land/area" --file=data/land/area --recursive
else
    echo -e "${RED}  警告: data/land/area/ が見つかりません${NC}"
fi

if [ -d "data/land/station" ]; then
    echo "  - data/land/station/ → data/land/station/"
    wrangler r2 object put "${BUCKET_NAME}/data/land/station" --file=data/land/station --recursive
else
    echo -e "${RED}  警告: data/land/station/ が見つかりません${NC}"
fi

echo -e "\n${GREEN}=== アップロード完了 ===${NC}"
echo -e "\n次のステップ:"
echo "1. Cloudflare ダッシュボードで R2 バケットのパブリックアクセスを有効化"
echo "2. カスタムドメインまたは R2.dev サブドメインを設定"
echo "3. main.js の R2 URL を実際のドメインに更新"
echo ""
echo "例: https://pub-xxxxx.r2.dev/data/house/area/..."
