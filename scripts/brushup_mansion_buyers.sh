#!/bin/bash

# マンション購入希望者情報のブラッシュアップ用スクリプト
# Claude CLIを使用して各partファイルを処理します

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROMPT_FILE="$PROJECT_DIR/prompts/brushup_mansion_buyers_claude.txt"

cd "$PROJECT_DIR"

# Claude CLIがインストールされているか確認
if ! command -v claude &> /dev/null; then
    echo "エラー: Claude CLIがインストールされていません"
    echo "インストール方法: npm install -g @anthropic-ai/claude"
    exit 1
fi

# プロンプトファイルの存在確認
if [ ! -f "$PROMPT_FILE" ]; then
    echo "エラー: プロンプトファイルが見つかりません: $PROMPT_FILE"
    exit 1
fi

echo "マンション購入希望者情報のブラッシュアップを開始します..."
echo ""

# 各partファイルを処理
for part_num in 1 2 3 4 5; do
    INPUT_FILE="data/mansion/part${part_num}.js"
    OUTPUT_FILE="data/mansion/part${part_num}_brushup.js"
    
    if [ ! -f "$INPUT_FILE" ]; then
        echo "警告: $INPUT_FILE が見つかりません。スキップします。"
        continue
    fi
    
    echo "処理中: $INPUT_FILE -> $OUTPUT_FILE"
    
    # Claude CLIで処理
    # 注意: Claude CLIの実際のコマンド形式に合わせて調整が必要な場合があります
    claude --file "$INPUT_FILE" --prompt "$PROMPT_FILE" > "$OUTPUT_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✓ 完了: $OUTPUT_FILE"
    else
        echo "✗ エラー: $INPUT_FILE の処理に失敗しました"
    fi
    echo ""
done

echo "すべての処理が完了しました。"
echo ""
echo "確認後、以下のコマンドで元のファイルを上書きできます："
echo "  mv data/mansion/part1_brushup.js data/mansion/part1.js"
echo "  mv data/mansion/part2_brushup.js data/mansion/part2.js"
echo "  mv data/mansion/part3_brushup.js data/mansion/part3.js"
echo "  mv data/mansion/part4_brushup.js data/mansion/part4.js"
echo "  mv data/mansion/part5_brushup.js data/mansion/part5.js"
