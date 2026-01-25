# Claude CLIでの使用方法

## 方法1: プロンプトファイルと対象ファイルを指定（推奨）

```bash
claude "$(cat REWRITE_PROMPT.md)" --file index.html
```

または

```bash
claude --file index.html "$(cat REWRITE_PROMPT.md)"
```

## 方法2: プロンプトを直接指定

```bash
claude --file index.html "REWRITE_PROMPT.mdの内容を読み込んで、index.htmlを書き直してください"
```

その後、対話形式で `REWRITE_PROMPT.md` の内容を貼り付ける。

## 方法3: パイプを使用

```bash
cat REWRITE_PROMPT.md | claude --file index.html
```

ただし、Claude CLIのバージョンによってはパイプがサポートされていない可能性があります。

## 方法4: 対話形式で実行（最も確実）

1. ターミナルで以下を実行：
```bash
cd /Users/milk/urico-kansai
claude --file index.html
```

2. 対話形式が始まったら、以下を入力：
```
REWRITE_PROMPT.mdの内容に従って、index.htmlを最初から書き直してください。
```

3. 必要に応じて、`REWRITE_PROMPT.md`の内容をコピー&ペースト

## 推奨コマンド

最も確実な方法：

```bash
cd /Users/milk/urico-kansai && claude --file index.html "$(cat REWRITE_PROMPT.md)"
```

このコマンドで：
- `REWRITE_PROMPT.md`の内容がプロンプトとして渡される
- `index.html`が対象ファイルとして指定される
- Claude CLIがプロンプトに従って`index.html`を書き直す
