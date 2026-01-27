// データベースをインポート
import { MANSION_DB } from './mansion_db.js';
// HOUSE_DB と LAND_DB は Cloudflare R2 から動的に読み込むため、ここではインポートしない

// グローバルエラーハンドラー
window.addEventListener('error', (event) => {
    console.error('グローバルエラー:', event.error);
    if (event.error && event.error.message && event.error.message.includes('Failed to fetch')) {
        console.error('モジュールの読み込みに失敗しました。サーバー経由でアクセスしているか確認してください。');
    }
});

// 未処理のPromise拒否をキャッチ
window.addEventListener('unhandledrejection', (event) => {
    console.error('未処理のPromise拒否:', event.reason);
});

// グローバル変数
let railwayData = {};
let areaData = {};
let areaTownData = {};
let mansionDatabase = [];
let houseDatabase = [];
let landDatabase = [];
let currentType = 'mansion'; // 現在の物件タイプ

const statsData = {
    mansion: { title: "＼マンションを探している購入希望者を<span>検索／</span>", rate: "72.4%" },
    house: { title: "＼戸建を探している購入希望者を<span>検索／</span>", rate: "79.5%" },
    land: { title: "＼土地を探している購入希望者を<span>検索／</span>", rate: "81.4%" }
};

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('=== 初期化開始 ===');
        console.log('MANSION_DB:', typeof MANSION_DB, Array.isArray(MANSION_DB) ? MANSION_DB.length : 'N/A');

        mansionDatabase = MANSION_DB || [];
        // houseDatabase と landDatabase は空配列で初期化（Cloudflare R2 から動的に取得）
        houseDatabase = [];
        landDatabase = [];

        console.log('読み込まれたマンション数:', mansionDatabase.length);
        console.log('戸建・土地データ: Cloudflare R2から動的取得');

        if (mansionDatabase.length === 0) {
            console.error('警告: マンションデータベースが空です。データファイルを確認してください。');
        }
        
        const totalBuyers = mansionDatabase.reduce((sum, m) => sum + (m.buyers?.length || 0), 0);
        console.log('読み込まれた購入希望者数:', totalBuyers);
        
        // DOM要素の確認
        const statBuyersEl = document.getElementById('statBuyers');
        const statPropertiesEl = document.getElementById('statProperties');
        console.log('DOM要素の確認:', {
            statBuyers: !!statBuyersEl,
            statProperties: !!statPropertiesEl
        });
        
        updateStats('mansion');
        await loadExternalData();
        setupSearchMethodToggle('house');
        setupSearchMethodToggle('land');
        setup3TierRailwaySelect('house');
        setup3TierRailwaySelect('land');
        initializeTabSwitching();
        initializeMansionSearch();
        // initializeHouseSearch();  // コメントアウト: onclick方式に変更
        // initializeLandSearch();    // コメントアウト: onclick方式に変更
        initializeImageSlider();
        initializeSimulator();
        
        console.log('=== 初期化完了 ===');
    } catch (error) {
        console.error('初期化エラー:', error);
        console.error('エラーの詳細:', error.stack);
        alert('データの読み込みに失敗しました。ページを再読み込みしてください。\n\nエラー: ' + error.message);
    }
});

function updateStats(type) {
    currentType = type;
    let database, totalBuyers, totalProperties;

    if (type === 'mansion') {
        database = mansionDatabase;
        // マンションは物件ベース（各物件にbuyersがある）
        totalBuyers = database.reduce((sum, item) => sum + (item.buyers?.length || 0), 0);
        totalProperties = database.length;
    } else if (type === 'house') {
        database = houseDatabase;
        // 戸建は購入希望者ベース（Cloudflare R2から動的取得）
        // 全60万件のデータがR2に格納されている
        totalBuyers = 586633; // house_db.js の全データ件数
        // 対応物件数 = 5府県の町名・大字の総計（19,322）
        totalProperties = 19322;
    } else if (type === 'land') {
        database = landDatabase;
        // 土地は購入希望者ベース（Cloudflare R2から動的取得）
        // 全60万件のデータがR2に格納されている
        totalBuyers = 589655; // land_db.js の全データ件数
        // 対応物件数 = 5府県の町名・大字の総計（19,322）
        totalProperties = 19322;
    } else {
        database = mansionDatabase;
        totalBuyers = database.reduce((sum, item) => sum + (item.buyers?.length || 0), 0);
        totalProperties = database.length;
    }

    console.log(`updateStats(${type}): 購入希望者数=${totalBuyers}, 物件数=${totalProperties}`);

    animateNumber('statBuyers', totalBuyers);
    animateNumber('statProperties', totalProperties);

    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroSubtitle) {
        heroSubtitle.textContent =
            `関西1,629社の不動産会社で探している${totalBuyers.toLocaleString()}組の購入希望者データベースから最適な買主を見つけます`;
    }
}

function animateNumber(elementId, targetNumber) {
    const el = document.getElementById(elementId);
    if (!el) {
        console.error(`要素が見つかりません: #${elementId}`);
        return;
    }
    let current = 0;
    const increment = Math.ceil(targetNumber / 50);
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetNumber) {
            current = targetNumber;
            clearInterval(timer);
        }
        el.textContent = current.toLocaleString();
    }, 30);
}

// バッジ表示用ヘルパー関数
function getNewCount(propertyType, totalBuyers) {
    if (propertyType === 'mansion') {
        if (totalBuyers === 3 || totalBuyers === 4) return 2;
        if (totalBuyers === 5) return 3;
        return 0;
    } else if (propertyType === 'house' || propertyType === 'land') {
        if (totalBuyers >= 16 && totalBuyers <= 25) return 10;
        if (totalBuyers >= 26 && totalBuyers <= 45) return 20;
        if (totalBuyers >= 46 && totalBuyers <= 63) return 30;
        return 0;
    }
    return 0;
}

function isNew(index, totalBuyers, newCount) {
    if (newCount === 0) return false;
    // 末尾が最新前提なので、末尾からnewCount件が新着
    return index >= (totalBuyers - newCount);
}

function normalizeTimingLabel(str) {
    if (!str) return str;
    return str.replace(/半年以内/g, '6ヶ月以内');
}

function mansionTimingOverride(index, totalBuyers) {
    if (totalBuyers === 3) {
        if (index < 2) return '即時';
        if (index === 2) return '6ヶ月以内';
    } else if (totalBuyers === 4) {
        if (index < 2) return '即時';
        if (index === 2) return '3ヶ月以内';
        if (index === 3) return '6ヶ月以内';
    } else if (totalBuyers === 5) {
        if (index < 2) return '即時';
        if (index >= 2 && index < 4) return '3ヶ月以内';
        if (index === 4) return '6ヶ月以内';
    }
    return null; // 上書きなし
}

function isUrgent(timing) {
    if (!timing) return false;
    return timing === '即時' || timing.includes('即時');
}

