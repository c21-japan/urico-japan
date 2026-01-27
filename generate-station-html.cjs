const fs = require('fs');
const path = require('path');

// ===========================
// ヘルパー関数
// ===========================

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`JSON解析エラー: ${filePath}`, error.message);
    return null;
  }
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

// ===========================
// HTMLテンプレート生成
// ===========================

function generateStationHTML(data) {
  const { type, company, line, station, buyers } = data;

  const typeLabel = {
    'house': '戸建',
    'land': '土地',
    'mansion': 'マンション'
  }[type] || type;

  const buyersCount = buyers.length;

  // 購入希望者カードのHTML生成
  const buyerCardsHTML = buyers.map((buyer, index) => {
    const isBuyer = buyer.id.startsWith('KO-') || buyer.id.startsWith('MAN-');

    // バッジ
    const badges = [];
    if (buyer.timing === '即時' || buyer.timing === '即入居希望') {
      badges.push('<span class="badge badge-urgent">急ぎ</span>');
    }
    if (index < 5) {
      badges.push('<span class="badge badge-new">新着</span>');
    }

    // 情報行を生成
    const infoRows = [];

    // 共通フィールド
    if (buyer.family) infoRows.push(`<div class="info-row"><span class="label">家族構成</span><span class="value">${buyer.family}</span></div>`);
    if (buyer.age) infoRows.push(`<div class="info-row"><span class="label">年齢</span><span class="value">${buyer.age}</span></div>`);
    if (buyer.occupation) infoRows.push(`<div class="info-row"><span class="label">職業</span><span class="value">${buyer.occupation}</span></div>`);
    if (buyer.timing) infoRows.push(`<div class="info-row"><span class="label">購入時期</span><span class="value">${buyer.timing}</span></div>`);
    if (buyer.method) infoRows.push(`<div class="info-row"><span class="label">購入方法</span><span class="value">${buyer.method}</span></div>`);
    if (buyer.reason) infoRows.push(`<div class="info-row"><span class="label">購入理由</span><span class="value">${buyer.reason}</span></div>`);

    // 戸建特有のフィールド
    if (buyer.buildingAge) infoRows.push(`<div class="info-row"><span class="label">築年数</span><span class="value">${buyer.buildingAge}</span></div>`);
    if (buyer.layout) infoRows.push(`<div class="info-row"><span class="label">間取り</span><span class="value">${buyer.layout}</span></div>`);

    // 土地特有のフィールド
    if (buyer.purpose) infoRows.push(`<div class="info-row"><span class="label">利用目的</span><span class="value">${buyer.purpose}</span></div>`);

    // 共通フィールド
    if (buyer.landArea) infoRows.push(`<div class="info-row"><span class="label">土地面積</span><span class="value">${buyer.landArea}</span></div>`);

    // 駅徒歩はマンションのみ表示（戸建・土地では非表示）
    if (type === 'mansion' && buyer.walkingDistance) {
      infoRows.push(`<div class="info-row"><span class="label">駅徒歩</span><span class="value">${buyer.walkingDistance}</span></div>`);
    }

    // NG条件（黄色背景）
    if (buyer.ng && buyer.ng !== '特になし') {
      infoRows.push(`<div class="info-row ng"><span class="label">NG条件</span><span class="value">${buyer.ng}</span></div>`);
    }

    return `
        <div class="buyer-card">
            <div class="buyer-header">
                <h3>購入希望者 #${index + 1}</h3>
                <div class="badges">${badges.join('')}</div>
            </div>
            <div class="buyer-info">
                ${infoRows.join('\n                ')}
            </div>
            <button class="contact-btn" onclick="window.open('https://form.run/@urico-kansai', '_blank')">📞 この希望者に物件を紹介する</button>
        </div>`;
  }).join('\n        ');

  // HTMLテンプレート
  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${company} ${line} ${station}駅 ${typeLabel} - 購入希望者一覧 | URICO</title>
    <meta name="description" content="${company} ${line} ${station}駅 ${typeLabel}の購入希望者${buyersCount}件。">
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
        <h1>${company} ${line} ${station}駅 ${typeLabel}</h1>
        <p>購入希望者 ${buyersCount}件</p>
    </div>

    <div class="container">
        <div class="info-banner">
            <h2>📊 購入希望者情報</h2>
            <p><strong>${station}駅周辺</strong>の${typeLabel}には<strong>${buyersCount}件</strong>の購入希望者がいます。</p>
            <p style="margin-top: 0.5rem; color: #666;">お問い合わせいただければ、これらの購入希望者に物件情報をご紹介いたします。</p>
        </div>

        <div class="buyer-grid">
            ${buyerCardsHTML}
        </div>
    </div>
</body>
</html>`;
}

// ===========================
// メイン処理
// ===========================

console.log('駅検索用HTMLページ生成開始...\n');

const railwayData = readJSON('./railway_data.json');
if (!railwayData) {
  console.error('railway_data.jsonが読み込めません');
  process.exit(1);
}

let totalGenerated = 0;
const types = ['house', 'land'];

for (const type of types) {
  console.log(`\n=== ${type === 'house' ? '戸建' : '土地'} ===\n`);

  for (const [company, lines] of Object.entries(railwayData)) {
    console.log(`  ${company}`);

    for (const [line, stations] of Object.entries(lines)) {
      for (const station of stations) {
        // JSONファイルを読み込み
        const jsonPath = `./client/data/${type}/station/${company}/${line}/${station}.json`;
        const buyers = readJSON(jsonPath);

        if (!buyers || buyers.length === 0) {
          continue;
        }

        // HTMLを生成
        const html = generateStationHTML({
          type,
          company,
          line,
          station,
          buyers
        });

        // HTMLファイルを保存
        const htmlPath = `./public/${type}/station/${company}/${line}/${station}.html`;
        writeFile(htmlPath, html);
        totalGenerated++;

        if (totalGenerated % 50 === 0) {
          console.log(`    ${totalGenerated}件生成完了`);
        }
      }
    }
  }
}

console.log(`\n=== 生成完了 ===`);
console.log(`合計: ${totalGenerated}ページ生成`);
console.log('\n次のステップ: R2にアップロード');
console.log('  find ./public/house/station ./public/land/station -name "*.html" | wc -l');
