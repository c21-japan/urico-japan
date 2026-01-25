# 購入希望者カードに「新着」「急ぎ」バッジを追加する改修プロンプト

## 背景と目的

既存のURICO不動産売却サイト（`index.html`）の購入希望者カード表示機能に、「新着」と「急ぎ」のバッジを追加したい。既存の機能を壊さず、最小差分で実装する。

## 変更前のコードの状態

### 主要な機能
1. **タブ切り替え機能** (`initializeTabSwitching`)
   - マンション/戸建/土地のタブ切り替え
   - タブ切り替え時に`updateStats(type)`を呼び出して統計情報を更新
   - `statBuyers`と`statProperties`の数値をアニメーション表示

2. **マンション検索機能** (`initializeMansionSearch`)
   - 入力フィールドに文字を入力すると候補を表示
   - `mansionDatabase`から検索して候補リストを表示
   - 候補クリックまたは検索ボタンで`showBuyerDetails(mansion.name)`を呼び出し

3. **購入希望者カード表示** (`showBuyerDetails`)
   - マンション/戸建/土地の購入希望者情報をモーダルで表示
   - 各カードには以下が表示される：
     - 購入希望者番号
     - 価格（`buyer-price-value`）
     - 家族構成、年齢、職業、購入時期、購入方法、購入理由、NG条件

4. **統計情報表示** (`updateStats`)
   - 物件タイプ（mansion/house/land）に応じて統計を更新
   - `animateNumber`で数値をアニメーション表示

### 変更前の購入希望者カードHTML構造（showBuyerDetails関数内）

```javascript
cards.innerHTML = (item.buyers || []).map((b, idx) => `
    <div class="buyer-block">
        <div class="buyer-block-header">
            <span class="buyer-number">購入希望者 #${idx + 1}</span>
            <span class="buyer-price-value">${b.price || '価格応相談'}</span>
        </div>
        <div class="buyer-info-table">
            <div class="buyer-info-row">
                <span class="buyer-info-label">購入時期</span>
                <span class="buyer-info-value">${b.timing || '-'}</span>
            </div>
            <!-- 他の情報行 -->
        </div>
    </div>
`).join('');
```

### 変更前のCSS（buyer-block-header）

```css
.buyer-block-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
}
```

## 追加したい機能の詳細

### 1. バッジ表示機能

購入希望者カードの価格表示の**左側**にバッジを表示する。

- **「急ぎ」バッジ**: 購入時期が「即時」の場合に表示
  - スタイル: 白文字・青背景（#0088ff）・青枠（#0066cc）
  - 位置: 価格の左側

- **「新着」バッジ**: 新着購入希望者に表示
  - スタイル: 白文字・赤背景（#FF4757）・赤枠（#c0392b）
  - 位置: 価格の左側（急ぎバッジがある場合はその右側）

- **両方該当する場合**: 「急ぎ」を左、「新着」を右に並べる

### 2. 新着バッジの付与ルール

購入希望者リスト（buyers）は「上が古く、下が新しい」前提（末尾が最新）。

#### マンション
- buyers総数が3 or 4 → 末尾2件を新着
- buyers総数が5 → 末尾3件を新着
- 上記以外 → 新着なし

#### 戸建・土地
- 16〜25件 → 末尾10件を新着
- 26〜45件 → 末尾20件を新着
- 46〜63件 → 末尾30件を新着
- 上記以外 → 新着なし

### 3. 購入時期の表示ルール

#### 文字の正規化
- 「半年以内」と書かれているものはすべて「6ヶ月以内」に統一
- データ自体は変更せず、表示時のみ変換

#### マンションの購入時期上書き（表示ロジックで上書き）
マンションでbuyers総数が3〜5のとき、購入時期の表示を下記ルールに整える：

- **総数3**:
  - 先頭2件（index 0, 1）→「即時」
  - 末尾1件（index 2）→「6ヶ月以内」

- **総数4**:
  - 先頭2件（index 0, 1）→「即時」
  - 3件目（index 2）→「3ヶ月以内」
  - 末尾（index 3）→「6ヶ月以内」

- **総数5**:
  - 先頭2件（index 0, 1）→「即時」
  - 次の2件（index 2, 3）→「3ヶ月以内」
  - 末尾（index 4）→「6ヶ月以内」

