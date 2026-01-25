#!/bin/bash

# 都道府県別に静的ページを生成
# 使い方:
#   ./scripts/generate_by_prefecture.sh          # 全都道府県
#   ./scripts/generate_by_prefecture.sh 大阪府   # 特定の都道府県のみ

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# カラーコード
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== 静的ページ生成（都道府県別）===${NC}\n"

# 都道府県リスト
PREFECTURES=(
    "大阪府"
    "京都府"
    "兵庫県"
    "奈良県"
    "滋賀県"
)

# 引数がある場合はそれを使用
if [ $# -gt 0 ]; then
    PREFECTURES=("$@")
fi

# 開始時刻
START_TIME=$(date +%s)

# 各都道府県を処理
for PREF in "${PREFECTURES[@]}"; do
    echo -e "\n${YELLOW}📍 ${PREF} 生成中...${NC}"

    node scripts/generate_static_incremental.mjs "$PREF" all

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ ${PREF} 完了${NC}"
    else
        echo -e "${RED}✗ ${PREF} エラー${NC}"
    fi
done

# 終了時刻
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "\n${GREEN}=== 全て完了 ===${NC}"
echo "処理時間: ${DURATION}秒"
echo ""
echo "確認: npm run start:static"
