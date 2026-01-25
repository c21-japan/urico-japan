#!/usr/bin/env node

/**
 * CSV → JSON 変換スクリプト
 * 使い方:
 *   node scripts/csv_to_json.mjs <input.csv> [output.json]
 *   node scripts/csv_to_json.mjs data.csv           # 標準出力にJSON
 *   node scripts/csv_to_json.mjs data.csv out.json  # ファイルに保存
 *   node scripts/csv_to_json.mjs -t data.tsv out.json  # タブ区切り（TSV）
 */

import fs from 'fs';
import path from 'path';

/**
 * 1行をパース（ダブルクォート内のカンマを考慮）
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (inQuotes) {
      current += c;
    } else if (c === ',') {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * CSV文字列を配列（オブジェクトの配列）に変換
 */
function csvToJson(csvText, options = {}) {
  const { delimiter = ',', hasHeader = true } = options;
  const lines = csvText.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const parse =
    delimiter === ','
      ? parseCsvLine
      : (line) => line.split(delimiter).map((s) => s.trim());
  const rawRows = lines.map((line) => parse(line));

  if (!hasHeader) {
    return rawRows.map((cells) => cells);
  }

  const headers = rawRows[0].map((h, i) => h || `col${i}`);
  const data = rawRows.slice(1);

  return data.map((cells) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cells[i] ?? '';
    });
    return obj;
  });
}

function main() {
  let args = process.argv.slice(2);
  let delimiter = ',';
  if (args[0] === '-t' || args[0] === '--tab') {
    delimiter = '\t';
    args = args.slice(1);
  }
  if (args.length < 1) {
    console.error('使い方: node scripts/csv_to_json.mjs [-t|--tab] <input.csv> [output.json]');
    console.error('  - 出力先を省略すると標準出力に出力');
    console.error('  -t, --tab  タブ区切り（TSV）');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = args[1] ? path.resolve(args[1]) : null;

  if (!fs.existsSync(inputPath)) {
    console.error(`エラー: 入力ファイルが見つかりません: ${inputPath}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(inputPath, 'utf-8');
  const json = csvToJson(csvText, { delimiter });
  const jsonStr = JSON.stringify(json, null, 2);

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, jsonStr, 'utf-8');
    console.log(`✅ ${inputPath} → ${outputPath}`);
  } else {
    console.log(jsonStr);
  }
}

main();