function renderBuyerBadges(propertyType, index, totalBuyers, timing) {
    const newCount = getNewCount(propertyType, totalBuyers);
    const showNew = isNew(index, totalBuyers, newCount);
    const showUrgent = isUrgent(timing);

    if (!showNew && !showUrgent) return '';

    const badges = [];
    if (showUrgent) {
        badges.push('<span class="buyer-badge buyer-badge--urgent">急ぎ</span>');
    }
    if (showNew) {
        badges.push('<span class="buyer-badge buyer-badge--new">新着</span>');
    }

    return `<div class="buyer-badges">${badges.join('')}</div>`;
}

// バッジ優先度を計算（新着+急ぎ=3, 新着のみ=2, 急ぎのみ=1, なし=0）
function getBadgePriority(propertyType, index, totalBuyers, timing) {
    const newCount = getNewCount(propertyType, totalBuyers);
    const showNew = isNew(index, totalBuyers, newCount);
    const showUrgent = isUrgent(timing);

    if (showNew && showUrgent) return 3;
    if (showNew) return 2;
    if (showUrgent) return 1;
    return 0;
}

// 急ぎと新着のバッジが両方あるかチェック（背景色ハイライト用）
function hasBothBadges(propertyType, index, totalBuyers, timing) {
    const newCount = getNewCount(propertyType, totalBuyers);
    const showNew = isNew(index, totalBuyers, newCount);
    const showUrgent = isUrgent(timing);
    return showNew && showUrgent;
}

// 購入希望者をバッジ優先度でソート（元のインデックスも保持）
function sortBuyersByBadges(buyers, propertyType) {
    const totalBuyers = buyers.length;

    // 元のインデックスを保持しながらソート
    return buyers
        .map((buyer, originalIndex) => ({ buyer, originalIndex }))
        .sort((a, b) => {
            const aPriority = getBadgePriority(propertyType, a.originalIndex, totalBuyers, a.buyer.timing);
            const bPriority = getBadgePriority(propertyType, b.originalIndex, totalBuyers, b.buyer.timing);
            return bPriority - aPriority; // 降順（優先度が高い順）
        });
    // { buyer, originalIndex } の配列を返す
}

// 購入希望者詳細モーダル表示（業務用シンプルUI）
window.showBuyerDetails = function(itemName, type = null) {
    const itemType = type || currentType;
    let database, item;

    if (itemType === 'house') {
        database = houseDatabase;
        item = database.find(i => i.name === itemName || i.address === itemName);
    } else if (itemType === 'land') {
        database = landDatabase;
        item = database.find(i => i.name === itemName || i.address === itemName);
    } else {
        database = mansionDatabase;
        item = database.find(i => i.name === itemName);
    }

    if (!item) return;

    const modal = document.getElementById('buyerModal');
    const title = document.getElementById('modalTitle');
    const subtitle = document.getElementById('modalSubtitle');
    const cards = document.getElementById('buyerCards');

    const displayName = item.name || item.address || '物件情報';
    if (title) title.textContent = displayName;
    if (subtitle) subtitle.textContent = `購入希望者 ${(item.buyers || []).length}件`;

    const buyers = item.buyers || [];
    const totalBuyers = buyers.length;
    const newCount = getNewCount(itemType, totalBuyers);

    // バッジ優先度でソート
    const sortedBuyers = sortBuyersByBadges(buyers, itemType);

    if (cards) {
        const buyerCardsHTML = sortedBuyers.map(({ buyer: b, originalIndex }, displayIdx) => {
            // マンションの購入時期上書き（元のインデックスを使用）
            let displayTiming = b.timing || '-';
            if (itemType === 'mansion') {
                const override = mansionTimingOverride(originalIndex, totalBuyers);
                if (override !== null) {
                    displayTiming = override;
                } else {
                    displayTiming = normalizeTimingLabel(displayTiming);
                }
            } else {
                displayTiming = normalizeTimingLabel(displayTiming);
            }

            // バッジ表示は元のインデックスを使用
            const badges = renderBuyerBadges(itemType, originalIndex, totalBuyers, displayTiming);

            // 急ぎ＋新着の両方がある場合にハイライトクラスを付与
            const highlightClass = hasBothBadges(itemType, originalIndex, totalBuyers, displayTiming) ? ' highlight-card' : '';

            return `
            <div class="buyer-block${highlightClass}">
                <div class="buyer-block-header">
                    <span class="buyer-number">購入希望者 #${displayIdx + 1}</span>
                    ${badges}
                </div>
                <div class="buyer-info-table">
                    <div class="buyer-info-row">
                        <span class="buyer-info-label">家族構成</span>
                        <span class="buyer-info-value">${b.family || '-'}</span>
                    </div>
                    <div class="buyer-info-row">
                        <span class="buyer-info-label">年齢</span>
                        <span class="buyer-info-value">${b.age || '-'}</span>
                    </div>
                    <div class="buyer-info-row">
                        <span class="buyer-info-label">職業</span>
                        <span class="buyer-info-value">${b.occupation || '-'}</span>
                    </div>
                    <div class="buyer-info-row">
                        <span class="buyer-info-label">購入時期</span>
                        <span class="buyer-info-value">${displayTiming}</span>
                    </div>
                    <div class="buyer-info-row">
                        <span class="buyer-info-label">購入方法</span>
                        <span class="buyer-info-value">${b.method || '-'}</span>
                    </div>
                    <div class="buyer-info-row">
                        <span class="buyer-info-label">購入理由</span>
                        <span class="buyer-info-value">${b.reason || '-'}</span>
                    </div>
                    <div class="buyer-info-row ng-row" style="grid-column: 1 / -1;">
                        <span class="buyer-info-label">NG条件</span>
                        <span class="buyer-info-value">${b.ng || '特になし'}</span>
                    </div>
                </div>
                <div class="buyer-action">
                    <button class="contact-buyer-btn" onclick="contactBuyer(${displayIdx})">この購入希望者を紹介してほしい</button>
                </div>
            </div>
        `});

        // 購入希望者情報説明コンテンツ
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
                    <!-- 1段目：不動産会社のデータベース -->
                    <div class="flow-row">
                        <div class="flow-box">
                            <div class="flow-box-label">関西1,629社の不動産会社</div>
                            <div class="flow-box-text">購入希望者データベース</div>
                            <div class="flow-box-subtext">多忙により登録が追いつかない情報も多数</div>
                        </div>
                    </div>

                    <!-- 矢印下 -->
                    <div class="arrow-down">
                        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 5 L20 30 M20 30 L13 23 M20 30 L27 23"
                                  stroke="#4ECDC4" stroke-width="3" fill="none"
                                  stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>

                    <!-- 2段目：掲載情報と未掲載情報 -->
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

                    <!-- 矢印下 -->
                    <div class="arrow-down">
                        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 5 L20 30 M20 30 L13 23 M20 30 L27 23"
                                  stroke="#4ECDC4" stroke-width="3" fill="none"
                                  stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>

                    <!-- 3段目：URICOスタッフの活動 -->
                    <div class="flow-row">
                        <div class="flow-box urico">
                            <div class="flow-box-label">URICOスタッフが</div>
                            <div class="flow-box-text">各不動産会社へ直接ヒアリング<br>& マッチング判断</div>
                        </div>
                    </div>

                    <!-- 矢印下 -->
                    <div class="arrow-down">
                        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 5 L20 30 M20 30 L13 23 M20 30 L27 23"
                                  stroke="#FF6B6B" stroke-width="3" fill="none"
                                  stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>

                    <!-- 4段目：売主様へ -->
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
        const halfIndex = Math.floor(buyerCardsHTML.length / 2);
        const firstHalf = buyerCardsHTML.slice(0, halfIndex).join('');
        const secondHalf = buyerCardsHTML.slice(halfIndex).join('');
        cards.innerHTML = firstHalf + explainerHTML + secondHalf;
    }

    modal.classList.add('active');

    // スマホ用フッターを表示
    const footer = document.getElementById('buyerFooter');
    if (footer && window.innerWidth <= 768) {
        footer.style.display = 'block';
    }
};

