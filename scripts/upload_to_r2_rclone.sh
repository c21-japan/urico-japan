#!/bin/bash

# Cloudflare R2 へのデータアップロードスクリプト (rclone版)
#
# 前提条件:
# 1. rclone がインストールされている (https://rclone.org/install/)
# 2. rclone で Cloudflare R2 の設定が完了している
#
# rclone の設定方法:
#   rclone config
#   - n) New remote
#   - name: r2
#   - Storage: s3
#   - Provider: Cloudflare
#   - Access Key ID: (Cloudflareから取得)
#   - Secret Access Key: (Cloudflareから取得)
#   - Endpoint: https://<account_id>.r2.cloudflarestorage.com
#
# 使い方:
# 1. rclone の設定を完了する
# 2. このスクリプトの REMOTE_NAME と BUCKET_NAME を確認
# 3. chmod +x scripts/upload_to_r2_rclone.sh
# 4. ./scripts/upload_to_r2_rclone.sh

# rclone リモート名（rclone config で設定した名前）
REMOTE_NAME="r2"

# R2バケット名
BUCKET_NAME="urico-kansai-data"

# カラーコード
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Cloudflare R2 データアップロード (rclone) ===${NC}\n"

# rclone のインストール確認
if ! command -v rclone &> /dev/null; then
    echo -e "${RED}エラー: rclone がインストールされていません${NC}"
    echo "インストール:"
    echo "  macOS: brew install rclone"
    echo "  Linux: curl https://rclone.org/install.sh | sudo bash"
    exit 1
fi

# リモート設定の確認
if ! rclone listremotes | grep -q "^${REMOTE_NAME}:$"; then
    echo -e "${RED}エラー: rclone リモート '${REMOTE_NAME}' が設定されていません${NC}"
    echo "設定方法: rclone config"
    exit 1
fi

# アップロード対象のディレクトリ確認
if [ ! -d "data/house/area" ] && [ ! -d "data/land/area" ]; then
    echo -e "${RED}エラー: data/house/area/ または data/land/area/ が見つかりません${NC}"
    exit 1
fi

# アップロード確認
echo -e "${YELLOW}以下のデータを ${REMOTE_NAME}:${BUCKET_NAME} にアップロードします:${NC}"
echo "  - data/house/area/ (約489MB)"
echo "  - data/house/station/"
echo "  - data/land/area/ (約456MB)"
echo "  - data/land/station/"
echo ""
read -p "続行しますか? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "キャンセルしました"
    exit 0
fi

# 戸建データのアップロード
echo -e "\n${BLUE}戸建データをアップロード中...${NC}"
if [ -d "data/house/area" ]; then
    echo "  📁 data/house/area/ → ${REMOTE_NAME}:${BUCKET_NAME}/data/house/area/"
    rclone sync data/house/area "${REMOTE_NAME}:${BUCKET_NAME}/data/house/area" \
        --progress \
        --transfers 8 \
        --checkers 16 \
        --fast-list \
        --s3-upload-concurrency 8
    echo -e "${GREEN}  ✓ 完了${NC}"
else
    echo -e "${RED}  ⚠ data/house/area/ が見つかりません${NC}"
fi

if [ -d "data/house/station" ]; then
    echo "  📁 data/house/station/ → ${REMOTE_NAME}:${BUCKET_NAME}/data/house/station/"
    rclone sync data/house/station "${REMOTE_NAME}:${BUCKET_NAME}/data/house/station" \
        --progress \
        --transfers 8 \
        --checkers 16 \
        --fast-list \
        --s3-upload-concurrency 8
    echo -e "${GREEN}  ✓ 完了${NC}"
else
    echo -e "${RED}  ⚠ data/house/station/ が見つかりません${NC}"
fi

# 土地データのアップロード
echo -e "\n${BLUE}土地データをアップロード中...${NC}"
if [ -d "data/land/area" ]; then
    echo "  📁 data/land/area/ → ${REMOTE_NAME}:${BUCKET_NAME}/data/land/area/"
    rclone sync data/land/area "${REMOTE_NAME}:${BUCKET_NAME}/data/land/area" \
        --progress \
        --transfers 8 \
        --checkers 16 \
        --fast-list \
        --s3-upload-concurrency 8
    echo -e "${GREEN}  ✓ 完了${NC}"
else
    echo -e "${RED}  ⚠ data/land/area/ が見つかりません${NC}"
fi

if [ -d "data/land/station" ]; then
    echo "  📁 data/land/station/ → ${REMOTE_NAME}:${BUCKET_NAME}/data/land/station/"
    rclone sync data/land/station "${REMOTE_NAME}:${BUCKET_NAME}/data/land/station" \
        --progress \
        --transfers 8 \
        --checkers 16 \
        --fast-list \
        --s3-upload-concurrency 8
    echo -e "${GREEN}  ✓ 完了${NC}"
else
    echo -e "${RED}  ⚠ data/land/station/ が見つかりません${NC}"
fi

# アップロード統計
echo -e "\n${GREEN}=== アップロード完了 ===${NC}\n"
echo "アップロードされたファイル数:"
rclone size "${REMOTE_NAME}:${BUCKET_NAME}/data/house" 2>/dev/null || echo "  戸建: データなし"
rclone size "${REMOTE_NAME}:${BUCKET_NAME}/data/land" 2>/dev/null || echo "  土地: データなし"

echo -e "\n${YELLOW}次のステップ:${NC}"
echo "1. Cloudflare ダッシュボードで R2 バケットのパブリックアクセスを有効化"
echo "   https://dash.cloudflare.com/ → R2 → ${BUCKET_NAME} → Settings → Public Access"
echo ""
echo "2. R2.dev サブドメインまたはカスタムドメインを設定"
echo "   例: https://pub-xxxxx.r2.dev"
echo ""
echo "3. main.js の R2 URL を確認（既に設定済みの場合はスキップ）"
echo "   現在の設定: https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev"
echo ""
echo "4. テスト:"
echo "   curl https://pub-xxxxx.r2.dev/data/house/area/大阪府/大阪市.json"
