# マンション購入希望者情報のブラッシュアップ

part1.js〜part5.jsの購入希望者情報（特に「reason」フィールド）を改善するためのプロンプトとスクリプトです。

## 改善内容

現在の購入理由は以下のようなパターン化された文章になっています：
- 「○○は通勤に便利な立地で、家族で広々と暮らせる間取りが魅力的でした...」
- 「○○の周辺環境と利便性に惹かれました...」

これらを以下のように改善します：
- 物件名を繰り返さない
- 各購入希望者の属性（職業、家族構成、年齢など）に合わせた自然な理由
- より具体的でリアルな購入動機
- パターン化を避け、多様性を持たせる

## 使用方法

### 方法1: Claude CLIを使用（推奨）

#### 1. プロンプトファイルを確認
`prompts/brushup_mansion_buyers_claude.txt` にプロンプトが用意されています。

#### 2. 各partファイルを処理

```bash
# part1.jsを処理
claude --file data/mansion/part1.js --prompt prompts/brushup_mansion_buyers_claude.txt > data/mansion/part1_brushup.js

# part2.jsを処理
claude --file data/mansion/part2.js --prompt prompts/brushup_mansion_buyers_claude.txt > data/mansion/part2_brushup.js

# part3.jsを処理
claude --file data/mansion/part3.js --prompt prompts/brushup_mansion_buyers_claude.txt > data/mansion/part3_brushup.js

# part4.jsを処理
claude --file data/mansion/part4.js --prompt prompts/brushup_mansion_buyers_claude.txt > data/mansion/part4_brushup.js

# part5.jsを処理
claude --file data/mansion/part5.js --prompt prompts/brushup_mansion_buyers_claude.txt > data/mansion/part5_brushup.js
```

#### 3. 出力を確認して上書き

```bash
# 出力ファイルを確認
head -50 data/mansion/part1_brushup.js

# 問題なければ上書き
mv data/mansion/part1_brushup.js data/mansion/part1.js
mv data/mansion/part2_brushup.js data/mansion/part2.js
mv data/mansion/part3_brushup.js data/mansion/part3.js
mv data/mansion/part4_brushup.js data/mansion/part4.js
mv data/mansion/part5_brushup.js data/mansion/part5.js
```

### 方法2: スクリプトを使用

```bash
# スクリプトを実行（Claude CLIが必要）
./scripts/brushup_mansion_buyers.sh
```

### 方法3: 手動でプロンプトを使用

1. `prompts/brushup_mansion_buyers_claude.txt` の内容をコピー
2. 各partファイルの内容をプロンプトの最後に追加
3. Claude APIまたはClaude CLIで実行
4. 出力されたコードを元のファイルに上書き

## 改善例

### 改善前
```javascript
{
  "method": "キャッシュ（一部住宅ローン）",
  "occupation": "パートアルバイト",
  "reason": "BELISTA千里山は通勤に便利な立地で、家族で広々と暮らせる間取りが魅力的でした。子育て環境も良く、長く住める物件だと感じています。",
  "timing": "即時",
  "ng": "騒音",
  "family": "ご夫婦",
  "age": "購入者：30代前半　居住者：50代後半"
}
```

### 改善後
```javascript
{
  "method": "キャッシュ（一部住宅ローン）",
  "occupation": "パートアルバイト",
  "reason": "結婚を機に新居を探していました。駅から近く、近隣に保育園やスーパーもあり、子育てを考えた時に最適な環境だと思い購入を決めました。",
  "timing": "即時",
  "ng": "騒音",
  "family": "ご夫婦",
  "age": "購入者：30代前半　居住者：50代後半"
}
```

## 注意事項

- 各partファイルは約53,000行と大きいため、処理に時間がかかる場合があります
- Claude CLIのAPI制限に注意してください
- 出力ファイルを必ず確認してから元のファイルを上書きしてください
- 他のフィールド（method, occupation, timing, ng, family, age）は変更されません

## トラブルシューティング

### Claude CLIがインストールされていない場合

```bash
npm install -g @anthropic-ai/claude
```

### ファイルが大きすぎてエラーになる場合

ファイルを分割して処理するか、Claude APIの制限を確認してください。

### 出力が正しくない場合

プロンプトファイルを確認し、必要に応じて調整してください。
