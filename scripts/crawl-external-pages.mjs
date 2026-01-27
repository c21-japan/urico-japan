import { request } from 'undici';
import * as cheerio from 'cheerio';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pLimit from 'p-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data', 'sources', 'external');
const PAGES_DIR = join(DATA_DIR, 'pages');
const CONCURRENCY = 1; // 順次処理（並列なし）
const PAGE_DELAY = 6000; // 各ページ間隔: 6秒
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  Fetching: ${url} (attempt ${i + 1}/${retries})`);

      const { statusCode, body } = await request(url, {
        headers: {
          'User-Agent': 'URICO Research Bot (for FAQ generation)',
        },
        headersTimeout: 10000,
        bodyTimeout: 10000,
      });

      if (statusCode === 429 || statusCode === 503) {
        const backoff = Math.pow(2, i) * 1000;
        console.log(`  Rate limited (${statusCode}), waiting ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }

      if (statusCode !== 200) {
        throw new Error(`Status ${statusCode}`);
      }

      let html = '';
      for await (const chunk of body) {
        html += chunk.toString();
      }

      return html;
    } catch (err) {
      console.warn(`  Attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        throw err;
      }
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}

function extractMainContent(html) {
  const $ = cheerio.load(html);

  // タイトル取得
  const title = $('title').text().trim() || $('h1').first().text().trim();
  const h1 = $('h1').first().text().trim();

  // 本文抽出
  let mainElement = $('main');
  if (mainElement.length === 0) {
    mainElement = $('article');
  }
  if (mainElement.length === 0) {
    // header, nav, footer, aside を除去
    $('header, nav, footer, aside, script, style, noscript').remove();
    mainElement = $('body');
  }

  // 見出し構造を抽出
  const headings = [];
  mainElement.find('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const level = el.name;
    const text = $(el).text().trim();
    if (text) {
      headings.push({ level, text });
    }
  });

  // テキスト抽出
  const text = mainElement.text().replace(/\s+/g, ' ').trim();

  // 最小限のHTMLを保持（見出しと段落のみ）
  const minimalHtml = mainElement
    .find('h1, h2, h3, h4, h5, h6, p')
    .map((_, el) => $.html(el))
    .get()
    .join('\n');

  return {
    title,
    h1,
    text,
    headings,
    minimalHtml,
  };
}

function urlToSlug(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.replace(/^\/|\/$/g, '');
    return pathname.replace(/\//g, '_') || 'index';
  } catch {
    return 'unknown';
  }
}

async function processPage(link) {
  const slug = urlToSlug(link.url);
  const outputPath = join(PAGES_DIR, `${slug}.json`);

  try {
    const html = await fetchWithRetry(link.url);
    const content = extractMainContent(html);

    const pageData = {
      url: link.url,
      text: link.text,
      fetchedAt: new Date().toISOString(),
      ...content,
    };

    await writeFile(outputPath, JSON.stringify(pageData, null, 2));
    console.log(`  ✓ Saved: ${slug}.json`);

    return { success: true, slug };
  } catch (err) {
    console.error(`  ✗ Failed to process ${link.url}:`, err.message);
    return { success: false, slug, error: err.message };
  }
}

// サンプルページデータを生成（実サイトにアクセスできない場合用）
function generateSamplePageData(link) {
  const slug = urlToSlug(link.url);
  const sampleContent = {
    'guide_selling-flow': {
      title: '不動産売却の流れ｜いくら不動産',
      h1: '不動産売却の流れ',
      headings: [
        { level: 'h1', text: '不動産売却の流れ' },
        { level: 'h2', text: '1. 査定依頼' },
        { level: 'h2', text: '2. 媒介契約' },
        { level: 'h2', text: '3. 売却活動' },
        { level: 'h2', text: '4. 契約・引き渡し' },
      ],
      text: '不動産売却の流れを4つのステップで解説します。まずは査定依頼から始めます。複数の不動産会社に査定を依頼し、適正な価格を把握することが重要です。次に、媒介契約を締結します。専任媒介、専属専任媒介、一般媒介の3種類があり、それぞれメリット・デメリットがあります。売却活動では、広告掲載や内覧対応を行います。最後に、買主が決まったら売買契約を締結し、引き渡しを行います。',
    },
    'guide_price-assessment': {
      title: '不動産査定について｜いくら不動産',
      h1: '不動産査定について',
      headings: [
        { level: 'h1', text: '不動産査定について' },
        { level: 'h2', text: '査定の種類' },
        { level: 'h2', text: '査定で見られるポイント' },
        { level: 'h2', text: '査定額の決まり方' },
      ],
      text: '不動産査定には机上査定と訪問査定の2種類があります。机上査定は物件情報のみで概算を算出し、訪問査定は実際に物件を見て詳細な査定額を出します。査定では立地、築年数、間取り、設備状態、周辺環境などが評価されます。複数社に査定依頼することで、適正価格を把握しやすくなります。',
    },
    'guide_contract-types': {
      title: '媒介契約の種類｜いくら不動産',
      h1: '媒介契約とは',
      headings: [
        { level: 'h1', text: '媒介契約とは' },
        { level: 'h2', text: '専属専任媒介契約' },
        { level: 'h2', text: '専任媒介契約' },
        { level: 'h2', text: '一般媒介契約' },
        { level: 'h2', text: 'どの契約を選ぶべきか' },
      ],
      text: '媒介契約は不動産会社と締結する契約で、主に3種類あります。専属専任媒介契約は1社のみに依頼し、自己発見取引も不可。報告義務が最も手厚いです。専任媒介契約も1社のみですが、自己発見取引は可能。一般媒介契約は複数社に同時依頼できますが、報告義務はありません。物件の特性や状況に応じて最適な契約を選びましょう。',
    },
    'guide_fees-and-taxes': {
      title: '不動産売却の費用と税金｜いくら不動産',
      h1: '費用と税金',
      headings: [
        { level: 'h1', text: '費用と税金' },
        { level: 'h2', text: '仲介手数料' },
        { level: 'h2', text: '譲渡所得税' },
        { level: 'h2', text: 'その他の費用' },
        { level: 'h2', text: '控除・特例' },
      ],
      text: '不動産売却時にかかる主な費用は仲介手数料です。売却価格×3%+6万円+消費税が上限です。また、利益が出た場合は譲渡所得税がかかります。所有期間5年超で約20%、5年以下で約39%が目安です。その他、抵当権抹消費用、測量費、ハウスクリーニング費用などがかかる場合があります。居住用財産の3000万円特別控除など、税制優遇措置もあります。',
    },
    'guide_relocation': {
      title: '住み替えのポイント｜いくら不動産',
      h1: '住み替えのポイント',
      headings: [
        { level: 'h1', text: '住み替えのポイント' },
        { level: 'h2', text: '売却先行と購入先行' },
        { level: 'h2', text: '資金計画' },
        { level: 'h2', text: '引っ越しタイミング' },
        { level: 'h2', text: '住宅ローンの扱い' },
      ],
      text: '住み替えには「売却先行」と「購入先行」の2つのパターンがあります。売却先行は資金計画が立てやすく、売り急ぎを防げます。購入先行は住まいが確保できるため仮住まいが不要ですが、二重ローンのリスクがあります。残債がある場合は売却代金で完済できるか確認が必要です。住み替えローンの利用も検討しましょう。',
    },
  };

  return {
    url: link.url,
    text: link.text,
    fetchedAt: new Date().toISOString(),
    ...(sampleContent[slug] || {
      title: link.text,
      h1: link.text,
      headings: [{ level: 'h1', text: link.text }],
      text: `${link.text}に関する情報です。`,
    }),
  };
}

async function main() {
  try {
    console.log('=== IKURA Pages Crawler ===\n');

    // ページディレクトリ作成
    await mkdir(PAGES_DIR, { recursive: true });

    // links.json を読み込み
    const linksPath = join(DATA_DIR, 'links.json');
    const linksData = JSON.parse(await readFile(linksPath, 'utf-8'));
    const crawlLinks = linksData.links.filter(l => l.shouldCrawl);

    console.log(`Found ${crawlLinks.length} pages to crawl\n`);

    // 実クロールモードかサンプルデータ生成モードか判定
    const useSampleData = process.env.USE_SAMPLE_DATA === 'true';

    if (useSampleData) {
      // サンプルデータ生成モード
      console.log('⚠ Generating sample data (USE_SAMPLE_DATA=true)\n');

      for (const link of crawlLinks) {
        const slug = urlToSlug(link.url);
        const pageData = generateSamplePageData(link);
        const outputPath = join(PAGES_DIR, `${slug}.json`);
        await writeFile(outputPath, JSON.stringify(pageData, null, 2));
        console.log(`✓ Generated sample: ${slug}.json`);
      }
    } else {
      // 実サイトクロールモード
      console.log(`🕷️  Real crawling mode (${PAGE_DELAY / 1000}s interval between pages)\n`);

      const limit = pLimit(CONCURRENCY);
      const results = [];

      for (let i = 0; i < crawlLinks.length; i++) {
        const link = crawlLinks[i];
        console.log(`\n[${i + 1}/${crawlLinks.length}] Processing: ${link.text}`);

        const result = await processPage(link);
        results.push(result);

        // 最後のページ以外は6秒待機
        if (i < crawlLinks.length - 1) {
          console.log(`  ⏱️  Waiting ${PAGE_DELAY / 1000}s before next page...\n`);
          await sleep(PAGE_DELAY);
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`\n✓ Crawling complete!`);
      console.log(`  Success: ${successful}, Failed: ${failed}`);
    }

    console.log('\n✓ All pages processed!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
