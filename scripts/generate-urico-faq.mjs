import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PAGES_DIR = join(__dirname, '..', 'data', 'sources', 'external', 'pages');
const OUTPUT_DIR = join(__dirname, '..', 'data', 'faq');
const PUBLIC_DIR = join(__dirname, '..', 'public', 'faq');

// FAQ生成ロジック：各ページからQ&Aを抽出
function generateFAQsFromPage(pageData) {
  const faqs = [];
  const { title, h1, headings, text, url } = pageData;

  // ページのトピックに基づいてFAQを生成
  if (url.includes('selling-flow')) {
    faqs.push({
      question: '不動産売却はどのような流れで進みますか?',
      answer: '不動産売却は主に4つのステップで進みます。まず査定依頼を行い、適正価格を把握します。次に不動産会社と媒介契約を締結し、売却活動を開始します。購入希望者が見つかったら条件交渉を行い、最後に売買契約を締結して引き渡しを行います。\n\nURICOでは、購入希望者の情報を事前に公開しているため、マッチングがスムーズで、従来よりも早期の売却が期待できます。',
      category: 'basics',
    });
    faqs.push({
      question: '売却にはどのくらいの期間がかかりますか?',
      answer: '一般的に、売却活動開始から引き渡しまで3〜6ヶ月程度かかることが多いです。ただし、物件の状態や立地、価格設定によって大きく変動します。\n\nURICOの透明性の高いマッチングシステムを利用することで、購入希望者との出会いが早まり、売却期間の短縮が期待できます。',
      category: 'basics',
    });
  }

  if (url.includes('price-assessment')) {
    faqs.push({
      question: '不動産査定は無料でできますか?',
      answer: 'はい、多くの不動産会社では無料で査定を行っています。査定には机上査定と訪問査定の2種類があり、より正確な価格を知りたい場合は訪問査定をおすすめします。\n\nURICOでも無料査定を承っており、経験豊富なセンチュリー21のスタッフが丁寧に対応いたします。',
      category: 'start',
    });
    faqs.push({
      question: '査定額と実際の売却価格は異なりますか?',
      answer: '査定額はあくまで目安であり、実際の売却価格は市場の需要や交渉によって変動します。複数社に査定依頼をして、適正な価格帯を把握することが重要です。\n\nURICOでは購入希望者の予算や条件が事前に分かるため、より現実的な価格設定が可能です。',
      category: 'start',
    });
    faqs.push({
      question: '査定前に準備しておくことはありますか?',
      answer: '物件の権利証、固定資産税の納税通知書、間取り図、設備の取扱説明書などを用意しておくとスムーズです。また、リフォーム履歴や修繕記録があれば、より正確な査定が可能になります。',
      category: 'start',
    });
  }

  if (url.includes('contract-types')) {
    faqs.push({
      question: '媒介契約の種類とそれぞれの違いは何ですか?',
      answer: '媒介契約には専属専任媒介、専任媒介、一般媒介の3種類があります。専属専任媒介は1社のみに依頼し、自己発見取引も不可ですが、手厚いサポートが受けられます。専任媒介も1社のみですが、自己発見取引は可能です。一般媒介は複数社に同時依頼できますが、報告義務はありません。\n\nURICOでは、お客様の状況に応じて最適な契約形態をご提案します。',
      category: 'knowledge',
    });
    faqs.push({
      question: 'どの媒介契約を選べばよいですか?',
      answer: '物件の特性や状況によって最適な契約は異なります。早期売却を希望し、手厚いサポートを求める場合は専任媒介がおすすめです。複数社に依頼して幅広く買主を探したい場合は一般媒介が適しています。\n\nURICOのスタッフが、お客様の状況を詳しくヒアリングした上で、最適な契約形態をアドバイスいたします。',
      category: 'knowledge',
    });
  }

  if (url.includes('fees-and-taxes')) {
    faqs.push({
      question: '不動産売却にはどのような費用がかかりますか?',
      answer: '主な費用は仲介手数料で、売却価格×3%+6万円+消費税が上限です。その他、抵当権抹消費用（司法書士報酬含め1〜3万円程度）、測量費（必要な場合50〜100万円程度）、印紙税、ハウスクリーニング費用などがかかる場合があります。\n\nURICOでは、事前に必要な費用を明確にご説明し、透明性の高い取引をサポートします。',
      category: 'knowledge',
    });
    faqs.push({
      question: '売却で利益が出た場合、税金はどうなりますか?',
      answer: '売却で利益（譲渡所得）が出た場合、譲渡所得税がかかります。所有期間5年超の場合は約20%、5年以下の場合は約39%が目安です。ただし、居住用財産の3000万円特別控除など、税制優遇措置も用意されています。\n\n税金に関する詳細は税理士にご相談いただくことをおすすめしますが、URICOでも基本的なアドバイスを提供しています。',
      category: 'knowledge',
    });
    faqs.push({
      question: '3000万円特別控除とは何ですか?',
      answer: '居住用財産を売却した場合、一定の要件を満たせば譲渡所得から最高3000万円まで控除できる制度です。これにより、多くの場合で譲渡所得税を大幅に軽減、または非課税にすることができます。\n\nURICOでは、こうした税制優遇措置を活用できるよう、売却のタイミングや手続きについてもアドバイスいたします。',
      category: 'knowledge',
    });
  }

  if (url.includes('relocation')) {
    faqs.push({
      question: '住み替えの場合、売却と購入はどちらを先にすべきですか?',
      answer: '「売却先行」と「購入先行」にはそれぞれメリット・デメリットがあります。売却先行は資金計画が立てやすく、売り急ぎを防げますが、仮住まいが必要になる場合があります。購入先行は住まいが確保できますが、二重ローンのリスクがあります。\n\nURICOでは、お客様の状況を詳しくお伺いし、最適な住み替えプランをご提案します。',
      category: 'situations',
    });
    faqs.push({
      question: '住宅ローンが残っている物件でも売却できますか?',
      answer: 'はい、売却可能です。ただし、売却時にローンを完済する必要があります。売却代金でローンを完済できない場合は、自己資金で補填するか、住み替えローンの利用を検討します。\n\nURICOでは、ローン残債がある場合の資金計画についても丁寧にサポートいたします。',
      category: 'situations',
    });
  }

  return faqs;
}

