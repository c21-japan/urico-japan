# マンション購入希望者情報のブラッシュアップ用プロンプト

## 使用方法
各partファイル（part1.js〜part5.js）に対して、このプロンプトを使用してClaude CLIで処理してください。

## プロンプト（part1.js用）

```
以下のJavaScriptファイル内の購入希望者情報（buyers配列内の各オブジェクト）の「reason」フィールドを、より自然で多様で具体的な購入理由に改善してください。

【改善のポイント】
1. 物件名を繰り返さない（「○○は...」という形式を避ける）
2. 各購入希望者の属性（職業、家族構成、年齢、購入方法、購入時期）に合わせた自然な理由にする
3. より具体的でリアルな購入動機を表現する
4. パターン化された文章を避け、多様性を持たせる
5. 30〜100文字程度の自然な文章にする

【改善例】
改善前：
"BELISTA千里山は通勤に便利な立地で、家族で広々と暮らせる間取りが魅力的でした。子育て環境も良く、長く住める物件だと感じています。"

改善後（30代前半、ご夫婦、パートアルバイト、キャッシュ（一部住宅ローン）、即時の場合）：
"結婚を機に新居を探していました。駅から近く、近隣に保育園やスーパーもあり、子育てを考えた時に最適な環境だと思い購入を決めました。"

改善後（40代前半、ご夫婦、会社員（一般職）、未定、即時の場合）：
"転勤でこのエリアに来ることになり、通勤アクセスの良さと周辺の生活利便性を重視して選びました。2LDK以上の広さも希望通りです。"

【出力形式】
- 既存のJavaScriptコードの構造を完全に保持してください
- 「reason」フィールドのみを改善してください
- 他のフィールド（method, occupation, timing, ng, family, age）は一切変更しないでください
- export文や配列構造も変更しないでください
- 出力は完全なJavaScriptコードとして、コピー&ペーストでそのまま使える形式にしてください

【重要】
- 物件名を購入理由内で繰り返さない
- 各購入希望者の属性に応じた自然な理由を生成
- パターン化を避け、多様性を保つ
- 30〜100文字程度の自然な文章
- 既存のコード構造を完全に保持

以下のファイル内容を改善してください：

[ここにpart1.jsの内容を貼り付ける]
```

## プロンプト（part2.js〜part5.js用）

part2.js〜part5.jsについても、上記のプロンプトで「part1.js」の部分を「part2.js」「part3.js」などに置き換えて使用してください。

## 実行方法

### Claude CLIを使用する場合

```bash
# part1.jsを処理
claude --file data/mansion/part1.js --prompt "prompts/brushup_mansion_buyers.md" > data/mansion/part1_brushup.js

# part2.jsを処理
claude --file data/mansion/part2.js --prompt "prompts/brushup_mansion_buyers.md" > data/mansion/part2_brushup.js

# part3.jsを処理
claude --file data/mansion/part3.js --prompt "prompts/brushup_mansion_buyers.md" > data/mansion/part3_brushup.js

# part4.jsを処理
claude --file data/mansion/part4.js --prompt "prompts/brushup_mansion_buyers.md" > data/mansion/part4_brushup.js

# part5.jsを処理
claude --file data/mansion/part5.js --prompt "prompts/brushup_mansion_buyers.md" > data/mansion/part5_brushup.js
```

### または、プロンプトを直接使用する場合

1. 上記のプロンプトをコピー
2. 各partファイルの内容を「[ここにpart1.jsの内容を貼り付ける]」の部分に貼り付け
3. Claude CLIまたはClaude APIで実行
4. 出力されたコードを元のファイルに上書き保存

## 改善のポイント詳細

### 1. 物件名を繰り返さない
- ❌ 悪い例：「BELISTA千里山は通勤に便利な立地で...」
- ✅ 良い例：「通勤に便利な立地で、駅から徒歩5分の好立地が決め手でした」

### 2. 属性に合わせた理由
- 職業が「教員」の場合：「学校に近く、教育環境を重視して選びました」
- 家族構成が「ご夫婦とお子様」の場合：「子育てに適した環境で、近くに公園や保育園もあります」
- 年齢が「50代後半」の場合：「老後の住まいとして、駅近で買い物も便利な立地を選びました」

### 3. 具体的でリアルな動機
- ❌ 悪い例：「周辺環境と利便性に惹かれました」
- ✅ 良い例：「以前からこのエリアに住みたいと考えており、駅近でスーパーも徒歩圏内という生活利便性の高さが決め手でした」

### 4. 多様性
- 同じ物件でも、購入希望者ごとに異なる理由を生成
- パターン化された文章を避ける

### 5. 文字数
- 30〜100文字程度の自然な文章
- 簡潔すぎず、詳細すぎない