※既存の`timing`値が何であっても、表示はこのルールを優先して上書きする（データ自体は変更しない）

## 実装要件

### 必須要件

1. **既存機能を壊さない**
   - タブ切り替え機能が正常に動作すること
   - マンション検索の候補表示が正常に動作すること
   - 統計情報（statBuyers, statProperties）が正常に表示・更新されること
   - 戸建・土地の検索機能が正常に動作すること

2. **バッジ表示の実装**
   - 価格テキスト要素（`buyer-price-value`）の左側にバッジ表示領域を追加
   - CSSは既存に影響しないよう、専用クラス（例：`buyer-badges`, `buyer-badge`, `buyer-badge--new`, `buyer-badge--urgent`）を追加
   - 影響範囲は購入希望者カード内だけに限定

3. **実装箇所**
   - `showBuyerDetails`関数（マンション検索結果表示）
   - `initializeHouseSearch`関数内の購入希望者カード描画部分（戸建検索結果表示）
   - `initializeLandSearch`関数内の購入希望者カード描画部分（土地検索結果表示）

4. **ヘルパー関数の実装**
   - `getNewCount(propertyType, totalBuyers)`: 新着件数を計算
   - `isNew(index, totalBuyers, newCount)`: 新着判定（末尾が最新前提）
   - `isUrgent(timing)`: 急ぎ判定（「即時」を含むか）
   - `normalizeTimingLabel(str)`: 「半年以内」→「6ヶ月以内」に変換
   - `mansionTimingOverride(index, totalBuyers)`: マンションの購入時期上書き（3〜5のみ）
   - `renderBuyerBadges(propertyType, index, totalBuyers, timing)`: バッジHTML生成（急ぎ→新着の順）

### 受け入れ条件

- マンションで3件表示のとき：末尾2件に新着バッジ、先頭2件は「即時」表示、末尾は「6ヶ月以内」表示
- マンションで5件表示のとき：末尾3件に新着バッジ、先頭2件は「即時」、次の2件は「3ヶ月以内」、末尾は「6ヶ月以内」
- 「即時」の行は急ぎバッジが表示される
- 新着と急ぎが同時該当なら「急ぎ」が左、「新着」が右で並ぶ
- サイト全体のレイアウト崩れがない（buyer-price-valueの他用途が壊れていない）
- タブ切り替え、検索機能、統計表示が正常に動作する

## コードの構造

### 主要な変数・関数

```javascript
// グローバル変数（モジュールスコープ）
let mansionDatabase = [];
let houseDatabase = [];
let landDatabase = [];
let currentType = 'mansion';

// 統計データ
const statsData = {
    mansion: { title: "...", rate: "72.4%" },
    house: { title: "...", rate: "79.5%" },
    land: { title: "...", rate: "81.4%" }
};

// 主要な関数
function updateStats(type) { /* 統計情報更新 */ }
function animateNumber(elementId, targetNumber) { /* 数値アニメーション */ }
window.showBuyerDetails = function(itemName, type = null) { /* 購入希望者詳細表示 */ }
function initializeTabSwitching() { /* タブ切り替え初期化 */ }
function initializeMansionSearch() { /* マンション検索初期化 */ }
function initializeHouseSearch() { /* 戸建検索初期化 */ }
function initializeLandSearch() { /* 土地検索初期化 */ }
```

### 注意点

- `index.html`は`<script type="module">`でモジュールとして動作
- `MANSION_DB`, `HOUSE_DB`, `LAND_DB`は外部モジュールからインポート
- `window.showBuyerDetails`はグローバルスコープで利用可能にするため`window`に割り当て
- 他の関数はモジュールスコープ内で定義

## 実装方針

1. **CSS追加**: バッジ用のスタイルを既存CSSに追加（影響範囲を限定）
2. **ヘルパー関数追加**: バッジ判定・表示用の関数を追加
3. **購入希望者カード描画部分の修正**: 3箇所（マンション/戸建/土地）の描画ロジックを修正
4. **既存機能の動作確認**: タブ切り替え、検索、統計表示が正常に動作することを確認

## 出力形式

`index.html`ファイル全体を、上記要件を満たす形で最初から綺麗に書き直してください。既存の機能を壊さず、バッジ表示機能を追加した完全なコードを出力してください。