window.closeModal = function() {
    document.getElementById('buyerModal')?.classList.remove('active');

    // スマホ用フッターを非表示
    const footer = document.getElementById('buyerFooter');
    if (footer) {
        footer.style.display = 'none';
    }
};

window.contactBuyer = function(buyerId) {
    window.location.href = 'https://form.run/@urico-kansai';
};

async function loadExternalData() {
    try {
        const [railwayRes, areaRes, townRes] = await Promise.all([
            fetch('./railway_data.json'),
            fetch('./area_data.json'),
            fetch('./area_town_data.json')
        ]);
        railwayData = await railwayRes.json();
        areaData = await areaRes.json();
        areaTownData = await townRes.json();
        initializeRailwaySelects('house');
        initializeRailwaySelects('land');
        initializeAreaSelects('house');
        initializeAreaSelects('land');
        initializeTownSelects('house');
        initializeTownSelects('land');

        // Initialize multi-railway selects for house and land
        initializeMultiRailwaySelects('house');
        initializeMultiRailwaySelects('land');

        // Setup toggle buttons for multi-railway sections
        setupRailwayToggles('house');
        setupRailwayToggles('land');
    } catch (error) {
        console.error('データの読み込みに失敗しました:', error);
    }
}

function initializeRailwaySelects(prefix) {
    const railwaySelect = document.getElementById(`${prefix}-railway`);
    if (!railwaySelect) return;
    railwaySelect.innerHTML = '<option value="">選択してください</option>';
    Object.keys(railwayData).forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        railwaySelect.appendChild(option);
    });
}

function setupSearchMethodToggle(prefix) {
    const stationBtn = document.getElementById(`${prefix}-method-station`);
    const areaBtn = document.getElementById(`${prefix}-method-area`);
    const stationSearch = document.getElementById(`${prefix}-station-search`);
    const areaSearch = document.getElementById(`${prefix}-area-search`);
    if (!stationBtn || !areaBtn) return;
    stationBtn.addEventListener('click', () => {
        stationBtn.classList.add('active');
        areaBtn.classList.remove('active');
        stationSearch.style.display = 'block';
        areaSearch.style.display = 'none';
        // エリア検索のプルダウンをクリア
        clearAreaSelects(prefix);
    });
    areaBtn.addEventListener('click', () => {
        areaBtn.classList.add('active');
        stationBtn.classList.remove('active');
        areaSearch.style.display = 'block';
        stationSearch.style.display = 'none';
        // 駅検索のプルダウンをクリア
        clearStationSelects(prefix);
    });
}

// エリア検索のプルダウンをクリア
function clearAreaSelects(prefix) {
    const prefSelect = document.getElementById(`${prefix}-prefecture`);
    const citySelect = document.getElementById(`${prefix}-city`);
    const townSelect = document.getElementById(`${prefix}-town`);

    if (prefSelect) prefSelect.value = '';
    if (citySelect) {
        citySelect.value = '';
        citySelect.innerHTML = '<option value="">先に都道府県を選択してください</option>';
        citySelect.disabled = true;
    }
    if (townSelect) {
        townSelect.value = '';
        townSelect.innerHTML = '<option value="">先に市区町村を選択してください</option>';
        townSelect.disabled = true;
    }
}

// 駅検索のプルダウンをクリア
function clearStationSelects(prefix) {
    // 第1路線をクリア
    for (let i = 1; i <= 3; i++) {
        const companySelect = document.getElementById(`${prefix}-railway${i}-company`);
        const lineSelect = document.getElementById(`${prefix}-railway${i}-line`);
        const stationSelect = document.getElementById(`${prefix}-railway${i}-station`);

        if (companySelect) companySelect.value = '';
        if (lineSelect) {
            lineSelect.value = '';
            lineSelect.innerHTML = '<option value="">選択してください</option>';
            lineSelect.disabled = true;
        }
        if (stationSelect) {
            stationSelect.value = '';
            stationSelect.innerHTML = '<option value="">先に沿線名を選択してください</option>';
            stationSelect.disabled = true;
        }
    }

    // 第2・第3路線のグループを閉じる
    const railway2Group = document.getElementById(`${prefix}-railway2-group`);
    const railway3Group = document.getElementById(`${prefix}-railway3-group`);
    const railway2Toggle = document.getElementById(`${prefix}-railway2-toggle`);
    const railway3Toggle = document.getElementById(`${prefix}-railway3-toggle`);
    const railway3ToggleWrapper = document.getElementById(`${prefix}-railway3-toggle-wrapper`);

    if (railway2Group) railway2Group.style.display = 'none';
    if (railway3Group) railway3Group.style.display = 'none';
    if (railway2Toggle) railway2Toggle.style.display = 'inline-block';
    if (railway3Toggle) railway3Toggle.style.display = 'inline-block';
    if (railway3ToggleWrapper) railway3ToggleWrapper.style.display = 'none';
}

function setup3TierRailwaySelect(prefix) {
    const railwaySelect = document.getElementById(`${prefix}-railway`);
    const lineSelect = document.getElementById(`${prefix}-line`);
    const stationSelect = document.getElementById(`${prefix}-station`);
    if (!railwaySelect || !lineSelect || !stationSelect) return;
    railwaySelect.addEventListener('change', () => {
        const company = railwaySelect.value;
        lineSelect.innerHTML = '<option value="">選択してください</option>';
        stationSelect.innerHTML = '<option value="">先に沿線名を選択してください</option>';
        stationSelect.disabled = true;
        if (company && railwayData[company]) {
            lineSelect.disabled = false;
            Object.keys(railwayData[company]).forEach(line => {
                const option = document.createElement('option');
                option.value = line;
                option.textContent = line;
                lineSelect.appendChild(option);
            });
        } else {
            lineSelect.disabled = true;
        }
    });
    lineSelect.addEventListener('change', () => {
        const company = railwaySelect.value;
        const line = lineSelect.value;
        stationSelect.innerHTML = '<option value="">選択してください</option>';
        if (company && line && railwayData[company][line]) {
            stationSelect.disabled = false;
            railwayData[company][line].forEach(station => {
                const option = document.createElement('option');
                option.value = station;
                option.textContent = station;
                stationSelect.appendChild(option);
            });
        } else {
            stationSelect.disabled = true;
        }
    });
}