// カテゴリごとにFAQを整理
function organizeFAQs(allFaqs) {
  const categories = {
    start: {
      title: 'まずはここから',
      subtitle: '会社選び、査定、相場、準備',
      faqs: [],
    },
    situations: {
      title: 'こんなときどうする',
      subtitle: '住み替え、ローン、相続、離婚など',
      faqs: [],
    },
    knowledge: {
      title: '基礎知識',
      subtitle: '媒介契約、費用・税金、流れ',
      faqs: [],
    },
    basics: {
      title: '売却の流れ',
      subtitle: '全体の流れとスケジュール',
      faqs: [],
    },
  };

  allFaqs.forEach(faq => {
    const category = faq.category || 'knowledge';
    if (categories[category]) {
      categories[category].faqs.push({
        question: faq.question,
        answer: faq.answer,
      });
    }
  });

  return categories;
}

// HTMLページを生成
function generateHTMLPage(organizedFaqs) {
  const sections = Object.entries(organizedFaqs)
    .filter(([_, data]) => data.faqs.length > 0)
    .map(([key, data]) => {
      const faqItems = data.faqs
        .map(
          (faq, idx) => `
        <div class="faq-item">
          <h3 class="faq-question">Q${idx + 1}. ${faq.question}</h3>
          <div class="faq-answer">
            ${faq.answer.split('\n\n').map(p => `<p>${p}</p>`).join('\n            ')}
          </div>
        </div>
      `
        )
        .join('');

      return `
    <section class="faq-section">
      <h2 class="section-title">${data.title}</h2>
      <p class="section-subtitle">${data.subtitle}</p>
      <div class="faq-list">
        ${faqItems}
      </div>
    </section>
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="不動産売却に関するよくある質問をまとめました。URICOは透明性の高い取引で、安心・スピーディな不動産売却をサポートします。">
  <title>売却お役立ちFAQ｜URICO</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.8;
      color: #333;
      background-color: #f8f9fa;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 1rem;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }

    .header p {
      font-size: 1.1rem;
      opacity: 0.95;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 1rem;
    }

    .intro {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 3rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .intro h2 {
      color: #667eea;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }

    .intro p {
      color: #666;
      margin-bottom: 1rem;
    }

    .intro ul {
      list-style: none;
      padding-left: 0;
    }

    .intro li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
    }

    .intro li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }

    .faq-section {
      background: white;
      padding: 2.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .section-title {
      color: #667eea;
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
      border-bottom: 3px solid #667eea;
      padding-bottom: 0.5rem;
    }

    .section-subtitle {
      color: #888;
      font-size: 0.95rem;
      margin-bottom: 2rem;
    }

    .faq-item {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #eee;
    }

    .faq-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .faq-question {
      color: #333;
      font-size: 1.2rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .faq-answer {
      color: #555;
      line-height: 1.9;
    }

    .faq-answer p {
      margin-bottom: 1rem;
    }

    .faq-answer p:last-child {
      margin-bottom: 0;
    }

    .cta {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      border-radius: 12px;
      text-align: center;
      margin-top: 3rem;
    }

    .cta h2 {
      font-size: 1.8rem;
      margin-bottom: 1rem;
    }

    .cta p {
      font-size: 1.1rem;
      margin-bottom: 2rem;
      opacity: 0.95;
    }

    .cta-button {
      display: inline-block;
      background: white;
      color: #667eea;
      padding: 1rem 3rem;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.1rem;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }

    .footer {
      text-align: center;
      padding: 2rem 1rem;
      color: #888;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 1.8rem;
      }

      .container {
        padding: 2rem 1rem;
      }

      .faq-section {
        padding: 1.5rem;
      }

      .section-title {
        font-size: 1.5rem;
      }

      .faq-question {
        font-size: 1.1rem;
      }
    }
  </style>
</head>
<body>
  <header class="header">
    <h1>売却お役立ちFAQ</h1>
    <p>不動産売却に関するよくある質問</p>
  </header>

  <main class="container">
    <div class="intro">
      <h2>URICOについて</h2>
      <p>URICOは透明性の高い不動産取引をサポートするサービスです。</p>
      <ul>
        <li>購入希望者の情報を事前に公開し、スムーズなマッチングを実現</li>
        <li>不動産業界経験者の信頼と実績でサポート</li>
        <li>透明性の高い取引で安心して売却を進められます</li>
      </ul>
    </div>

    ${sections}

    <div class="cta">
      <h2>まずは無料査定から</h2>
      <p>URICOでスムーズな不動産売却を始めましょう</p>
      <a href="/" class="cta-button">トップページへ</a>
    </div>
  </main>

  <footer class="footer">
    <p>&copy; 2026 URICO. All rights reserved.</p>
  </footer>
</body>
</html>`;
}

async function main() {
  try {
    console.log('=== URICO FAQ Generator ===\n');

    // ページデータを読み込み
    const pageFiles = await readdir(PAGES_DIR);
    const jsonFiles = pageFiles.filter(f => f.endsWith('.json'));

    console.log(`Found ${jsonFiles.length} page files\n`);

    const allFaqs = [];

    for (const file of jsonFiles) {
      const filePath = join(PAGES_DIR, file);
      const pageData = JSON.parse(await readFile(filePath, 'utf-8'));

      console.log(`Processing: ${pageData.text || file}`);

      const faqs = generateFAQsFromPage(pageData);
      allFaqs.push(...faqs);

      console.log(`  Generated ${faqs.length} FAQ items`);
    }

    console.log(`\n✓ Total FAQ items: ${allFaqs.length}\n`);

    // FAQを整理
    const organizedFaqs = organizeFAQs(allFaqs);

    // 構造化JSONを保存
    await mkdir(OUTPUT_DIR, { recursive: true });
    const jsonPath = join(OUTPUT_DIR, 'urico_faq.json');
    await writeFile(
      jsonPath,
      JSON.stringify(
        {
          title: '売却お役立ちFAQ',
          description: '不動産売却に関するよくある質問',
          generatedAt: new Date().toISOString(),
          categories: organizedFaqs,
        },
        null,
        2
      )
    );
    console.log(`✓ JSON saved: ${jsonPath}`);

    // HTMLページを生成
    await mkdir(PUBLIC_DIR, { recursive: true });
    const htmlPath = join(PUBLIC_DIR, 'index.html');
    const html = generateHTMLPage(organizedFaqs);
    await writeFile(htmlPath, html);
    console.log(`✓ HTML saved: ${htmlPath}`);

    console.log('\n✓ FAQ generation complete!\n');

    // サマリー表示
    console.log('Generated FAQ categories:');
    Object.entries(organizedFaqs).forEach(([key, data]) => {
      if (data.faqs.length > 0) {
        console.log(`  - ${data.title}: ${data.faqs.length} items`);
      }
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
