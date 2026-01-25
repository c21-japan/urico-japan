#!/bin/bash
# 各 area_registered_*.csv から町名が「以下に掲載がない場合」の行を削除する。
# 使い方: ./scripts/remove_ikani_keisai_from_area_csv.sh

set -e
DATA_DIR="$(dirname "$0")/../data"
for f in "$DATA_DIR"/area_registered_*.csv; do
  [ -f "$f" ] || continue
  awk -F'\t' 'NR==1 || $3 != "以下に掲載がない場合"' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  echo "✅ $(basename "$f")"
done