// Initialize multi-railway selects (railway1, railway2, railway3)
function initializeMultiRailwaySelects(prefix) {
    for (let i = 1; i <= 3; i++) {
        const companySelect = document.getElementById(`${prefix}-railway${i}-company`);
        if (!companySelect) continue;

        // Populate company dropdown with railway data
        companySelect.innerHTML = '<option value="">選択してください</option>';
        Object.keys(railwayData).forEach(company => {
            const option = document.createElement('option');
            option.value = company;
            option.textContent = company;
            companySelect.appendChild(option);
        });

        // Setup 3-tier cascade for this railway section
        setup3TierMultiRailwaySelect(prefix, i);
    }
}

// Setup 3-tier cascade for a specific railway section
function setup3TierMultiRailwaySelect(prefix, railwayNumber) {
    const companySelect = document.getElementById(`${prefix}-railway${railwayNumber}-company`);
    const lineSelect = document.getElementById(`${prefix}-railway${railwayNumber}-line`);
    const stationSelect = document.getElementById(`${prefix}-railway${railwayNumber}-station`);

    if (!companySelect || !lineSelect || !stationSelect) return;

    // Company change event
    companySelect.addEventListener('change', () => {
        const company = companySelect.value;
        lineSelect.innerHTML = '<option value="">選択してください</option>';
        stationSelect.innerHTML = '<option value="">先に沿線名を選択してください</option>';
        stationSelect.disabled = true;

        if (company && railwayData[company]) {
            lineSelect.disabled = false;
            Object.keys(railwayData[company]).forEach(line => {
                const option = document.createElement('option');
                option.value = line;
                option.textContent = line;
                lineSelect.appendChild(option);
            });
        } else {
            lineSelect.disabled = true;
        }
    });

    // Line change event
    lineSelect.addEventListener('change', () => {
        const company = companySelect.value;
        const line = lineSelect.value;
        stationSelect.innerHTML = '<option value="">選択してください</option>';

        if (company && line && railwayData[company][line]) {
            stationSelect.disabled = false;
            railwayData[company][line].forEach(station => {
                const option = document.createElement('option');
                option.value = station;
                option.textContent = station;
                stationSelect.appendChild(option);
            });
        } else {
            stationSelect.disabled = true;
        }
    });
}

// Setup toggle buttons for multi-railway sections
function setupRailwayToggles(prefix) {
    const railway2Toggle = document.getElementById(`${prefix}-railway2-toggle`);
    const railway3Toggle = document.getElementById(`${prefix}-railway3-toggle`);
    const railway2Group = document.getElementById(`${prefix}-railway2-group`);
    const railway3Group = document.getElementById(`${prefix}-railway3-group`);
    const railway3ToggleWrapper = document.getElementById(`${prefix}-railway3-toggle-wrapper`);

    if (railway2Toggle && railway2Group && railway3ToggleWrapper) {
        railway2Toggle.addEventListener('click', () => {
            railway2Group.style.display = 'block';
            railway2Toggle.style.display = 'none';
            railway3ToggleWrapper.style.display = 'block';
        });
    }

    if (railway3Toggle && railway3Group) {
        railway3Toggle.addEventListener('click', () => {
            railway3Group.style.display = 'block';
            railway3Toggle.style.display = 'none';
        });
    }
}

// Global function to close railway sections
window.closeRailway = function(type, number) {
    const group = document.getElementById(`${type}-railway${number}-group`);
    const companySelect = document.getElementById(`${type}-railway${number}-company`);
    const lineSelect = document.getElementById(`${type}-railway${number}-line`);
    const stationSelect = document.getElementById(`${type}-railway${number}-station`);

    // Hide the railway group
    if (group) {
        group.style.display = 'none';
    }

    // Reset dropdown values
    if (companySelect) {
        companySelect.value = '';
    }
    if (lineSelect) {
        lineSelect.value = '';
        lineSelect.innerHTML = '<option value="">選択してください</option>';
        lineSelect.disabled = true;
    }
    if (stationSelect) {
        stationSelect.value = '';
        stationSelect.innerHTML = '<option value="">先に沿線名を選択してください</option>';
        stationSelect.disabled = true;
    }

    // Show the appropriate toggle button
    if (number === 2) {
        const toggle = document.getElementById(`${type}-railway2-toggle`);
        const railway3ToggleWrapper = document.getElementById(`${type}-railway3-toggle-wrapper`);
        if (toggle) {
            toggle.style.display = 'inline-block';
        }
        // Also close and reset railway3 when closing railway2
        if (railway3ToggleWrapper) {
            railway3ToggleWrapper.style.display = 'none';
        }
        closeRailway(type, 3);
    } else if (number === 3) {
        const toggle = document.getElementById(`${type}-railway3-toggle`);
        if (toggle) {
            toggle.style.display = 'inline-block';
        }
    }
};

function initializeAreaSelects(prefix) {
    const prefSelect = document.getElementById(`${prefix}-prefecture`);
    const citySelect = document.getElementById(`${prefix}-city`);
    if (!prefSelect || !citySelect) return;
    prefSelect.innerHTML = '<option value="">選択してください</option>';
    Object.keys(areaData).forEach(pref => {
        const option = document.createElement('option');
        option.value = pref;
        option.textContent = pref;
        prefSelect.appendChild(option);
    });
    prefSelect.addEventListener('change', () => {
        const selectedPref = prefSelect.value;
        citySelect.innerHTML = '<option value="">先に都道府県を選択してください</option>';
        citySelect.disabled = true;
        if (selectedPref && areaData[selectedPref]) {
            citySelect.innerHTML = '<option value="">選択してください</option>';
            areaData[selectedPref].forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
            citySelect.disabled = false;
        }
    });
}

function initializeTownSelects(prefix) {
    const prefSelect = document.getElementById(`${prefix}-prefecture`);
    const citySelect = document.getElementById(`${prefix}-city`);
    const townSelect = document.getElementById(`${prefix}-town`);

    if (!townSelect) return;

    // Initial state
    townSelect.innerHTML = '<option value="">先に市区町村を選択してください</option>';
    townSelect.disabled = true;

    // Update towns when city changes
    citySelect.addEventListener('change', () => {
        const selectedPref = prefSelect.value;
        const selectedCity = citySelect.value;

        townSelect.innerHTML = '<option value="">選択してください</option>';
        townSelect.disabled = true;

        if (selectedPref && selectedCity && areaTownData[selectedPref]?.[selectedCity]) {
            const towns = areaTownData[selectedPref][selectedCity];
            towns.forEach(town => {
                const option = document.createElement('option');
                option.value = town;
                option.textContent = town;
                townSelect.appendChild(option);
            });
            townSelect.disabled = false;
        }
    });
}

