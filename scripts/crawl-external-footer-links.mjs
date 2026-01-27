import { request } from 'undici';
import * as cheerio from 'cheerio';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ベースURLはここで変更可能
const BASE_URL = process.env.BASE_URL || 'https://ikura.estate/';
const FOOTER_SELECTOR = 'div.Footer_second_column__lhab8';
const OUTPUT_DIR = join(__dirname, '..', 'data', 'sources', 'ikura');

async function fetchHTML(url) {
  console.log(`Fetching: ${url}`);

  const { statusCode, body } = await request(url, {
    headers: {
      'User-Agent': 'URICO Research Bot (for FAQ generation)',
    },
  });

  if (statusCode !== 200) {
    throw new Error(`Failed to fetch ${url}: Status ${statusCode}`);
  }

  let html = '';
  for await (const chunk of body) {
    html += chunk.toString();
  }

  return html;
}

function extractLinks(html, baseURL) {
  const $ = cheerio.load(html);
  const links = [];
  const baseUrlObj = new URL(baseURL);

  $(FOOTER_SELECTOR).find('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const text = $(element).text().trim();

    if (!href) return;

    try {
      const absoluteURL = new URL(href, baseURL);

      // URL正規化（末尾スラッシュ削除、クエリパラメータ保持）
      let normalizedURL = absoluteURL.href;
      if (normalizedURL.endsWith('/') && normalizedURL !== baseURL) {
        normalizedURL = normalizedURL.slice(0, -1);
      }

      const isSameDomain = absoluteURL.hostname === baseUrlObj.hostname;
      const isTargetBlank = $(element).attr('target') === '_blank';

      links.push({
        url: normalizedURL,
        text,
        isSameDomain,
        isTargetBlank,
        shouldCrawl: isSameDomain && !isTargetBlank,
      });
    } catch (err) {
      console.warn(`Invalid URL: ${href}`, err.message);
    }
  });

  // 重複URL削除
  const uniqueLinks = [];
  const seenUrls = new Set();

  for (const link of links) {
    if (!seenUrls.has(link.url)) {
      seenUrls.add(link.url);
      uniqueLinks.push(link);
    }
  }

  return uniqueLinks;
}

async function main() {
  try {
    console.log('=== IKURA Footer Links Crawler ===\n');

    // データディレクトリ作成
    await mkdir(OUTPUT_DIR, { recursive: true });

    // HTML取得
    const html = await fetchHTML(BASE_URL);
    console.log(`✓ HTML fetched (${html.length} bytes)\n`);

    // リンク抽出
    const links = extractLinks(html, BASE_URL);
    console.log(`✓ Found ${links.length} unique links`);
    console.log(`  - Same domain: ${links.filter(l => l.isSameDomain).length}`);
    console.log(`  - Should crawl: ${links.filter(l => l.shouldCrawl).length}`);
    console.log(`  - External/excluded: ${links.filter(l => !l.shouldCrawl).length}\n`);

    // 結果を保存
    const outputPath = join(OUTPUT_DIR, 'links.json');
    await writeFile(outputPath, JSON.stringify({
      baseURL: BASE_URL,
      selector: FOOTER_SELECTOR,
      fetchedAt: new Date().toISOString(),
      links,
    }, null, 2));

    console.log(`✓ Links saved to: ${outputPath}\n`);

    // クロール対象のリスト表示
    const crawlLinks = links.filter(l => l.shouldCrawl);
    if (crawlLinks.length > 0) {
      console.log('URLs to crawl:');
      crawlLinks.forEach((link, i) => {
        console.log(`  ${i + 1}. ${link.text} - ${link.url}`);
      });
    }

    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
