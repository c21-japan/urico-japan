#!/usr/bin/env node
/**
 * house_db.js を複数の part ファイルに分割する
 * 目的: 1ファイルが大きすぎて IDE が重くなるのを防ぐ（マンションの part1〜5 と同様）
 *
 * 使い方: node scripts/split_house_db.mjs
 *
 * 生成物:
 *   - data/house/part1.js ～ partN.js （HOUSE_DB_PART を export）
 *   - house_db.js を import のみの小さなファイルに差し替え
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');
const HOUSE_DB_PATH = path.join(PROJECT, 'house_db.js');
const DATA_HOUSE = path.join(PROJECT, 'data', 'house');

// 1 part あたりの目安行数（マンション part が 5 万行前後なので、これを下回るようにする）
const TARGET_LINES_PER_PART = 40000;

function getLineCount(obj) {
  return JSON.stringify(obj, null, 2).split('\n').length + 1; // +1 for trailing comma
}

function run() {
  console.log('house_db.js を読み込んでいます...');
  const raw = fs.readFileSync(HOUSE_DB_PATH, 'utf-8');

  // "export const HOUSE_DB = " の直後 "[" ～ "];" の配列部分だけ抽出して JSON として解釈
  const startMark = 'export const HOUSE_DB = ';
  const startIdx = raw.indexOf(startMark);
  if (startIdx === -1) {
    throw new Error('house_db.js に "export const HOUSE_DB = " が見つかりません');
  }
  const arrayStart = startIdx + startMark.length;
  if (raw[arrayStart] !== '[') {
    throw new Error('HOUSE_DB の直後が "[" で始まっていません');
  }

  // 配列の終わり: 改行 + "];" の手前で区切る（"\n];\n" または "\n];\nexport" を想定）
  const exportDefault = '\nexport default';
  const endSearch = raw.indexOf(exportDefault, arrayStart);
  const slice = raw.slice(arrayStart, endSearch);
  let close = slice.lastIndexOf('];');
  if (close === -1) close = slice.length;
  const arrayStr = slice.slice(0, close + 1);

  let list;
  try {
    list = JSON.parse(arrayStr);
  } catch (e) {
    throw new Error('HOUSE_DB の配列を JSON として解釈できません: ' + e.message);
  }

  if (!Array.isArray(list)) {
    throw new Error('HOUSE_DB は配列ではありません');
  }

  const total = list.length;
  console.log(`配列件数: ${total.toLocaleString()}`);

  // 1件あたりの行数のおおよそ（先頭 2 件で推定）
  const sampleLines = list.length >= 2
    ? (JSON.stringify(list[0], null, 2).split('\n').length + JSON.stringify(list[1], null, 2).split('\n').length) / 2
    : 18;
  const partCount = Math.max(1, Math.ceil((total * sampleLines) / TARGET_LINES_PER_PART));
  const perPart = Math.ceil(total / partCount);

  console.log(`分割: ${partCount} ファイル、1 part あたり約 ${perPart.toLocaleString()} 件`);

  if (!fs.existsSync(DATA_HOUSE)) {
    fs.mkdirSync(DATA_HOUSE, { recursive: true });
  }

  const header = `// 戸建データベース Part
// AUTO-GENERATED. DO NOT EDIT BY HAND.
// scripts/split_house_db.mjs により house_db.js から分割
`;

  const imports = [];
  const spreads = [];

  for (let i = 0; i < partCount; i++) {
    const from = i * perPart;
    const to = Math.min(from + perPart, total);
    const chunk = list.slice(from, to);
    const partNum = i + 1;
    const partPath = path.join(DATA_HOUSE, `part${partNum}.js`);
    const body = header + `export const HOUSE_DB_PART = ${JSON.stringify(chunk, null, 2)};\n`;
    fs.writeFileSync(partPath, body, 'utf-8');
    console.log(`  data/house/part${partNum}.js (${chunk.length.toLocaleString()} 件)`);
    imports.push(`import { HOUSE_DB_PART as PART${partNum} } from './data/house/part${partNum}.js';`);
    spreads.push(`  ...PART${partNum}`);
  }

  const newHouseDb = `// 戸建データベース
// AUTO-GENERATED. DO NOT EDIT BY HAND.
// 完成しているJSONファイルから自動生成
// 分割: data/house/part1.js ～ part${partCount}.js（scripts/split_house_db.mjs で生成）

${imports.join('\n')}

export const HOUSE_DB = [
${spreads.join(',\n')}
];

export default HOUSE_DB;
`;

  fs.writeFileSync(HOUSE_DB_PATH, newHouseDb, 'utf-8');
  console.log(`\nhouse_db.js を import 式に更新しました（約 ${newHouseDb.split('\n').length} 行）`);
  console.log('IDE の軽量化のため、house_db.js は part の import のみの構成になっています。');
}

run();