function initializeTabSwitching() {
    const tabs = document.querySelectorAll('.search-tabs button');
    console.log('タブボタン数:', tabs.length);
    
    if (tabs.length === 0) {
        console.error('タブボタンが見つかりません。HTMLを確認してください。');
        return;
    }
    
    const contents = {
        mansion: document.getElementById('tab-mansion'),
        house: document.getElementById('tab-house'),
        land: document.getElementById('tab-land'),
    };
    
    console.log('タブコンテンツ:', {
        mansion: !!contents.mansion,
        house: !!contents.house,
        land: !!contents.land
    });
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const selectedType = tab.id.replace('tab-', '').replace('-btn', '');
            console.log('タブがクリックされました:', selectedType);
            
            tabs.forEach(t => {
                const isSelected = (t === tab);
                t.classList.toggle('active', isSelected);
                t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            });
            Object.entries(contents).forEach(([key, element]) => {
                if (!element) {
                    console.warn(`タブコンテンツが見つかりません: ${key}`);
                    return;
                }
                element.style.display = (key === selectedType) ? 'block' : 'none';
            });
            updateStats(selectedType);
            const data = statsData[selectedType];
            if (data) {
                const heroTitle = document.getElementById('heroTitle');
                const statSuccessRate = document.getElementById('statSuccessRate');
                if (heroTitle) heroTitle.innerHTML = data.title;
                if (statSuccessRate) statSuccessRate.textContent = data.rate;
            }
        });
    });
}

function initializeMansionSearch() {
    const inputMansion = document.getElementById('searchInputMansion');
    const suggestionsMansion = document.getElementById('suggestionsMansion');
    
    console.log('マンション検索の初期化:', {
        input: !!inputMansion,
        suggestions: !!suggestionsMansion,
        databaseLength: mansionDatabase.length
    });
    
    if (!inputMansion || !suggestionsMansion) {
        console.error('マンション検索の要素が見つかりません:', {
            input: !inputMansion,
            suggestions: !suggestionsMansion
        });
        return;
    }
    inputMansion.addEventListener('input', () => {
        const query = inputMansion.value.toLowerCase();
        suggestionsMansion.innerHTML = '';
        if (query.length < 1) {
            suggestionsMansion.style.display = 'none';
            return;
        }
        const filtered = mansionDatabase
            .filter(m => (m.name || '').toLowerCase().includes(query))
            .slice(0, 10);
        if (filtered.length > 0) {
            filtered.forEach(mansion => {
                const item = document.createElement('div');
                item.classList.add('suggestion-item');
                item.innerHTML = `
                    <span class="mansion-name">${mansion.name}</span>
                    <span class="buyer-count">${(mansion.buyers || []).length}組</span>
                `;
                item.addEventListener('click', () => {
                    inputMansion.value = mansion.name;
                    suggestionsMansion.style.display = 'none';
                    showBuyerDetails(mansion.name);
                });
                suggestionsMansion.appendChild(item);
            });
            suggestionsMansion.style.display = 'block';
        } else {
            suggestionsMansion.style.display = 'none';
        }
    });
    document.getElementById('searchButtonMansion').addEventListener('click', () => {
        const mansionName = inputMansion.value.trim();
        if (mansionName) {
            const mansion = mansionDatabase.find(m =>
                (m.name || '').toLowerCase().includes(mansionName.toLowerCase())
            );
            if (mansion) {
                showBuyerDetails(mansion.name);
            } else {
                alert('該当するマンションが見つかりません。無料査定でお探しします。');
            }
        } else {
            alert('マンション名を入力してください。');
        }
    });
    inputMansion.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('searchButtonMansion').click();
        }
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            suggestionsMansion.style.display = 'none';
        }
    });
}

function initializeHouseSearch() {
    const searchButton = document.getElementById('searchButtonHouse');
    console.log('戸建検索ボタン:', searchButton);

    if (!searchButton) {
        console.error('戸建検索ボタンが見つかりません');
        return;
    }

    searchButton.addEventListener('click', () => {
        console.log('戸建検索ボタンがクリックされました');

        // エリア検索と駅検索のどちらが表示されているか確認
        const areaSearch = document.getElementById('house-area-search');
        const stationSearch = document.getElementById('house-station-search');
        const isAreaSearch = areaSearch && areaSearch.style.display !== 'none';
        const isStationSearch = stationSearch && stationSearch.style.display !== 'none';

        console.log('エリア検索:', isAreaSearch, '駅検索:', isStationSearch);

        if (isStationSearch) {
            // 駅から探す場合
            alert('駅から探す機能は近日公開予定です。現在は「エリアから探す」をご利用ください。');
            return;
        }

        // エリアから探す場合
        const pref = document.getElementById('house-prefecture')?.value.trim();
        const city = document.getElementById('house-city')?.value.trim();
        const town = document.getElementById('house-town')?.value.trim();

        console.log('選択された値:', {pref, city, town});

        if (!pref || !city || !town) {
            alert('都道府県、市区町村、町名を選択してください。');
            return;
        }

        // R2のHTMLページにリダイレクト
        const url = `https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev/house/${encodeURIComponent(pref)}/${encodeURIComponent(city)}/${encodeURIComponent(town)}.html`;
        console.log('リダイレクト先:', url);
        window.location.href = url;
    });

    console.log('戸建検索ボタンのイベントリスナー設定完了');
}

// Perform area search for house/land
async function performAreaSearch(type) {
    const pref = document.getElementById(`${type}-prefecture`)?.value.trim();
    const city = document.getElementById(`${type}-city`)?.value.trim();
    const town = document.getElementById(`${type}-town`)?.value.trim();

    // Get detail conditions
    const landArea = document.getElementById(`${type}-area-land-area`)?.value.trim();
    const walkingDistance = document.getElementById(`${type}-area-walking-distance`)?.value.trim();

    if (!pref || !city) {
        alert('都道府県と市区町村を選択してください。');
        return;
    }

    if (!town) {
        alert('町名・大字を選択してください。');
        return;
    }

    if (!landArea || !walkingDistance) {
        alert('土地面積と駅徒歩を選択してください。');
        return;
    }

    const jsonPath = `https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev/data/${type}/area/${encodeURIComponent(pref)}/${encodeURIComponent(city)}/${encodeURIComponent(town)}.json`;
    const searchLocation = `${pref} ${city} ${town}`;

    try {
        const response = await fetch(jsonPath);
        if (!response.ok) {
            throw new Error('ファイルが見つかりません');
        }
        const buyers = await response.json();

        if (!buyers || buyers.length === 0) {
            alert(`${searchLocation} に対応する${type === 'house' ? '戸建' : '土地'}の購入希望者は見つかりませんでした。`);
            return;
        }

        // Filter by land area and walking distance
        const filteredBuyers = filterBuyersByConditions(buyers, landArea, walkingDistance);

        if (filteredBuyers.length === 0) {
            alert(`指定された条件に合う購入希望者は見つかりませんでした。\n\n取得データ: ${buyers.length}件\nフィルタ後: 0件\n\n条件を変更してお試しください。`);
            return;
        }

        displayBuyerResults(filteredBuyers, `${searchLocation} の${type === 'house' ? '戸建' : '土地'}`, type);
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        alert(`${searchLocation} に対応する${type === 'house' ? '戸建' : '土地'}の購入希望者は見つかりませんでした。`);
    }
}

