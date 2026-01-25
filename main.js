// データベースをインポート
import { MANSION_DB } from './mansion_db.js';
import { HOUSE_DB } from './house_db.js';
import { LAND_DB } from './land_db.js';

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
        console.log('HOUSE_DB:', typeof HOUSE_DB, Array.isArray(HOUSE_DB) ? HOUSE_DB.length : 'N/A');
        console.log('LAND_DB:', typeof LAND_DB, Array.isArray(LAND_DB) ? LAND_DB.length : 'N/A');
        
        mansionDatabase = MANSION_DB || [];
        houseDatabase = HOUSE_DB || [];
        landDatabase = LAND_DB || [];
        
        console.log('読み込まれたマンション数:', mansionDatabase.length);
        console.log('読み込まれた戸建数:', houseDatabase.length);
        console.log('読み込まれた土地数:', landDatabase.length);
        
        if (mansionDatabase.length === 0 && houseDatabase.length === 0 && landDatabase.length === 0) {
            console.error('警告: データベースが空です。データファイルを確認してください。');
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
        initializeHouseSearch();
        initializeLandSearch();
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
        // 戸建は購入希望者ベース（各要素が購入希望者）
        totalBuyers = database.length;
        // 対応物件数 = 5府県の町名・大字の総計（19,322）
        totalProperties = 19322;
    } else if (type === 'land') {
        database = landDatabase;
        // 土地は購入希望者ベース（各要素が購入希望者）
        totalBuyers = database.length;
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
        cards.innerHTML = sortedBuyers.map(({ buyer: b, originalIndex }, displayIdx) => {
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
        `}).join('');
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
    });
    areaBtn.addEventListener('click', () => {
        areaBtn.classList.add('active');
        stationBtn.classList.remove('active');
        areaSearch.style.display = 'block';
        stationSearch.style.display = 'none';
    });
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

        townSelect.innerHTML = '<option value="">全域（町名指定なし）</option>';
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
    const form = document.getElementById('tab-house');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const pref = document.getElementById('house-prefecture').value.trim();
        const city = document.getElementById('house-city').value.trim();
        const town = document.getElementById('house-town').value.trim();
        const railway = document.getElementById('house-railway').value.trim();
        const line = document.getElementById('house-line').value.trim();
        const station = document.getElementById('house-station').value.trim();

        let jsonPath = '';
        let searchLocation = '';

        // エリア検索
        if (pref && city) {
            jsonPath = `./data/house/area/${encodeURIComponent(pref)}/${encodeURIComponent(city)}.json`;
            searchLocation = town ? `${pref} ${city} ${town}` : `${pref} ${city}`;
        }
        // 駅検索
        else if (railway && station) {
            jsonPath = `./data/house/station/${encodeURIComponent(railway)}/${encodeURIComponent(line)}/${encodeURIComponent(station)}.json`;
            searchLocation = `${railway} ${line} ${station}`;
        } else {
            alert('都道府県と市区町村、または路線会社名と駅名を選択してください。');
            return;
        }

        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error('ファイルが見つかりません');
            }
            const buyers = await response.json();

            if (!buyers || buyers.length === 0) {
                alert(`${searchLocation} に対応する戸建の購入希望者は見つかりませんでした。`);
                return;
            }

            const modal = document.getElementById('buyerModal');
            const title = document.getElementById('modalTitle');
            const subtitle = document.getElementById('modalSubtitle');
            const cards = document.getElementById('buyerCards');

            if (title) title.textContent = `${searchLocation} の戸建`;
            if (subtitle) subtitle.textContent = `購入希望者 ${buyers.length}件`;

            if (cards) {
                const totalBuyers = buyers.length;
                const sortedBuyers = sortBuyersByBadges(buyers, 'house');

                cards.innerHTML = sortedBuyers.map(({ buyer: b, originalIndex }, displayIdx) => {
                    const displayTiming = normalizeTimingLabel(b.timing || '-');
                    const badges = renderBuyerBadges('house', originalIndex, totalBuyers, displayTiming);

                    // 急ぎ＋新着の両方がある場合にハイライトクラスを付与
                    const highlightClass = hasBothBadges('house', originalIndex, totalBuyers, displayTiming) ? ' highlight-card' : '';

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
                            <div class="buyer-info-row">
                                <span class="buyer-info-label">希望築年数</span>
                                <span class="buyer-info-value">${b.buildingAge || '-'}</span>
                            </div>
                            <div class="buyer-info-row">
                                <span class="buyer-info-label">希望間取り</span>
                                <span class="buyer-info-value">${b.layout || '-'}</span>
                            </div>
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
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            alert(`${searchLocation} に対応する戸建の購入希望者は見つかりませんでした。`);
        }
    });
}

function initializeLandSearch() {
    const form = document.getElementById('tab-land');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const pref = document.getElementById('land-prefecture').value.trim();
        const city = document.getElementById('land-city').value.trim();
        const town = document.getElementById('land-town').value.trim();
        const railway = document.getElementById('land-railway').value.trim();
        const line = document.getElementById('land-line').value.trim();
        const station = document.getElementById('land-station').value.trim();

        let jsonPath = '';
        let searchLocation = '';

        // エリア検索
        if (pref && city) {
            jsonPath = `./data/land/area/${encodeURIComponent(pref)}/${encodeURIComponent(city)}.json`;
            searchLocation = town ? `${pref} ${city} ${town}` : `${pref} ${city}`;
        }
        // 駅検索
        else if (railway && station) {
            jsonPath = `./data/land/station/${encodeURIComponent(railway)}/${encodeURIComponent(line)}/${encodeURIComponent(station)}.json`;
            searchLocation = `${railway} ${line} ${station}`;
        } else {
            alert('都道府県と市区町村、または路線会社名と駅名を選択してください。');
            return;
        }

        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error('ファイルが見つかりません');
            }
            const buyers = await response.json();

            if (!buyers || buyers.length === 0) {
                alert(`${searchLocation} に対応する土地の購入希望者は見つかりませんでした。`);
                return;
            }

            const modal = document.getElementById('buyerModal');
            const title = document.getElementById('modalTitle');
            const subtitle = document.getElementById('modalSubtitle');
            const cards = document.getElementById('buyerCards');

            if (title) title.textContent = `${searchLocation} の土地`;
            if (subtitle) subtitle.textContent = `購入希望者 ${buyers.length}件`;

            if (cards) {
                const totalBuyers = buyers.length;
                const sortedBuyers = sortBuyersByBadges(buyers, 'land');

                cards.innerHTML = sortedBuyers.map(({ buyer: b, originalIndex }, displayIdx) => {
                    const displayTiming = normalizeTimingLabel(b.timing || '-');
                    const badges = renderBuyerBadges('land', originalIndex, totalBuyers, displayTiming);

                    // 急ぎ＋新着の両方がある場合にハイライトクラスを付与
                    const highlightClass = hasBothBadges('land', originalIndex, totalBuyers, displayTiming) ? ' highlight-card' : '';

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
                            <div class="buyer-info-row">
                                <span class="buyer-info-label">利用目的</span>
                                <span class="buyer-info-value">${b.purpose || '-'}</span>
                            </div>
                            <div class="buyer-info-row">
                                <span class="buyer-info-label">希望土地面積</span>
                                <span class="buyer-info-value">${b.landArea || '-'}</span>
                            </div>
                            <div class="buyer-info-row">
                                <span class="buyer-info-label">駅徒歩</span>
                                <span class="buyer-info-value">${b.walkingDistance || '-'}</span>
                            </div>
                            <div class="buyer-info-row">
                                <span class="buyer-info-label">NG条件</span>
                                <span class="buyer-info-value">${b.ng || '-'}</span>
                            </div>
                            <div class="buyer-info-row">
                                <span class="buyer-info-label">ID</span>
                                <span class="buyer-info-value">${b.id || '-'}</span>
                            </div>
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
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            alert(`${searchLocation} に対応する土地の購入希望者は見つかりませんでした。`);
        }
    });
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

        registryResult.textContent = '約3〜6万円';

        const stamp = calcStampDuty(priceMan);
        stampResult.textContent = formatMoney(stamp);

        const totalMin = fee + 30000 + stamp;
        const totalMax = fee + 60000 + stamp;

        totalResult.textContent = '約' + formatMoney(totalMin) + '〜' + formatMoney(totalMax);
    }

    sellPriceSlider.addEventListener('input', updateCalculation);
    updateCalculation();
}
