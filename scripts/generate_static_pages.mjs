#!/usr/bin/env node
/**
 * 静的HTMLページ生成スクリプト
 *
 * 目的：
 * - SEO対策：各物件・エリアごとに専用ページを生成
 * - パフォーマンス：静的HTMLで高速表示
 * - シンプル：JavaScriptの複雑なロジック不要
 *
 * 生成ページ：
 * - マンション：各マンションごとに1ページ（例：/mansion/エクセルハイツ奈良.html）
 * - 戸建：各市区町村ごとに1ページ（例：/house/大阪府/大阪市北区.html）
 * - 土地：各市区町村ごとに1ページ（例：/land/大阪府/大阪市北区.html）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 出力ディレクトリ
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public');
const MANSION_DIR = path.join(OUTPUT_DIR, 'mansion');
const HOUSE_DIR = path.join(OUTPUT_DIR, 'house');
const LAND_DIR = path.join(OUTPUT_DIR, 'land');

// データディレクトリ
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

// ディレクトリ作成
[OUTPUT_DIR, MANSION_DIR, HOUSE_DIR, LAND_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * HTMLテンプレート
 */
function generateHTML(title, subtitle, buyers, type, location = '') {
    const buyerCards = buyers.map((buyer, index) => {
        const isUrgent = ['即時', '1ヶ月以内'].includes(buyer.timing);
        const isNew = index < Math.ceil(buyers.length * 0.1); // 上位10%を新着
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
                <div class="info-row">
                    <span class="label">家族構成</span>
                    <span class="value">${buyer.family || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="label">年齢</span>
                    <span class="value">${buyer.age || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="label">職業</span>
                    <span class="value">${buyer.occupation || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="label">購入時期</span>
                    <span class="value">${buyer.timing || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="label">購入方法</span>
                    <span class="value">${buyer.method || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="label">購入理由</span>
                    <span class="value">${buyer.reason || '-'}</span>
                </div>
                ${type === 'house' || type === 'land' ? `
                <div class="info-row">
                    <span class="label">土地面積</span>
                    <span class="value">${buyer.landArea || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="label">駅徒歩</span>
                    <span class="value">${buyer.walkingDistance || '-'}</span>
                </div>
                ` : ''}
                ${type === 'mansion' ? `
                <div class="info-row">
                    <span class="label">間取り</span>
                    <span class="value">${buyer.layout || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="label">価格帯</span>
                    <span class="value">${buyer.price || '-'}</span>
                </div>
                ` : ''}
                <div class="info-row ng">
                    <span class="label">NG条件</span>
                    <span class="value">${buyer.ng || '特になし'}</span>
                </div>
            </div>
            <button class="contact-btn" onclick="alert('お問い合わせありがとうございます。担当者より連絡いたします。')">この購入希望者を紹介してほしい</button>
        </div>
        `;
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
        body {
            font-family: 'Noto Sans JP', sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        .header p {
            font-size: 1.1rem;
            opacity: 0.95;
        }
        .back-link {
            display: inline-block;
            margin: 1rem 0;
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            background: rgba(255,255,255,0.2);
            border-radius: 5px;
            transition: background 0.3s;
        }
        .back-link:hover {
            background: rgba(255,255,255,0.3);
        }
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1rem;
        }
        .info-banner {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .info-banner h2 {
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        .buyer-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
        }
        .buyer-card {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .buyer-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        .buyer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #f0f0f0;
        }
        .buyer-header h3 {
            color: #667eea;
            font-size: 1.1rem;
        }
        .badges {
            display: flex;
            gap: 0.5rem;
        }
        .badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .badge-urgent {
            background: #ff6b6b;
            color: white;
        }
        .badge-new {
            background: #4ecdc4;
            color: white;
        }
        .buyer-info {
            display: grid;
            gap: 0.75rem;
        }
        .info-row {
            display: grid;
            grid-template-columns: 120px 1fr;
            gap: 1rem;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f5f5f5;
        }
        .info-row.ng {
            grid-column: 1 / -1;
            grid-template-columns: 120px 1fr;
            background: #fff9e6;
            padding: 0.75rem;
            border-radius: 5px;
            border: none;
            margin-top: 0.5rem;
        }
        .label {
            color: #666;
            font-weight: 500;
            font-size: 0.9rem;
        }
        .value {
            color: #333;
            font-weight: 400;
        }
        .contact-btn {
            width: 100%;
            padding: 1rem;
            margin-top: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .contact-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        @media (max-width: 768px) {
            .buyer-grid {
                grid-template-columns: 1fr;
            }
            .header h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <a href="/index.html" class="back-link">← トップページに戻る</a>
        <h1>${title}</h1>
        <p>${subtitle}</p>
    </div>

    <div class="container">
        <div class="info-banner">
            <h2>📊 購入希望者情報</h2>
            <p>この${type === 'mansion' ? 'マンション' : type === 'house' ? 'エリアの戸建' : 'エリアの土地'}には<strong>${buyers.length}件</strong>の購入希望者がいます。</p>
            <p style="margin-top: 0.5rem; color: #666;">お問い合わせいただければ、これらの購入希望者に物件情報をご紹介いたします。</p>
        </div>

        <div class="buyer-grid">
            ${buyerCards}
        </div>
    </div>
</body>
</html>`;
}

/**
 * マンションページ生成
 */
async function generateMansionPages() {
    console.log('\n=== マンションページ生成中 ===');

    const mansionDbPath = path.join(PROJECT_ROOT, 'mansion_db.js');
    if (!fs.existsSync(mansionDbPath)) {
        console.error('mansion_db.js が見つかりません');
        return 0;
    }

    try {
        // mansion_db.js を動的インポート
        const module = await import(`file://${mansionDbPath}`);
        const mansions = module.MANSION_DB || [];
        let count = 0;

        mansions.forEach(mansion => {
            if (!mansion.buyers || mansion.buyers.length === 0) return;

            const safeName = mansion.name.replace(/[\/\\?%*:|"<>]/g, '_');
            const filePath = path.join(MANSION_DIR, `${safeName}.html`);

            const html = generateHTML(
                mansion.name,
                `購入希望者 ${mansion.buyers.length}件`,
                mansion.buyers,
                'mansion',
                mansion.address || ''
            );

            fs.writeFileSync(filePath, html, 'utf-8');
            count++;

            if (count % 100 === 0) {
                console.log(`  ${count} ページ生成...`);
            }
        });

        console.log(`✓ マンション: ${count} ページ生成完了`);
        return count;
    } catch (err) {
        console.error('mansion_db.js の読み込みエラー:', err);
        return 0;
    }
}

/**
 * 戸建ページ生成
 */
async function generateHousePages() {
    console.log('\n=== 戸建ページ生成中 ===');

    const houseAreaDir = path.join(DATA_DIR, 'house', 'area');
    if (!fs.existsSync(houseAreaDir)) {
        console.error('data/house/area が見つかりません');
        return 0;
    }

    let count = 0;

    function processDirectory(dir, relativePath = '') {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // 再帰的に処理
                processDirectory(fullPath, path.join(relativePath, item));
            } else if (item.endsWith('.json')) {
                // JSONファイルを処理
                try {
                    const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
                    if (!Array.isArray(data) || data.length === 0) return;

                    // パスから都道府県・市区町村を取得
                    const parts = relativePath.split(path.sep);
                    const pref = parts[0] || '';
                    const city = parts[1] || '';
                    const town = item.replace('.json', '');

                    // 出力ディレクトリ作成
                    const outputDir = path.join(HOUSE_DIR, pref, city);
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }

                    // HTMLファイル生成
                    const fileName = `${town}.html`;
                    const filePath = path.join(outputDir, fileName);

                    const title = `${pref} ${city} ${town} 戸建`;
                    const subtitle = `購入希望者 ${data.length}件`;

                    const html = generateHTML(title, subtitle, data, 'house', `${pref} ${city} ${town}`);
                    fs.writeFileSync(filePath, html, 'utf-8');
                    count++;

                    if (count % 500 === 0) {
                        console.log(`  ${count} ページ生成...`);
                    }
                } catch (error) {
                    console.error(`エラー: ${fullPath}`, error.message);
                }
            }
        });
    }

    processDirectory(houseAreaDir);
    console.log(`✓ 戸建: ${count} ページ生成完了`);
    return count;
}

/**
 * 土地ページ生成
 */
async function generateLandPages() {
    console.log('\n=== 土地ページ生成中 ===');

    const landAreaDir = path.join(DATA_DIR, 'land', 'area');
    if (!fs.existsSync(landAreaDir)) {
        console.error('data/land/area が見つかりません');
        return 0;
    }

    let count = 0;

    function processDirectory(dir, relativePath = '') {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // 再帰的に処理
                processDirectory(fullPath, path.join(relativePath, item));
            } else if (item.endsWith('.json')) {
                // JSONファイルを処理
                try {
                    const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
                    if (!Array.isArray(data) || data.length === 0) return;

                    // パスから都道府県・市区町村を取得
                    const parts = relativePath.split(path.sep);
                    const pref = parts[0] || '';
                    const city = parts[1] || '';
                    const town = item.replace('.json', '');

                    // 出力ディレクトリ作成
                    const outputDir = path.join(LAND_DIR, pref, city);
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }

                    // HTMLファイル生成
                    const fileName = `${town}.html`;
                    const filePath = path.join(outputDir, fileName);

                    const title = `${pref} ${city} ${town} 土地`;
                    const subtitle = `購入希望者 ${data.length}件`;

                    const html = generateHTML(title, subtitle, data, 'land', `${pref} ${city} ${town}`);
                    fs.writeFileSync(filePath, html, 'utf-8');
                    count++;

                    if (count % 500 === 0) {
                        console.log(`  ${count} ページ生成...`);
                    }
                } catch (error) {
                    console.error(`エラー: ${fullPath}`, error.message);
                }
            }
        });
    }

    processDirectory(landAreaDir);
    console.log(`✓ 土地: ${count} ページ生成完了`);
    return count;
}

/**
 * メイン実行
 */
async function main() {
    console.log('🚀 静的HTMLページ生成開始');
    console.log(`出力先: ${OUTPUT_DIR}\n`);

    const startTime = Date.now();

    await generateMansionPages();
    const houseCount = await generateHousePages();
    const landCount = await generateLandPages();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n=== 生成完了 ===');
    console.log(`合計ページ数を確認してください`);
    console.log(`処理時間: ${duration}秒`);
    console.log(`\n次のステップ: npm start でローカルサーバーを起動`);
}

main().catch(console.error);
