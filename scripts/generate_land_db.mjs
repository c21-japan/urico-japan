import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// データディレクトリのパス
const landAreaDir = path.join(__dirname, '..', 'data', 'land', 'area');
const landStationDir = path.join(__dirname, '..', 'data', 'land', 'station');

// すべての購入希望者を格納する配列
let allBuyers = [];

// ディレクトリを再帰的に読み込む関数
function readJsonFilesRecursively(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            readJsonFilesRecursively(filePath);
        } else if (file.endsWith('.json')) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const buyers = JSON.parse(content);

                if (Array.isArray(buyers)) {
                    allBuyers.push(...buyers);
                }

                console.log(`✓ ${filePath.replace(__dirname + '/../', '')} (${buyers.length}件)`);
            } catch (error) {
                console.error(`✗ ${filePath}: ${error.message}`);
            }
        }
    }
}

console.log('土地購入希望者データの集約を開始...\n');

// エリアファイルを読み込み
console.log('エリアファイルを読み込み中...');
readJsonFilesRecursively(landAreaDir);

// 駅ファイルを読み込み
console.log('\n駅ファイルを読み込み中...');
readJsonFilesRecursively(landStationDir);

console.log(`\n合計: ${allBuyers.length}件の購入希望者\n`);

// ファイルサイズを計算
const jsonString = JSON.stringify(allBuyers, null, 2);
const sizeInMB = (Buffer.byteLength(jsonString, 'utf-8') / 1024 / 1024).toFixed(2);

console.log(`予想ファイルサイズ: ${sizeInMB} MB`);

// 5MB以上の場合は分割
if (parseFloat(sizeInMB) > 5) {
    console.log('\nファイルサイズが大きいため、複数ファイルに分割します...\n');

    // 分割数を計算（1ファイル3000件程度）
    const chunkSize = 3000;
    const numParts = Math.ceil(allBuyers.length / chunkSize);

    // 各パートファイルを生成
    for (let i = 0; i < numParts; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, allBuyers.length);
        const chunk = allBuyers.slice(start, end);

        const partContent = `// 土地購入希望者データベース Part${i + 1}
// AUTO-GENERATED. DO NOT EDIT BY HAND.

export const LAND_DB_PART${i + 1} = ${JSON.stringify(chunk, null, 2)};
`;

        const partPath = path.join(__dirname, '..', 'data', 'land', `part${i + 1}.js`);
        fs.writeFileSync(partPath, partContent, 'utf-8');
        console.log(`✓ part${i + 1}.js 生成完了 (${chunk.length}件)`);
    }

    // メインファイルを生成（各パートをインポート）
    const imports = Array.from({ length: numParts }, (_, i) =>
        `import { LAND_DB_PART${i + 1} } from './data/land/part${i + 1}.js';`
    ).join('\n');

    const spread = Array.from({ length: numParts }, (_, i) =>
        `  ...LAND_DB_PART${i + 1}`
    ).join(',\n');

    const mainContent = `// 土地購入希望者データベース
// AUTO-GENERATED. DO NOT EDIT BY HAND.
// 全${allBuyers.length}件の購入希望者情報

${imports}

export const LAND_DB = [
${spread}
];
`;

    const mainPath = path.join(__dirname, '..', 'land_db.js');
    fs.writeFileSync(mainPath, mainContent, 'utf-8');
    console.log(`\n✓ land_db.js 生成完了 (${numParts}パート, 合計${allBuyers.length}件)`);

} else {
    // 5MB以下の場合は1ファイルに
    const content = `// 土地購入希望者データベース
// AUTO-GENERATED. DO NOT EDIT BY HAND.
// 全${allBuyers.length}件の購入希望者情報

export const LAND_DB = ${JSON.stringify(allBuyers, null, 2)};
`;

    const mainPath = path.join(__dirname, '..', 'land_db.js');
    fs.writeFileSync(mainPath, content, 'utf-8');
    console.log(`\n✓ land_db.js 生成完了 (${allBuyers.length}件)`);
}

console.log('\n完了!');
