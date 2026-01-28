const fs = require('fs');
const path = require('path');

// ===========================
// ヘルパー関数
// ===========================

function readJSModule(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    // JSモジュールファイルを読み込んで評価
    const code = fs.readFileSync(filePath, 'utf-8');

    // export const MANSION_DB_PART = ... の部分を抽出
    const match = code.match(/export const MANSION_DB_PART = (\[[\s\S]*\]);/);
    if (match) {
      return JSON.parse(match[1]);
    }

    // 純粋なJSON配列の場合
    if (code.trim().startsWith('[')) {
      return JSON.parse(code);
    }

    return null;
  } catch (error) {
    console.error(`モジュール読み込みエラー: ${filePath}`, error.message);
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

function generateMansionHTML(mansion) {
  const { name, buyers } = mansion;
  const buyersCount = buyers.length;

  // 購入希望者カードのHTML生成
  const buyerCardsHTML = buyers.map((buyer, index) => {
    // バッジ
    const badges = [];
    if (buyer.timing === '即時') {
      badges.push('<span class="badge badge-urgent">急ぎ</span>');
    }
    // マンションの場合、特定の条件で新着バッジを表示
    if (buyersCount === 3 || buyersCount === 4) {
      if (index >= buyersCount - 2) badges.push('<span class="badge badge-new">新着</span>');
    } else if (buyersCount === 5) {
      if (index >= buyersCount - 3) badges.push('<span class="badge badge-new">新着</span>');
    }

    // 情報行を生成
    const infoRows = [];

    if (buyer.family) infoRows.push(`<div class="info-row"><span class="label">家族構成</span><span class="value">${buyer.family}</span></div>`);
    if (buyer.age) infoRows.push(`<div class="info-row"><span class="label">年齢</span><span class="value">${buyer.age}</span></div>`);
    if (buyer.occupation) infoRows.push(`<div class="info-row"><span class="label">職業</span><span class="value">${buyer.occupation}</span></div>`);
    if (buyer.timing) infoRows.push(`<div class="info-row"><span class="label">購入時期</span><span class="value">${buyer.timing}</span></div>`);
    if (buyer.method) infoRows.push(`<div class="info-row"><span class="label">購入方法</span><span class="value">${buyer.method}</span></div>`);
    if (buyer.reason) infoRows.push(`<div class="info-row"><span class="label">購入理由</span><span class="value">${buyer.reason}</span></div>`);

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
    <title>${name} - 購入希望者一覧 | URICO</title>
    <meta name="description" content="${name}の購入希望者${buyersCount}件。">
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
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .info-banner h2 {
            color: #667eea;
            font-size: 1.3rem;
            margin-bottom: 0.5rem;
        }
        .info-banner p {
            color: #666;
            line-height: 1.8;
        }
        .buyers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .buyer-card {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .buyer-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .buyer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid #f0f0f0;
        }
        .buyer-header h3 {
            font-size: 1.1rem;
            color: #667eea;
        }
        .badges {
            display: flex;
            gap: 0.5rem;
        }
        .badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .badge-urgent {
            background: #ff4444;
            color: white;
        }
        .badge-new {
            background: #4caf50;
            color: white;
        }
        .buyer-info {
            margin-bottom: 1rem;
        }
        .info-row {
            display: flex;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f5f5f5;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-row.ng {
            background: #fff9e6;
            padding: 0.75rem;
            border-radius: 5px;
            margin-top: 0.5rem;
        }
        .label {
            font-weight: 600;
            color: #666;
            min-width: 100px;
        }
        .value {
            color: #333;
            flex: 1;
        }
        .contact-btn {
            width: 100%;
            padding: 0.875rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.3s;
        }
        .contact-btn:hover {
            opacity: 0.9;
        }
        .footer {
            text-align: center;
            padding: 2rem;
            color: #999;
            margin-top: 3rem;
        }
        @media (max-width: 768px) {
            .buyers-grid {
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
        <a href="https://urico.app/" class="back-link">← トップページに戻る</a>
        <h1>${name}</h1>
        <p>購入希望者 ${buyersCount}件</p>
    </div>

    <div class="container">
        <div class="info-banner">
            <h2>📋 マンション情報</h2>
            <p>このマンションを探している購入希望者が${buyersCount}組います。下記の購入希望者に物件を紹介することができます。</p>
        </div>

        <div class="buyers-grid">
            ${buyerCardsHTML}
        </div>

        <!-- 購入希望者情報の最後に表示する補足説明コンテンツ（モダンデザイン・3列レイアウト） -->
        <div class="buyer-supplement-modern">
            <div class="supplement-header">
                <h2 class="supplement-main-title">
                    掲載情報<span class="highlight-text">だけではない</span>、URICOの強み
                </h2>
                <p class="supplement-subtitle">
                    このページの購入希望者に加えて、<strong>掲載されていない購入希望者</strong>もご紹介できる可能性があります
                </p>
            </div>

            <div class="three-column-grid">
                <!-- 左列: 業界の現状 -->
                <div class="info-card">
                    <div class="card-icon">💼</div>
                    <h3 class="card-title">業界の現状</h3>
                    <p class="card-text">
                        不動産業界では、高齢化やIT対応の難しさ、日常業務の多忙などにより、購入希望者情報をシステムに登録できていない会社が多数存在します。
                    </p>
                </div>

                <!-- 中央列: URICOの取り組み -->
                <div class="info-card featured">
                    <div class="card-icon">🤝</div>
                    <h3 class="card-title">URICOの取り組み</h3>
                    <p class="card-text">
                        関西1,629社の提携・加盟会社と日常的に連携。掲載外の購入希望者についても、条件が合致する場合は個別ヒアリングのうえご紹介します。
                    </p>
                </div>

                <!-- 右列: あなたのメリット -->
                <div class="info-card">
                    <div class="card-icon">✨</div>
                    <h3 class="card-title">あなたのメリット</h3>
                    <p class="card-text">
                        サイト掲載情報に加え、未掲載の購入希望者も紹介される可能性。より多くのマッチング機会を提供します。
                    </p>
                </div>
            </div>

            <div class="flow-visual">
                <div class="flow-item">
                    <div class="flow-box">
                        <span class="flow-label">掲載中の購入希望者</span>
                    </div>
                </div>
                <div class="flow-plus">+</div>
                <div class="flow-item">
                    <div class="flow-box secondary">
                        <span class="flow-label">掲載外の情報<br><small>（提携先から個別確認）</small></span>
                    </div>
                </div>
                <div class="flow-arrow">→</div>
                <div class="flow-item">
                    <div class="flow-box result">
                        <span class="flow-label">より多くの<br>マッチング機会</span>
                    </div>
                </div>
            </div>

            <div class="notice-box">
                <svg class="notice-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                <p>掲載外の購入希望者情報は、個別確認が必要となるため必ずご紹介できるわけではございません。条件が合致する場合のみのご案内となります。</p>
            </div>
        </div>
    </div>

    <style>
        .buyer-supplement-modern {
            margin: 4rem auto;
            max-width: 1200px;
            padding: 3rem 2rem;
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08);
        }

        .supplement-header {
            text-align: center;
            margin-bottom: 3rem;
        }

        .supplement-main-title {
            font-size: 2rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 1rem;
            line-height: 1.4;
        }

        .highlight-text {
            color: #667eea;
            position: relative;
            display: inline-block;
        }

        .highlight-text::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 2px;
        }

        .supplement-subtitle {
            font-size: 1.1rem;
            color: #4a5568;
            line-height: 1.7;
        }

        .supplement-subtitle strong {
            color: #667eea;
            font-weight: 600;
        }

        /* 3列グリッドレイアウト */
        .three-column-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .info-card {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .info-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #cbd5e0, #cbd5e0);
            transition: background 0.3s ease;
        }

        .info-card.featured::before {
            background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .info-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(102, 126, 234, 0.15);
        }

        .card-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            line-height: 1;
        }

        .card-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 1rem;
        }

        .card-text {
            font-size: 0.95rem;
            color: #4a5568;
            line-height: 1.8;
        }

        /* フロー図 */
        .flow-visual {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
            margin-bottom: 2.5rem;
            flex-wrap: wrap;
        }

        .flow-item {
            flex: 0 0 auto;
        }

        .flow-box {
            padding: 1.5rem 2rem;
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }

        .flow-box.secondary {
            border-color: #cbd5e0;
            background: #f7fafc;
        }

        .flow-box.result {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
        }

        .flow-box:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
        }

        .flow-label {
            font-size: 1rem;
            font-weight: 600;
            display: block;
            text-align: center;
            line-height: 1.5;
        }

        .flow-label small {
            font-size: 0.8rem;
            font-weight: 400;
            opacity: 0.8;
        }

        .flow-plus {
            font-size: 2rem;
            font-weight: 700;
            color: #667eea;
        }

        .flow-arrow {
            font-size: 2rem;
            font-weight: 700;
            color: #667eea;
        }

        /* 注意書き */
        .notice-box {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.5rem;
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
        }

        .notice-icon {
            width: 24px;
            height: 24px;
            color: #f59e0b;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .notice-box p {
            margin: 0;
            font-size: 0.9rem;
            color: #78350f;
            line-height: 1.7;
        }

        /* レスポンシブ対応 */
        @media (max-width: 1024px) {
            .three-column-grid {
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }

            .flow-visual {
                flex-direction: column;
                gap: 1rem;
            }

            .flow-plus,
            .flow-arrow {
                transform: rotate(90deg);
            }
        }

        @media (max-width: 768px) {
            .buyer-supplement-modern {
                padding: 2rem 1.5rem;
                margin: 2rem auto;
            }

            .supplement-main-title {
                font-size: 1.5rem;
            }

            .supplement-subtitle {
                font-size: 1rem;
            }

            .info-card {
                padding: 1.5rem;
            }

            .card-icon {
                font-size: 2.5rem;
            }

            .card-title {
                font-size: 1.1rem;
            }

            .flow-box {
                padding: 1rem 1.5rem;
            }
        }
    </style>

    <div class="footer">
        <p>© 2024 URICO関西 - 不動産売却マッチングサービス</p>
    </div>
</body>
</html>`;
}

// ===========================
// メイン処理
// ===========================

console.log('マンションHTML生成開始...\n');

// マンションデータを読み込み（brushupバージョン）
const mansionParts = [];
for (let i = 1; i <= 5; i++) {
  const partPath = path.join(__dirname, '..', 'data', 'mansion', `part${i}_brushup.js`);
  const partData = readJSModule(partPath);
  if (partData) {
    mansionParts.push(...partData);
    console.log(`✓ part${i}_brushup.js 読み込み完了: ${partData.length}件`);
  } else {
    console.error(`✗ part${i}_brushup.js の読み込みに失敗しました`);
  }
}

console.log(`\n合計: ${mansionParts.length}件のマンションデータ\n`);

// 出力ディレクトリ
const outputDir = path.join(__dirname, '..', 'out', 'mansion');

// 各マンションのHTMLを生成
let successCount = 0;
let errorCount = 0;

mansionParts.forEach((mansion, index) => {
  try {
    const html = generateMansionHTML(mansion);
    // マンション名をファイル名として使用（特殊文字をエスケープ）
    const fileName = mansion.name.replace(/[/:*?"<>|]/g, '_') + '.html';
    const filePath = path.join(outputDir, fileName);
    writeFile(filePath, html);
    successCount++;
    if ((index + 1) % 100 === 0) {
      console.log(`処理中: ${index + 1} / ${mansionParts.length}`);
    }
  } catch (error) {
    console.error(`エラー: ${mansion.name}`, error.message);
    errorCount++;
  }
});

console.log(`\n✓ 生成完了: ${successCount}件`);
if (errorCount > 0) {
  console.log(`✗ エラー: ${errorCount}件`);
}
console.log(`\n出力先: ${outputDir}`);