// Perform multi-railway station search for house/land
async function performMultiRailwaySearch(type) {
    // Get all railway selections
    const railways = [];
    for (let i = 1; i <= 3; i++) {
        const company = document.getElementById(`${type}-railway${i}-company`)?.value.trim();
        const line = document.getElementById(`${type}-railway${i}-line`)?.value.trim();
        const station = document.getElementById(`${type}-railway${i}-station`)?.value.trim();

        if (company && line && station) {
            railways.push({ company, line, station });
        }
    }

    // Validation: at least railway1 must be filled
    if (railways.length === 0) {
        alert('第1路線会社・沿線・駅を選択してください。');
        return;
    }

    try {
        // Fetch data from all selected stations
        const fetchPromises = railways.map(({ company, line, station }) => {
            const jsonPath = `https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev/data/${type}/station/${encodeURIComponent(company)}/${encodeURIComponent(line)}/${encodeURIComponent(station)}.json`;
            return fetch(jsonPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Station data not found: ${station}`);
                    }
                    return response.json();
                })
                .catch(error => {
                    console.warn(`Failed to fetch data for ${station}:`, error);
                    return [];
                });
        });

        const allStationBuyers = await Promise.all(fetchPromises);

        // Merge buyers from all stations and remove duplicates by ID
        const buyerMap = new Map();
        allStationBuyers.forEach(stationBuyers => {
            if (Array.isArray(stationBuyers)) {
                stationBuyers.forEach(buyer => {
                    if (buyer.id && !buyerMap.has(buyer.id)) {
                        buyerMap.set(buyer.id, buyer);
                    }
                });
            }
        });

        let mergedBuyers = Array.from(buyerMap.values());

        if (mergedBuyers.length === 0) {
            const stationNames = railways.map(r => r.station).join('・');
            alert(`${stationNames}周辺に対応する${type === 'house' ? '戸建' : '土地'}の購入希望者は見つかりませんでした。`);
            return;
        }

        console.log(`取得データ件数: ${mergedBuyers.length}件`);

        // Create title with station names
        const stationNames = railways.map(r => r.station).join('・');
        const title = `${stationNames}周辺の${type === 'house' ? '戸建' : '土地'}`;

        displayBuyerResults(mergedBuyers, title, type);
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        alert('データの読み込みに失敗しました。');
    }
}

// Filter buyers by land area and walking distance
function filterBuyersByConditions(buyers, landArea, walkingDistance) {
    return buyers.filter(buyer => {
        // Check land area condition
        const buyerLandArea = buyer.landArea || '';
        const landAreaMatch = checkLandAreaMatch(buyerLandArea, landArea);

        // Check walking distance condition
        const buyerWalkingDistance = buyer.walkingDistance || '';
        const walkingDistanceMatch = checkWalkingDistanceMatch(buyerWalkingDistance, walkingDistance);

        return landAreaMatch && walkingDistanceMatch;
    });
}

// Check if buyer's land area matches the selected condition
function checkLandAreaMatch(buyerLandArea, selectedLandArea) {
    if (!selectedLandArea) return true;
    if (!buyerLandArea || buyerLandArea === '特に希望なし') return true; // 希望なしの場合は全てマッチ

    // Normalize tildes (全角〜 to 半角~)
    const normalizedBuyerArea = buyerLandArea.replace(/〜/g, '~');
    const normalizedSelectedArea = selectedLandArea.replace(/〜/g, '~');

    // Extract numeric values from buyer's land area (e.g., "100㎡以上" -> 100)
    const buyerAreaMatch = normalizedBuyerArea.match(/(\d+)/);
    if (!buyerAreaMatch) return false;

    const buyerArea = parseInt(buyerAreaMatch[1]);

    // Parse selected land area (e.g., "100㎡以上", "100~150㎡", "150㎡以下")
    if (normalizedSelectedArea.includes('以上')) {
        const minArea = parseInt(normalizedSelectedArea.match(/(\d+)/)[1]);
        return buyerArea >= minArea;
    } else if (normalizedSelectedArea.includes('以下')) {
        const maxArea = parseInt(normalizedSelectedArea.match(/(\d+)/)[1]);
        return buyerArea <= maxArea;
    } else if (normalizedSelectedArea.includes('~')) {
        const matches = normalizedSelectedArea.match(/(\d+)~(\d+)/);
        if (!matches) return false;
        const min = parseInt(matches[1]);
        const max = parseInt(matches[2]);
        return buyerArea >= min && buyerArea <= max;
    } else {
        // Exact match
        return normalizedBuyerArea === normalizedSelectedArea;
    }
}

// Check if buyer's walking distance matches the selected condition
function checkWalkingDistanceMatch(buyerWalkingDistance, selectedWalkingDistance) {
    if (!selectedWalkingDistance) return true;
    if (!buyerWalkingDistance || buyerWalkingDistance === '特に希望なし') return true; // 希望なしの場合は全てマッチ

    // Extract numeric values from buyer's walking distance (e.g., "駅徒歩10分以内" -> 10)
    const buyerDistanceMatch = buyerWalkingDistance.match(/(\d+)/);
    if (!buyerDistanceMatch) return false;

    const buyerDistance = parseInt(buyerDistanceMatch[1]);

    // Parse selected walking distance (e.g., "駅徒歩10分以内", "駅徒歩11〜15分")
    const selectedDistanceMatch = selectedWalkingDistance.match(/(\d+)/);
    if (!selectedDistanceMatch) return false;

    const selectedDistance = parseInt(selectedDistanceMatch[1]);

    // If buyer wants "21分以上", match with any selected distance
    if (buyerWalkingDistance.includes('以上')) {
        return true;
    }

    // If selected is a range (e.g., "11〜15分"), check if buyer is within or below
    if (selectedWalkingDistance.includes('〜')) {
        const rangeMatch = selectedWalkingDistance.match(/(\d+)〜(\d+)/);
        if (rangeMatch) {
            const min = parseInt(rangeMatch[1]);
            const max = parseInt(rangeMatch[2]);
            return buyerDistance <= max;
        }
    }

    // Standard comparison: buyer's requirement should be within selected distance
    return buyerDistance <= selectedDistance;
}

// Display buyer results in modal
function displayBuyerResults(buyers, title, type) {
    const modal = document.getElementById('buyerModal');
    const titleEl = document.getElementById('modalTitle');
    const subtitle = document.getElementById('modalSubtitle');
    const cards = document.getElementById('buyerCards');

    if (titleEl) titleEl.textContent = title;
    if (subtitle) subtitle.textContent = `購入希望者 ${buyers.length}件`;

    if (cards) {
        const totalBuyers = buyers.length;
        const sortedBuyers = sortBuyersByBadges(buyers, type);

        cards.innerHTML = sortedBuyers.map(({ buyer: b, originalIndex }, displayIdx) => {
            const displayTiming = normalizeTimingLabel(b.timing || '-');
            const badges = renderBuyerBadges(type, originalIndex, totalBuyers, displayTiming);
            const highlightClass = hasBothBadges(type, originalIndex, totalBuyers, displayTiming) ? ' highlight-card' : '';

            // Build buyer info rows based on type
            let infoRows = `
                <div class="buyer-info-row">
                    <span class="buyer-info-label">家族構成</span>
                    <span class="buyer-info-value">${b.family || '-'}</span>
                </div>
                <div class="buyer-info-row">
                    <span class="buyer-info-label">年齢</span>
                    <span class="buyer-info-value">${b.age || '-'}</span>
                </div>
                <div class="buyer-info-row">
                    <span class="buyer-info-label">職業</span>
                    <span class="buyer-info-value">${b.occupation || '-'}</span>
                </div>
                <div class="buyer-info-row">
                    <span class="buyer-info-label">購入時期</span>
                    <span class="buyer-info-value">${displayTiming}</span>
                </div>
                <div class="buyer-info-row">
                    <span class="buyer-info-label">購入方法</span>
                    <span class="buyer-info-value">${b.method || '-'}</span>
                </div>
                <div class="buyer-info-row">
                    <span class="buyer-info-label">購入理由</span>
                    <span class="buyer-info-value">${b.reason || '-'}</span>
                </div>
            `;

            if (type === 'house') {
                infoRows += `
                    <div class="buyer-info-row">
                        <span class="buyer-info-label">希望築年数</span>
                        <span class="buyer-info-value">${b.buildingAge || '-'}</span>
                    </div>
                    <div class="buyer-info-row">
                        <span class="buyer-info-label">希望間取り</span>
                        <span class="buyer-info-value">${b.layout || '-'}</span>
                    </div>
                `;
            } else if (type === 'land') {
                infoRows += `
                    <div class="buyer-info-row">
                        <span class="buyer-info-label">利用目的</span>
                        <span class="buyer-info-value">${b.purpose || '-'}</span>
                    </div>
                `;
            }

            infoRows += `
                <div class="buyer-info-row">
                    <span class="buyer-info-label">希望土地面積</span>
                    <span class="buyer-info-value">${b.landArea || '-'}</span>
                </div>
                <div class="buyer-info-row">
                    <span class="buyer-info-label">駅徒歩</span>
                    <span class="buyer-info-value">${b.walkingDistance || '-'}</span>
                </div>
                <div class="buyer-info-row ng-row" style="grid-column: 1 / -1;">
                    <span class="buyer-info-label">NG条件</span>
                    <span class="buyer-info-value">${b.ng || '特になし'}</span>
                </div>
            `;

            return `
                <div class="buyer-block${highlightClass}">
                    <div class="buyer-block-header">
                        <span class="buyer-number">購入希望者 #${displayIdx + 1}</span>
                        ${badges}
                    </div>
                    <div class="buyer-info-table">
                        ${infoRows}
                    </div>
                    <div class="buyer-action">
                        <button class="contact-buyer-btn" onclick="contactBuyer(${displayIdx})">この購入希望者を紹介してほしい</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    modal.classList.add('active');

    const footer = document.getElementById('buyerFooter');
    if (footer && window.innerWidth <= 768) {
        footer.style.display = 'block';
    }
}

function initializeLandSearch() {
    const searchButton = document.getElementById('searchButtonLand');
    console.log('土地検索ボタン:', searchButton);

    if (!searchButton) {
        console.error('土地検索ボタンが見つかりません');
        return;
    }

    searchButton.addEventListener('click', () => {
        console.log('土地検索ボタンがクリックされました');

        // エリア検索と駅検索のどちらが表示されているか確認
        const areaSearch = document.getElementById('land-area-search');
        const stationSearch = document.getElementById('land-station-search');
        const isAreaSearch = areaSearch && areaSearch.style.display !== 'none';
        const isStationSearch = stationSearch && stationSearch.style.display !== 'none';

        console.log('エリア検索:', isAreaSearch, '駅検索:', isStationSearch);

        if (isStationSearch) {
            // 駅から探す場合
            alert('駅から探す機能は近日公開予定です。現在は「エリアから探す」をご利用ください。');
            return;
        }

        // エリアから探す場合
        const pref = document.getElementById('land-prefecture')?.value.trim();
        const city = document.getElementById('land-city')?.value.trim();
        const town = document.getElementById('land-town')?.value.trim();

        console.log('選択された値:', {pref, city, town});

        if (!pref || !city || !town) {
            alert('都道府県、市区町村、町名を選択してください。');
            return;
        }

        // R2のHTMLページにリダイレクト
        const url = `https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev/land/${encodeURIComponent(pref)}/${encodeURIComponent(city)}/${encodeURIComponent(town)}.html`;
        console.log('リダイレクト先:', url);
        window.location.href = url;
    });

    console.log('土地検索ボタンのイベントリスナー設定完了');
}

// 画像スライダー初期化
function initializeImageSlider() {
    const slider = document.getElementById('imageSlider');
    if (!slider) return;

    let currentIndex = 0;
    let autoSlideInterval;
    let isUserScrolling = false;
    let scrollTimeout;
    const images = slider.querySelectorAll('.slider-image');
    const totalImages = images.length;
    const slideWidth = window.innerWidth;

    // 自動スライド関数
    function autoSlide() {
        if (isUserScrolling) return;

        currentIndex = (currentIndex + 1) % totalImages;
        slider.scrollTo({
            left: currentIndex * slideWidth,
            behavior: 'smooth'
        });
    }

    // 自動スライド開始
    function startAutoSlide() {
        autoSlideInterval = setInterval(autoSlide, 5000);
    }

    // 自動スライド停止
    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    // スクロール位置から現在のインデックスを計算
    function updateCurrentIndex() {
        const scrollLeft = slider.scrollLeft;
        currentIndex = Math.round(scrollLeft / slideWidth);
    }

    // ユーザーがスクロールしているか検知
    slider.addEventListener('scroll', () => {
        isUserScrolling = true;
        clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(() => {
            isUserScrolling = false;
            updateCurrentIndex();
            startAutoSlide();
        }, 1000);

        stopAutoSlide();
    });

    // タッチ/マウス操作の検知
    let isInteracting = false;
    slider.addEventListener('touchstart', () => {
        isInteracting = true;
        stopAutoSlide();
    });

    slider.addEventListener('touchend', () => {
        setTimeout(() => {
            isInteracting = false;
            updateCurrentIndex();
            startAutoSlide();
        }, 1000);
    });

    slider.addEventListener('mousedown', () => {
        isInteracting = true;
        stopAutoSlide();
    });

    slider.addEventListener('mouseup', () => {
        setTimeout(() => {
            isInteracting = false;
            updateCurrentIndex();
            startAutoSlide();
        }, 1000);
    });

    // ウィンドウリサイズ時の処理
    window.addEventListener('resize', () => {
        const newSlideWidth = window.innerWidth;
        slider.scrollTo({
            left: currentIndex * newSlideWidth,
            behavior: 'auto'
        });
    });

    // 初期化
    startAutoSlide();
}

// 売却費用シミュレーター初期化
function initializeSimulator() {
    const sellPriceSlider = document.getElementById('sell-price');
    const sellPriceVal = document.getElementById('sell-price-val');
    const feeResult = document.getElementById('fee-result');
    const registryResult = document.getElementById('registry-result');
    const stampResult = document.getElementById('stamp-result');
    const totalResult = document.getElementById('total-result');

    if (!sellPriceSlider) return;

    function calcBrokerageFee(priceMan) {
        const price = priceMan * 10000;
        let fee = 0;

        if (price <= 2000000) {
            fee = price * 0.05;
        } else if (price <= 4000000) {
            fee = price * 0.04 + 20000;
        } else {
            fee = price * 0.03 + 60000;
        }

        return Math.floor(fee * 1.1);
    }

    function calcStampDuty(priceMan) {
        const price = priceMan * 10000;

        if (price <= 1000000) return 500;
        if (price <= 5000000) return 1000;
        if (price <= 10000000) return 5000;
        if (price <= 50000000) return 10000;
        if (price <= 100000000) return 30000;
        if (price <= 500000000) return 60000;
        if (price <= 1000000000) return 160000;
        return 320000;
    }

    function formatMoney(yen) {
        if (yen >= 10000) {
            const man = Math.floor(yen / 10000);
            const remainder = yen % 10000;
            if (remainder === 0) {
                return man.toLocaleString() + '万円';
            } else {
                return man.toLocaleString() + '万' + remainder.toLocaleString() + '円';
            }
        }
        return yen.toLocaleString() + '円';
    }

    function updateCalculation() {
        const priceMan = parseInt(sellPriceSlider.value);
        sellPriceVal.textContent = priceMan.toLocaleString();

        const fee = calcBrokerageFee(priceMan);
        feeResult.textContent = formatMoney(fee);

        registryResult.textContent = '約6万円';

        const stamp = calcStampDuty(priceMan);
        stampResult.textContent = formatMoney(stamp);

        const total = fee + 60000 + stamp;

        totalResult.textContent = '約' + formatMoney(total);
    }

    sellPriceSlider.addEventListener('input', updateCalculation);
    updateCalculation();
}

// ========================================
// グローバル検索関数（onclick用）
// ========================================

// 戸建検索
window.searchHouse = function() {
    console.log('★ searchHouse() 呼び出し');

    // 駅検索とエリア検索のどちらが選択されているかをボタンのactiveクラスで確認
    const stationBtn = document.getElementById('house-method-station');
    const areaBtn = document.getElementById('house-method-area');
    const isStationSearch = stationBtn && stationBtn.classList.contains('active');
    const isAreaSearch = areaBtn && areaBtn.classList.contains('active');

    console.log('検索モード - 駅検索:', isStationSearch, 'エリア検索:', isAreaSearch);

    if (isStationSearch) {
        // 駅から探す場合 - HTMLページにリダイレクト
        const company = document.getElementById('house-railway1-company')?.value?.trim();
        const line = document.getElementById('house-railway1-line')?.value?.trim();
        const station = document.getElementById('house-railway1-station')?.value?.trim();

        console.log('駅選択値:', { company, line, station });

        if (!company || !line || !station) {
            alert('第1路線会社・沿線・駅を選択してください。');
            return;
        }

        const url = `https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev/house/station/${encodeURIComponent(company)}/${encodeURIComponent(line)}/${encodeURIComponent(station)}.html`;
        console.log('リダイレクト先:', url);
        window.location.href = url;
    } else if (isAreaSearch) {
        // エリアから探す場合
        const pref = document.getElementById('house-prefecture')?.value?.trim();
        const city = document.getElementById('house-city')?.value?.trim();
        const town = document.getElementById('house-town')?.value?.trim();

        console.log('選択値:', { pref, city, town });

        if (!pref || !city || !town) {
            alert('都道府県、市区町村、町名・大字を選択してください。');
            return;
        }

        const url = `https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev/house/${encodeURIComponent(pref)}/${encodeURIComponent(city)}/${encodeURIComponent(town)}.html`;
        console.log('リダイレクト先:', url);
        window.location.href = url;
    }
};

// 土地検索
window.searchLand = function() {
    console.log('★ searchLand() 呼び出し');

    // 駅検索とエリア検索のどちらが選択されているかをボタンのactiveクラスで確認
    const stationBtn = document.getElementById('land-method-station');
    const areaBtn = document.getElementById('land-method-area');
    const isStationSearch = stationBtn && stationBtn.classList.contains('active');
    const isAreaSearch = areaBtn && areaBtn.classList.contains('active');

    console.log('検索モード - 駅検索:', isStationSearch, 'エリア検索:', isAreaSearch);

    if (isStationSearch) {
        // 駅から探す場合 - HTMLページにリダイレクト
        const company = document.getElementById('land-railway1-company')?.value?.trim();
        const line = document.getElementById('land-railway1-line')?.value?.trim();
        const station = document.getElementById('land-railway1-station')?.value?.trim();

        console.log('駅選択値:', { company, line, station });

        if (!company || !line || !station) {
            alert('第1路線会社・沿線・駅を選択してください。');
            return;
        }

        const url = `https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev/land/station/${encodeURIComponent(company)}/${encodeURIComponent(line)}/${encodeURIComponent(station)}.html`;
        console.log('リダイレクト先:', url);
        window.location.href = url;
    } else if (isAreaSearch) {
        // エリアから探す場合
        const pref = document.getElementById('land-prefecture')?.value?.trim();
        const city = document.getElementById('land-city')?.value?.trim();
        const town = document.getElementById('land-town')?.value?.trim();

        console.log('選択値:', { pref, city, town });

        if (!pref || !city || !town) {
            alert('都道府県、市区町村、町名・大字を選択してください。');
            return;
        }

        const url = `https://pub-33a8cdb0bae74d03a613bc5cffe0a843.r2.dev/land/${encodeURIComponent(pref)}/${encodeURIComponent(city)}/${encodeURIComponent(town)}.html`;
        console.log('リダイレクト先:', url);
        window.location.href = url;
    }
};

console.log('★ グローバル検索関数を登録完了: searchHouse, searchLand');
