#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// フィルタリングUIのHTML
const filterUI = `
    <!-- フィルタリングUI -->
    <div class="container" style="margin-bottom: 1rem;">
        <div style="background: white; border-radius: 10px; padding: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
            <h3 style="color: #667eea; margin-bottom: 1rem; font-size: 1.2rem;">🔍 条件で絞り込む</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #666; font-weight: 500;">土地面積</label>
                    <select id="filterLandArea" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px; font-size: 0.9rem;">
                        <option value="">すべて</option>
                        <option value="〜50㎡">〜50㎡</option>
                        <option value="51〜150㎡">51〜150㎡</option>
                        <option value="151〜300㎡">151〜300㎡</option>
                        <option value="301㎡以上">301㎡以上</option>
                    </select>
                </div>
            </div>
            <div id="filterResult" style="margin-top: 1rem; color: #667eea; font-weight: 600;"></div>
        </div>
    </div>
`;

// フィルタリングJavaScript
const filterScript = `
    <script>
        (function() {
            const cards = Array.from(document.querySelectorAll('.buyer-card'));
            const filterLandArea = document.getElementById('filterLandArea');
            const filterResult = document.getElementById('filterResult');

            function applyFilters() {
                const selectedLandArea = filterLandArea.value;

                let visibleCount = 0;

                cards.forEach(card => {
                    // より正確な検索のために、すべての情報行を取得
                    const infoRows = card.querySelectorAll('.info-row');
                    let cardLandArea = '';

                    infoRows.forEach(row => {
                        const label = row.querySelector('.label')?.textContent || '';
                        const value = row.querySelector('.value')?.textContent || '';
                        if (label.includes('土地面積')) cardLandArea = value;
                    });

                    let showCard = true;

                    // 土地面積フィルター
                    if (selectedLandArea && cardLandArea && cardLandArea !== '特に希望なし') {
                        showCard = matchesCondition(cardLandArea, selectedLandArea);
                    }

                    card.style.display = showCard ? 'block' : 'none';
                    if (showCard) visibleCount++;
                });

                filterResult.textContent = \`\${visibleCount}件の購入希望者が見つかりました\`;
            }

            function matchesCondition(buyerValue, selectedValue) {
                // 購入希望者の値から数値を抽出
                const buyerMatch = buyerValue.match(/(\\d+)/);
                if (!buyerMatch) return false;
                const buyerArea = parseInt(buyerMatch[1]);

                // 選択された条件を解析
                if (selectedValue === '〜50㎡') {
                    return buyerArea <= 50;
                } else if (selectedValue === '51〜150㎡') {
                    return buyerArea >= 51 && buyerArea <= 150;
                } else if (selectedValue === '151〜300㎡') {
                    return buyerArea >= 151 && buyerArea <= 300;
                } else if (selectedValue === '301㎡以上') {
                    return buyerArea >= 301;
                }
                return true;
            }

            filterLandArea.addEventListener('change', applyFilters);

            // 初期表示
            filterResult.textContent = \`\${cards.length}件の購入希望者が見つかりました\`;
        })();
    </script>
`;

// HTMLファイルを更新する関数
function updateHTMLFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf-8');

        // すでにフィルタリングUIが追加されている場合はスキップ
        if (content.includes('id="filterLandArea"')) {
            return { success: true, skipped: true };
        }

        // <div class="container">の最初の出現箇所の前にフィルタUIを挿入
        const containerMatch = content.match(/(<div class="container">)/);
        if (containerMatch) {
            const insertIndex = content.indexOf(containerMatch[1]);
            content = content.slice(0, insertIndex) + filterUI + content.slice(insertIndex);
        }

        // </body>の前にJavaScriptを挿入
        content = content.replace('</body>', filterScript + '\n</body>');

        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true, skipped: false };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ディレクトリ内のすべてのHTMLファイルを再帰的に処理
function processDirectory(dirPath, stats) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath, stats);
        } else if (file.endsWith('.html')) {
            const result = updateHTMLFile(fullPath);
            if (result.success) {
                if (result.skipped) {
                    stats.skipped++;
                } else {
                    stats.updated++;
                }
            } else {
                stats.failed++;
                console.error(`Failed: ${fullPath} - ${result.error}`);
            }

            // 進捗表示
            if ((stats.updated + stats.skipped + stats.failed) % 100 === 0) {
                console.log(`Progress: ${stats.updated} updated, ${stats.skipped} skipped, ${stats.failed} failed`);
            }
        }
    }
}

// メイン処理
function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('Usage: node add-filter-ui.js <directory>');
        console.log('Example: node add-filter-ui.js public/house');
        process.exit(1);
    }

    const targetDir = args[0];
    if (!fs.existsSync(targetDir)) {
        console.error(`Directory not found: ${targetDir}`);
        process.exit(1);
    }

    const stats = { updated: 0, skipped: 0, failed: 0 };
    const startTime = Date.now();

    console.log(`Processing directory: ${targetDir}`);
    processDirectory(targetDir, stats);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n=== Complete ===');
    console.log(`Updated: ${stats.updated} files`);
    console.log(`Skipped: ${stats.skipped} files`);
    console.log(`Failed: ${stats.failed} files`);
    console.log(`Duration: ${duration} seconds`);
}

main();
