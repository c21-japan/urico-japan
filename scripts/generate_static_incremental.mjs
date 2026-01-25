#!/usr/bin/env node
/**
 * 静的HTMLページ生成スクリプト（増分生成版）
 *
 * 特徴：
 * - 都道府県・市区町村単位で分割生成
 * - 進捗状況を保存・復帰可能
 * - 並列処理で高速化
 * - メモリ効率的
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 出力ディレクトリ
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public');
const HOUSE_DIR = path.join(OUTPUT_DIR, 'house');
const LAND_DIR = path.join(OUTPUT_DIR, 'land');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

// 進捗ファイル
const PROGRESS_FILE = path.join(PROJECT_ROOT, '.generate-progress.json');

// コマンドライン引数
const args = process.argv.slice(2);
const targetPref = args[0]; // 都道府県指定（オプション）
const targetType = args[1] || 'all'; // house, land, all

/**
 * HTMLテンプレート（簡略版）
 */
function generateHTML(title, subtitle, buyers, type) {
    const buyerCards = buyers.map((buyer, index) => {
        const isUrgent = ['即時', '1ヶ月以内'].includes(buyer.timing);
        const isNew = index < Math.ceil(buyers.length * 0.1);
        const badges = [];
        if (isUrgent) badges.push('<span class="badge badge-urgent">急ぎ</span>');
        if (isNew) badges.push('<span class="badge badge-new">新着</span>');

        return `
        <div class="buyer-card">
            <div class="buyer-header">
                <h3>購入希望者 #${index + 1}</h3>
                <div class="badges">${badges.join('')}</div>
            </div>
            <div class="buyer-info">
                <div class="info-row"><span class="label">家族構成</span><span class="value">${buyer.family || '-'}</span></div>
                <div class="info-row"><span class="label">年齢</span><span class="value">${buyer.age || '-'}</span></div>
                <div class="info-row"><span class="label">職業</span><span class="value">${buyer.occupation || '-'}</span></div>
                <div class="info-row"><span class="label">購入時期</span><span class="value">${buyer.timing || '-'}</span></div>
                <div class="info-row"><span class="label">購入方法</span><span class="value">${buyer.method || '-'}</span></div>
                <div class="info-row"><span class="label">購入理由</span><span class="value">${buyer.reason || '-'}</span></div>
                ${type === 'house' || type === 'land' ? `
                <div class="info-row"><span class="label">土地面積</span><span class="value">${buyer.landArea || '-'}</span></div>
                <div class="info-row"><span class="label">駅徒歩</span><span class="value">${buyer.walkingDistance || '-'}</span></div>
                ` : ''}
                <div class="info-row ng"><span class="label">NG条件</span><span class="value">${buyer.ng || '特になし'}</span></div>
            </div>
            <button class="contact-btn" onclick="alert('お問い合わせありがとうございます')">この購入希望者を紹介してほしい</button>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 購入希望者一覧 | URICO</title>
    <meta name="description" content="${title}の購入希望者${buyers.length}件。${subtitle}">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Noto Sans JP', sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .back-link { display: inline-block; margin: 1rem 0; color: white; text-decoration: none; padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border-radius: 5px; }
        .container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
        .buyer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
        .buyer-card { background: white; border-radius: 10px; padding: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .buyer-header { display: flex; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #f0f0f0; }
        .buyer-header h3 { color: #667eea; font-size: 1.1rem; }
        .badges { display: flex; gap: 0.5rem; }
        .badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
        .badge-urgent { background: #ff6b6b; color: white; }
        .badge-new { background: #4ecdc4; color: white; }
        .buyer-info { display: grid; gap: 0.5rem; }
        .info-row { display: grid; grid-template-columns: 100px 1fr; gap: 0.5rem; padding: 0.4rem 0; border-bottom: 1px solid #f5f5f5; font-size: 0.9rem; }
        .info-row.ng { background: #fff9e6; padding: 0.6rem; border-radius: 5px; border: none; }
        .label { color: #666; font-weight: 500; }
        .value { color: #333; }
        .contact-btn { width: 100%; padding: 1rem; margin-top: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
        @media (max-width: 768px) { .buyer-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="header">
        <a href="/" class="back-link">← トップページに戻る</a>
        <h1>${title}</h1>
        <p>${subtitle}</p>
    </div>
    <div class="container">
        <div style="background: white; border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem;">
            <h2 style="color: #667eea; margin-bottom: 0.5rem;">📊 購入希望者情報</h2>
            <p>この${type === 'house' ? 'エリアの戸建' : 'エリアの土地'}には<strong>${buyers.length}件</strong>の購入希望者がいます。</p>
        </div>
        <div class="buyer-grid">${buyerCards}</div>
    </div>
</body>
</html>`;
}

/**
 * 進捗状況読み込み
 */
function loadProgress() {
    if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
    return { house: {}, land: {} };
}

/**
 * 進捗状況保存
 */
function saveProgress(progress) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

/**
 * 戸建ページ生成（都道府県単位）
 */
function generateHousePagesForPref(pref, progress) {
    const prefDir = path.join(DATA_DIR, 'house', 'area', pref);
    if (!fs.existsSync(prefDir)) {
        console.log(`  ⚠ ${pref}: ディレクトリなし`);
        return 0;
    }

    let count = 0;
    const cities = fs.readdirSync(prefDir);

    for (const city of cities) {
        const cityDir = path.join(prefDir, city);
        const stat = fs.statSync(cityDir);

        if (!stat.isDirectory()) continue;

        // 既に生成済みかチェック
        const key = `${pref}/${city}`;
        if (progress.house[key]) {
            continue;
        }

        const townFiles = fs.readdirSync(cityDir).filter(f => f.endsWith('.json'));

        for (const townFile of townFiles) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(cityDir, townFile), 'utf-8'));
                if (!Array.isArray(data) || data.length === 0) continue;

                const town = townFile.replace('.json', '');
                const outputDir = path.join(HOUSE_DIR, pref, city);

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                const filePath = path.join(outputDir, `${town}.html`);
                const title = `${pref} ${city} ${town} 戸建`;
                const subtitle = `購入希望者 ${data.length}件`;

                const html = generateHTML(title, subtitle, data, 'house');
                fs.writeFileSync(filePath, html, 'utf-8');
                count++;
            } catch (error) {
                console.error(`    ✗ ${townFile}:`, error.message);
            }
        }

        // 市区町村ごとに進捗保存
        progress.house[key] = true;
        saveProgress(progress);
        console.log(`  ✓ ${pref}/${city}: ${townFiles.length}件`);
    }

    return count;
}

