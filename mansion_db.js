// マンションデータベース
// フォルダ内のデータファイルをインポート（ブラシュアップ版）
import { MANSION_DB_PART as PART1 } from './data/mansion/part1_brushup.js';
import { MANSION_DB_PART as PART2 } from './data/mansion/part2_brushup.js';
import { MANSION_DB_PART as PART3 } from './data/mansion/part3_brushup.js';
import { MANSION_DB_PART as PART4 } from './data/mansion/part4_brushup.js';
import { MANSION_DB_PART as PART5 } from './data/mansion/part5_brushup.js';

export const MANSION_DB = [
  ...PART1,
  ...PART2,
  ...PART3,
  ...PART4,
  ...PART5
];

export default MANSION_DB;
