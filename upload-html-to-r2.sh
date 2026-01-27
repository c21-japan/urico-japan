#!/bin/bash

# ====================================================================
# 戸建・土地のHTMLファイルをR2にアップロード（wrangler使用）
# ====================================================================

set -e

BUCKET_NAME="urico-buyers-data"

echo "========================================="
echo "戸建・土地HTMLファイルをR2にアップロード"
echo "========================================="
echo ""
echo "バケット: $BUCKET_NAME"
echo ""

# 戸建HTMLファイルをカウント
house_files=$(find "./public/house" -type f -name "*.html" | wc -l | tr -d ' ')
echo "戸建HTMLファイル: $house_files 件"

# 土地HTMLファイルをカウント
land_files=$(find "./public/land" -type f -name "*.html" | wc -l | tr -d ' ')
echo "土地HTMLファイル: $land_files 件"

total_files=$((house_files + land_files))
echo "合計: $total_files 件"
echo ""

read -p "アップロードを開始しますか？ (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "キャンセルしました。"
    exit 0
fi

echo ""
echo "アップロード開始..."
echo ""

count=0
failed=0

# 戸建HTMLファイルをアップロード
echo "【戸建HTMLファイル】"
find "./public/house" -type f -name "*.html" | while IFS= read -r file; do
    # 相対パスを取得（public/ を除く）
    relative_path="${file#./public/}"
    remote_path="$relative_path"

    # アップロード
    if npx wrangler r2 object put "$BUCKET_NAME/$remote_path" \
        --file="$file" \
        --content-type="text/html; charset=utf-8" 2>/dev/null; then
        count=$((count + 1))
        if [ $((count % 100)) -eq 0 ]; then
            echo "  ✅ $count / $total_files ファイルアップロード完了"
        fi
    else
        failed=$((failed + 1))
        echo "  ❌ 失敗: $remote_path"
    fi
done

echo ""

# 土地HTMLファイルをアップロード
echo "【土地HTMLファイル】"
find "./public/land" -type f -name "*.html" | while IFS= read -r file; do
    # 相対パスを取得（public/ を除く）
    relative_path="${file#./public/}"
    remote_path="$relative_path"

    # アップロード
    if npx wrangler r2 object put "$BUCKET_NAME/$remote_path" \
        --file="$file" \
        --content-type="text/html; charset=utf-8" 2>/dev/null; then
        count=$((count + 1))
        if [ $((count % 100)) -eq 0 ]; then
            echo "  ✅ $count / $total_files ファイルアップロード完了"
        fi
    else
        failed=$((failed + 1))
        echo "  ❌ 失敗: $remote_path"
    fi
done

echo ""
echo "========================================="
echo "✅ アップロード完了"
echo "========================================="
echo ""
echo "成功: $count ファイル"
if [ $failed -gt 0 ]; then
    echo "失敗: $failed ファイル"
fi
echo ""
echo "R2 Public URL:"
echo "https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev"
echo ""
echo "動作確認:"
echo "curl -I https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev/house/滋賀県/豊郷町.html"
echo ""
