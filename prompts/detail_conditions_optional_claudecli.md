# 戸建・土地 詳細条件（土地面積・駅徒歩）を両方必須にし絞り込みする仕様（Claude CLI用）

## 概要

戸建・土地の「エリアから探す」「駅から探す」の両方で、**詳細条件（土地面積・駅徒歩）を両方とも必須**とし、**両方選択したうえで**、その条件に該当する購入希望者のみを表示するように実装・維持してください。

---

## 望ましい仕様

1. **詳細条件は両方必須**
   - **土地面積**：必ず選択する（未選択では検索不可）
   - **駅徒歩**：必ず選択する（未選択では検索不可）
   - どちらか一方でも未選択なら「土地面積と駅徒歩を選択してください。」でアラートとし、検索を実行しない

2. **絞り込み**
   - 両方選択された場合のみ検索が走り、**土地面積・駅徒歩の両方の条件に合う購入希望者だけ**を表示する
   - 希望土地面積が選択した土地面積条件に合致し、かつ駅徒歩が選択した駅徒歩条件に合致するもののみ表示

---

## 修正・確認対象

- **index.html**：詳細条件（土地面積・駅徒歩）が **必須** であることの確認。`required-badge`「必須」・各 `select` の `required` 属性が付いていること。
- **main.js**：駅から探す・エリアから探すの両方で、土地面積・駅徒歩の **両方必須チェック** があり、未入力ならアラートで検索しないこと。また、`filterBuyersByConditions` で両条件を使って絞り込み、該当する購入希望者のみ表示すること。

---

## 具体的な実装内容

### 1. index.html

詳細条件ブロック（4箇所：戸建の駅・戸建のエリア・土地の駅・土地のエリア）で、以下を満たすこと。

- 見出しに `<span class="required-badge">必須</span>`
- 土地面積の `select` に `required` 属性
- 駅徒歩の `select` に `required` 属性

**対象 id（参照用）**

| 検索方法     | 物件 | 土地面積              | 駅徒歩                    |
|--------------|------|------------------------|---------------------------|
| 駅から探す   | 戸建 | `house-land-area`      | `house-walking-distance`  |
| エリアから探す | 戸建 | `house-area-land-area` | `house-area-walking-distance` |
| 駅から探す   | 土地 | `land-land-area`       | `land-walking-distance`   |
| エリアから探す | 土地 | `land-area-land-area`  | `land-area-walking-distance` |

---

### 2. main.js

#### 2-1. 駅から探す（`performMultiRailwaySearch`）

- 土地面積・駅徒歩を取得：  
  `document.getElementById(\`${type}-land-area\`)?.value.trim()`  
  `document.getElementById(\`${type}-walking-distance\`)?.value.trim()`
- **必須チェック**（このブロックを **必ず残す**）：
  ```javascript
  if (!landArea || !walkingDistance) {
      alert('土地面積と駅徒歩を選択してください。');
      return;
  }
  ```
- 取得した `landArea` / `walkingDistance` で `filterBuyersByConditions(mergedBuyers, landArea, walkingDistance)` を呼び、**両条件に合う購入希望者のみ** `displayBuyerResults` に渡す。

#### 2-2. エリアから探す（`performAreaSearch`）

- 土地面積・駅徒歩を取得：  
  `document.getElementById(\`${type}-area-land-area\`)?.value.trim()`  
  `document.getElementById(\`${type}-area-walking-distance\`)?.value.trim()`
- **必須チェック**（このブロックを **必ず残す**）：
  ```javascript
  if (!landArea || !walkingDistance) {
      alert('土地面積と駅徒歩を選択してください。');
      return;
  }
  ```
- 取得した `landArea` / `walkingDistance` で `filterBuyersByConditions(buyers, landArea, walkingDistance)` を呼び、**両条件に合う購入希望者のみ** `displayBuyerResults` に渡す。

---

## 絞り込みロジック（変更不要）

- `filterBuyersByConditions(buyers, landArea, walkingDistance)`  
  - 両方必ず渡る前提で、土地面積・駅徒歩の **両方** に合致する購入希望者のみを返す。
- `checkLandAreaMatch` / `checkWalkingDistanceMatch` の内部ロジックは **変更しない**。

---

## 挙動まとめ

| 土地面積 | 駅徒歩 | 動作 |
|----------|--------|------|
| 未選択   | 未選択 | アラート「土地面積と駅徒歩を選択してください。」→ 検索しない |
| 未選択   | 選択   | アラート「土地面積と駅徒歩を選択してください。」→ 検索しない |
| 選択     | 未選択 | アラート「土地面積と駅徒歩を選択してください。」→ 検索しない |
| 選択     | 選択   | 検索実行。**土地面積・駅徒歩の両方に合う購入希望者のみ**表示 |

---

## 実行例（Claude CLI）

```bash
cd /Users/milk/urico-kansai
claude --file index.html --file main.js "$(cat prompts/detail_conditions_optional_claudecli.md)"
```

対話で指示する場合は、  
「`prompts/detail_conditions_optional_claudecli.md` の内容に従って、`index.html` と `main.js` を確認・修正してください。詳細条件（土地面積・駅徒歩）は両方必須とし、両方選択したときだけ、その条件に該当する購入希望者のみ表示すること。」  
と伝え、必要なら当ファイルの内容を貼り付けてください。