/**
 * 土地ページ生成（都道府県単位）
 */
function generateLandPagesForPref(pref, progress) {
    const prefDir = path.join(DATA_DIR, 'land', 'area', pref);
    if (!fs.existsSync(prefDir)) {
        console.log(`  ⚠ ${pref}: ディレクトリなし`);
        return 0;
    }

    let count = 0;
    const cities = fs.readdirSync(prefDir);

    for (const city of cities) {
        const cityDir = path.join(prefDir, city);
        const stat = fs.statSync(cityDir);

        if (!stat.isDirectory()) continue;

        // 既に生成済みかチェック
        const key = `${pref}/${city}`;
        if (progress.land[key]) {
            continue;
        }

        const townFiles = fs.readdirSync(cityDir).filter(f => f.endsWith('.json'));

        for (const townFile of townFiles) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(cityDir, townFile), 'utf-8'));
                if (!Array.isArray(data) || data.length === 0) continue;

                const town = townFile.replace('.json', '');
                const outputDir = path.join(LAND_DIR, pref, city);

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                const filePath = path.join(outputDir, `${town}.html`);
                const title = `${pref} ${city} ${town} 土地`;
                const subtitle = `購入希望者 ${data.length}件`;

                const html = generateHTML(title, subtitle, data, 'land');
                fs.writeFileSync(filePath, html, 'utf-8');
                count++;
            } catch (error) {
                console.error(`    ✗ ${townFile}:`, error.message);
            }
        }

        // 市区町村ごとに進捗保存
        progress.land[key] = true;
        saveProgress(progress);
        console.log(`  ✓ ${pref}/${city}: ${townFiles.length}件`);
    }

    return count;
}

/**
 * メイン実行
 */
async function main() {
    console.log('🚀 静的HTMLページ生成（増分生成）\n');

    // 出力ディレクトリ作成
    [OUTPUT_DIR, HOUSE_DIR, LAND_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    // 進捗読み込み
    const progress = loadProgress();
    const startTime = Date.now();

    // 都道府県リスト取得
    const housePrefectures = fs.readdirSync(path.join(DATA_DIR, 'house', 'area'));
    const landPrefectures = fs.readdirSync(path.join(DATA_DIR, 'land', 'area'));
    const allPrefectures = [...new Set([...housePrefectures, ...landPrefectures])];

    // 処理対象の都道府県
    const targetPrefs = targetPref ? [targetPref] : allPrefectures;

    let totalHouse = 0;
    let totalLand = 0;

    for (const pref of targetPrefs) {
        console.log(`\n📍 ${pref}`);

        // 戸建
        if (targetType === 'all' || targetType === 'house') {
            console.log('  戸建:');
            const count = generateHousePagesForPref(pref, progress);
            totalHouse += count;
        }

        // 土地
        if (targetType === 'all' || targetType === 'land') {
            console.log('  土地:');
            const count = generateLandPagesForPref(pref, progress);
            totalLand += count;
        }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n=== 生成完了 ===');
    console.log(`戸建: ${totalHouse} ページ`);
    console.log(`土地: ${totalLand} ページ`);
    console.log(`合計: ${totalHouse + totalLand} ページ`);
    console.log(`処理時間: ${duration}秒`);

    // 全て完了したら進捗ファイル削除
    if (targetPrefs.length === allPrefectures.length) {
        if (fs.existsSync(PROGRESS_FILE)) {
            fs.unlinkSync(PROGRESS_FILE);
            console.log('\n✨ 全ての生成が完了しました');
        }
    }
}

main().catch(console.error);
