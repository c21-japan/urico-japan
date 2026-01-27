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
    const buyerCardsArray = buyers.map((buyer, index) => {
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
    });

    // 説明コンテンツ
    const explainerHTML = `
    <div class="buyer-info-explainer">
        <div class="explainer-header">
            <div class="explainer-title">
                サイト掲載情報<span class="highlight">だけではない</span><br>
                URICOの強み
            </div>
            <div class="explainer-subtitle">
                URICOでは、このページに掲載されている購入希望者情報に加えて、<br class="pc-only">
                <strong>サイトに掲載されていない購入希望者</strong>もご紹介できる可能性があります。
            </div>
        </div>

        <div class="diagram-container">
            <div class="diagram-title">💡 URICOのマッチング体制</div>

            <div class="flow-diagram">
                <div class="flow-row">
                    <div class="flow-box">
                        <div class="flow-box-label">関西1,629社の不動産会社</div>
                        <div class="flow-box-text">購入希望者データベース</div>
                        <div class="flow-box-subtext">多忙により登録が追いつかない情報も多数</div>
                    </div>
                </div>

                <div class="arrow-down">
                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 5 L20 30 M20 30 L13 23 M20 30 L27 23"
                              stroke="#4ECDC4" stroke-width="3" fill="none"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>

                <div class="flow-row">
                    <div class="flow-box highlight">
                        <div class="flow-box-label">このページ</div>
                        <div class="flow-box-text">掲載されている<br>購入希望者情報</div>
                    </div>
                    <div class="flow-arrow">
                        <svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                            <text x="15" y="18" text-anchor="middle" font-size="18" fill="#666">+</text>
                        </svg>
                    </div>
                    <div class="flow-box">
                        <div class="flow-box-label">まだ登録されていない</div>
                        <div class="flow-box-text">未掲載の<br>購入希望者情報</div>
                    </div>
                </div>

                <div class="arrow-down">
                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 5 L20 30 M20 30 L13 23 M20 30 L27 23"
                              stroke="#4ECDC4" stroke-width="3" fill="none"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>

                <div class="flow-row">
                    <div class="flow-box urico">
                        <div class="flow-box-label">URICOスタッフが</div>
                        <div class="flow-box-text">各不動産会社へ直接ヒアリング<br>& マッチング判断</div>
                    </div>
                </div>

                <div class="arrow-down">
                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 5 L20 30 M20 30 L13 23 M20 30 L27 23"
                              stroke="#FF6B6B" stroke-width="3" fill="none"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>

                <div class="flow-row">
                    <div class="flow-box highlight">
                        <div class="flow-box-label">✨ 結果</div>
                        <div class="flow-box-text">より多くの購入希望者を<br>売主様へご紹介</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="explainer-body">
            <div class="explainer-section">
                <span class="section-label">💼 業界の現状</span>
                <div class="section-text">
                    不動産業界では高齢化や日常業務の多忙さにより、保有している購入希望者情報をサイトに登録する時間が十分に取れない不動産会社も少なくありません。
                </div>
            </div>

            <div class="explainer-section">
                <span class="section-label">🤝 URICOの取り組み</span>
                <div class="section-text">
                    URICOスタッフは、各加盟店と密に連絡を取り合い、掲載されていない購入希望者情報についても直接ヒアリングを実施。お客様の物件とマッチングできると判断した場合、積極的にご紹介を行っています。
                </div>
            </div>
        </div>

        <div class="merit-section">
            <div class="merit-title">
                <span class="merit-icon">🎯</span>
                あなたにとってのメリット
            </div>
            <ul class="merit-list">
                <li>サイト掲載の購入希望者に加え、未掲載の情報も紹介される可能性</li>
                <li>100万組のデータベースを活かした幅広いマッチング機会</li>
                <li>URICOスタッフによる丁寧なマッチングサポート</li>
            </ul>
        </div>
    </div>
    `;

    // 購入希望者カードの半分の位置に説明コンテンツを挿入
    const halfIndex = Math.floor(buyerCardsArray.length / 2);
    const firstHalf = buyerCardsArray.slice(0, halfIndex).join('');
    const secondHalf = buyerCardsArray.slice(halfIndex).join('');
    const buyerCards = firstHalf + explainerHTML + secondHalf;

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

        /* 購入希望者情報説明コンテンツ */
        .buyer-info-explainer {
            background: linear-gradient(135deg, #f7f9f9 0%, #ffffff 100%);
            border: 2px solid #4ECDC4;
            border-radius: 16px;
            padding: 32px 24px;
            margin: 32px 0;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            grid-column: 1 / -1;
        }
        .explainer-header {
            text-align: center;
            margin-bottom: 24px;
        }
        .explainer-title {
            font-size: 22px;
            font-weight: bold;
            color: #2C3E50;
            margin-bottom: 12px;
            line-height: 1.5;
        }
        .explainer-title .highlight {
            color: #FF6B6B;
            font-size: 24px;
        }
        .explainer-subtitle {
            font-size: 15px;
            color: #555;
            line-height: 1.7;
        }
        .explainer-body {
            margin: 28px 0;
        }
        .explainer-section {
            margin-bottom: 24px;
        }
        .section-label {
            display: inline-block;
            background: #FF6B6B;
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 12px;
        }
        .section-text {
            font-size: 14px;
            color: #2C3E50;
            line-height: 1.8;
            padding-left: 8px;
        }
        .diagram-container {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .diagram-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #2C3E50;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #4ECDC4;
        }
        .flow-diagram {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .flow-row {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .flow-box {
            flex: 1;
            background: #f7f9f9;
            border: 2px solid #4ECDC4;
            border-radius: 10px;
            padding: 16px 12px;
            text-align: center;
            position: relative;
        }
        .flow-box.highlight {
            background: linear-gradient(135deg, #FFE5E5 0%, #FFF0F0 100%);
            border-color: #FF6B6B;
        }
        .flow-box.urico {
            background: linear-gradient(135deg, #E5F9F7 0%, #F0FCFB 100%);
            border-color: #4ECDC4;
        }
        .flow-box-label {
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
            font-weight: 500;
        }
        .flow-box-text {
            font-size: 13px;
            font-weight: bold;
            color: #2C3E50;
            line-height: 1.4;
        }
        .flow-box-subtext {
            font-size: 11px;
            color: #666;
            margin-top: 4px;
        }
        .flow-arrow {
            width: 30px;
            height: 30px;
            position: relative;
            flex-shrink: 0;
        }
        .flow-arrow svg {
            width: 100%;
            height: 100%;
        }
        .arrow-down {
            margin: 8px auto;
            width: 40px;
            height: 40px;
        }
        .merit-section {
            background: linear-gradient(135deg, #E5F9F7 0%, #F0FCFB 100%);
            border-left: 4px solid #4ECDC4;
            padding: 20px;
            border-radius: 8px;
            margin-top: 24px;
        }
        .merit-title {
            font-size: 16px;
            font-weight: bold;
            color: #2C3E50;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .merit-icon {
            font-size: 20px;
        }
        .merit-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .merit-list li {
            font-size: 14px;
            color: #2C3E50;
            line-height: 1.8;
            padding-left: 24px;
            position: relative;
            margin-bottom: 8px;
        }
        .merit-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #4ECDC4;
            font-weight: bold;
            font-size: 16px;
        }

        @media (max-width: 768px) {
            .buyer-info-explainer {
                padding: 24px 16px;
                margin: 24px 0;
            }
            .explainer-title {
                font-size: 18px;
            }
            .explainer-title .highlight {
                font-size: 20px;
            }
            .explainer-subtitle {
                font-size: 14px;
            }
            .diagram-container {
                padding: 16px;
            }
            .diagram-title {
                font-size: 14px;
            }
            .flow-row {
                flex-direction: column;
                gap: 8px;
            }
            .flow-arrow {
                transform: rotate(90deg);
                margin: 0;
            }
            .arrow-down {
                width: 30px;
                height: 30px;
            }
            .flow-box {
                width: 100%;
                padding: 14px 10px;
            }
            .flow-box-text {
                font-size: 12px;
            }
            .flow-box-subtext {
                font-size: 10px;
            }
            .section-text {
                font-size: 13px;
            }
            .merit-title {
                font-size: 14px;
            }
            .merit-list li {
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <a href="https://www.urico.app/" class="back-link">← トップページに戻る</a>
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
