import { readFileSync, writeFileSync } from 'fs';

// Read the original file
const fileContent = readFileSync('/Users/milk/urico-kansai/data/mansion/part5.js', 'utf-8');

// Extract the array from the export statement
const arrayMatch = fileContent.match(/export const MANSION_DB_PART = ([\s\S]*]);?$/);
if (!arrayMatch) {
  console.error('Could not parse the file structure');
  process.exit(1);
}

const mansionData = JSON.parse(arrayMatch[1]);

// Function to generate diverse reasons based on buyer attributes
function generateReason(buyer, propertyName) {
  const { age, family, occupation, method, timing } = buyer;

  const reasons = [];

  // Parse age group
  const ageMatch = age?.match(/(\d+)代/);
  const ageGroup = ageMatch ? parseInt(ageMatch[1]) : null;

  // Family situation based patterns
  const hasChildren = family?.includes('娘') || family?.includes('息子') || family?.includes('お子様');
  const hasToddler = family?.includes('幼稚園') || family?.includes('保育園');
  const hasSchoolAge = family?.includes('小学生') || family?.includes('中学生') || family?.includes('高校生');
  const isCoupleOnly = family?.includes('ご夫婦') && !hasChildren;
  const isSingle = family?.includes('単身') || family?.includes('一人暮らし');

  // Age-based reasons
  if (ageGroup === 20) {
    reasons.push(
      '結婚を機に新居を探していました。駅から近く、近隣に保育園やスーパーもあり、子育てを考えた時に最適な環境だと思い購入を決めました。',
      '初めてのマイホーム購入です。通勤アクセスの良さと周辺環境を重視し、長く住める物件を探していました。',
      '将来の家族計画も考え、広さと立地のバランスが取れた物件を選びました。周辺の生活利便性も魅力的です。',
      '新婚生活のスタートとして、お互いの職場に通いやすい立地を探していました。間取りも新生活に最適だと感じました。',
      '結婚して新しい生活を始めるにあたり、安心して暮らせる環境を重視しました。駅近で買い物も便利な点が決め手です。'
    );
  } else if (ageGroup === 30) {
    if (hasToddler || hasSchoolAge) {
      reasons.push(
        '子どもの成長に合わせて、教育環境の良いエリアを探していました。近隣に学校や公園も多く、安心して子育てができそうです。',
        '小学校入学前に引っ越したいと考えていました。通学路の安全性と周辺の子育て環境を重視して選びました。',
        '子どもが増えて手狭になったため、もう少し広い住まいを探していました。生活利便性も高く、家族全員が満足しています。',
        '保育園に通う子どもがおり、駅近で通勤しやすく、買い物にも便利な立地を重視しました。',
        '子育て世代が多く住むエリアで、近隣に病院や公園も充実しているため、安心して暮らせると判断しました。'
      );
    } else {
      reasons.push(
        '仕事も落ち着いてきたので、そろそろマイホームをと考えていました。通勤アクセスと価格のバランスが良く、購入を決めました。',
        '賃貸の更新を機に購入を検討しました。立地と間取りが希望通りで、資産形成にもなると考えています。',
        '将来的な家族計画も視野に入れ、ゆとりのある間取りを探していました。周辺環境も良く、長く住めそうです。',
        '転勤でこのエリアに来ることになり、通勤アクセスの良さと周辺の生活利便性を重視して選びました。',
        '独立を機に住まいを購入したいと考えていました。駅から近く、商業施設も充実していて便利です。'
      );
    }
  } else if (ageGroup === 40) {
    if (hasSchoolAge) {
      reasons.push(
        '子どもの教育環境を最優先に考え、学校が近く治安の良いエリアを探していました。通勤にも便利で理想的です。',
        '中学受験を控えた子どものため、落ち着いた住環境を求めていました。周辺の教育施設も充実しています。',
        '子どもの成長に合わせて、もう少し広い住まいが必要になりました。学校も近く、安心して生活できる環境です。',
        '子どもが複数いるため、それぞれの部屋を確保できる間取りを探していました。生活利便性も高く満足しています。',
        '子どもの通学を考え、駅近で安全な立地を重視しました。商業施設も充実していて家族全員が便利に暮らせます。'
      );
    } else if (isCoupleOnly) {
      reasons.push(
        '子育てが一段落し、夫婦二人の生活に適した住まいを探していました。駅近で管理状態も良く、老後も安心です。',
        '老後を見据えて、駅から近く買い物にも便利な立地を重視しました。バリアフリー設備も整っています。',
        '転勤族でしたが、定住を決めこのエリアを選びました。通勤アクセスと生活環境のバランスが良いです。',
        '賃貸住まいが長かったのですが、資産形成も兼ねて購入を決断しました。立地と価格に納得できました。',
        '実家の近くで物件を探していました。何かあった時に家族を支えられる距離で、安心して暮らせます。'
      );
    } else {
      reasons.push(
        '転勤でこのエリアに来ることになり、通勤アクセスの良さと周辺の生活利便性を重視して選びました。',
        '職場が近く、通勤時間を短縮したいと考えていました。周辺環境も落ち着いていて理想的です。',
        '家族の生活スタイルに合わせて、利便性の高い立地を探していました。間取りも希望通りです。',
        '将来的な資産価値も考慮し、駅近で需要の高いエリアを選びました。生活環境も良好です。',
        '高齢の両親の近くに住みたいと考え、実家から近い物件を探していました。何かあった時にすぐ駆けつけられます。'
      );
    }
  } else if (ageGroup === 50) {
    reasons.push(
      '定年退職を控え、老後の住まいとして駅近で買い物も便利な立地を探していました。管理状態も良く、長く住める物件だと判断しました。',
      '子どもが独立したため、夫婦二人に適した広さの物件を探していました。駅近で生活しやすく、老後も安心です。',
      '老後の生活を考え、バリアフリーで管理の行き届いた物件を重視しました。周辺の医療施設も充実しています。',
      '相続した資金を活用し、住み替えを決めました。立地と管理状態が良く、安心して暮らせそうです。',
      'これまで賃貸住まいでしたが、定年前にマイホームを持ちたいと考えていました。駅近で便利な立地が決め手です。',
      'リタイア後の生活を見据え、交通の便が良く買い物にも便利な環境を探していました。',
      '終の棲家として、管理体制がしっかりしていて安心して暮らせる物件を選びました。'
    );
  } else if (ageGroup === 60 || ageGroup === 70) {
    reasons.push(
      '老後の生活を考え、駅近で医療施設や商業施設が充実したエリアを探していました。バリアフリーも整っています。',
      '終の棲家として、管理が行き届いていて安心して暮らせる物件を選びました。周辺環境も静かで快適です。',
      '相続対策の一環として不動産購入を検討しており、資産価値と立地条件が適していると判断しました。',
      '子どもの近くに住みたいと考え、このエリアを選びました。駅近で買い物にも便利で、一人でも暮らしやすいです。',
      '配偶者を亡くし、一人暮らしに適した住まいを探していました。セキュリティがしっかりしていて安心です。',
      '年金生活に入り、維持管理費が適正で駅近の物件を探していました。生活に必要な施設が全て揃っています。',
      '持ち家を売却し、コンパクトで管理しやすい住まいに住み替えることにしました。立地と管理体制に満足しています。'
    );
  }

  // Occupation-based additions
  if (occupation?.includes('公務員') || occupation?.includes('教員')) {
    reasons.push(
      '職場への通勤アクセスを重視し、この立地を選びました。周辺環境も落ち着いていて、家族も満足しています。',
      '転勤が落ち着き、定住を決めました。教育環境と生活利便性のバランスが良いエリアです。',
      '安定した職業柄、長期的な資産形成を考えて購入を決めました。立地と価格のバランスが良いです。'
    );
  }

  if (occupation?.includes('自営業') || occupation?.includes('会社経営')) {
    reasons.push(
      '事業が軌道に乗り、住まいの購入を検討していました。立地と資産価値を重視して選びました。',
      '自宅兼事務所として使える間取りを探していました。駅近で商談にも便利な立地です。',
      '事業の拠点となるエリアで、通勤時間を短縮したいと考えていました。周辺環境も良好です。'
    );
  }

  if (occupation?.includes('医師') || occupation?.includes('弁護士')) {
    reasons.push(
      '勤務先に近く、緊急時にもすぐ対応できる距離を重視しました。生活環境も静かで理想的です。',
      '資産形成の一環として、立地と資産価値を重視して選びました。管理状態も良好です。',
      '職場への通勤時間を短縮したいと考えていました。周辺の医療施設や教育環境も充実しています。'
    );
  }

  // Payment method based
  if (method?.includes('キャッシュ') && !method?.includes('一部')) {
    reasons.push(
      '相続した資金を有効活用したいと考え、立地と資産価値を重視して選びました。',
      '投資用としても検討しており、駅近で需要の高いエリアを選びました。',
      '現金購入で資産を保有したいと考えていました。立地と管理状態が良く、安心して購入できました。'
    );
  }

  // Timing based
  if (timing?.includes('即時')) {
    reasons.push(
      '急な転勤が決まり、早急に住まいを探していました。条件に合う物件が見つかり、すぐに決断しました。',
      '賃貸の契約満了が迫っており、良い物件を探していました。希望通りの立地と間取りで即決しました。',
      '結婚が決まり、新生活のスタートに間に合うよう早めに物件を探していました。'
    );
  }

  // Single person specific
  if (isSingle) {
    reasons.push(
      '一人暮らしに適したコンパクトな間取りを探していました。駅近で通勤にも便利です。',
      '独立を機に住まいを購入したいと考えていました。セキュリティがしっかりしていて安心です。',
      '賃貸より資産になる方が良いと考え、購入を決めました。立地と価格のバランスが良いです。',
      '転職を機に引っ越すことになり、職場に近い物件を探していました。周辺環境も良好です。'
    );
  }

  // Investment purposes
  if (method?.includes('未定') || occupation?.includes('投資家')) {
    reasons.push(
      '将来的な資産形成を考え、立地と価格のバランスが良い物件への投資を検討しています。',
      '賃貸需要の高いエリアで投資物件を探していました。駅近で安定した収益が期待できます。',
      '資産運用の一環として、不動産投資を検討しています。管理状態も良好で、リスクも低いと判断しました。'
    );
  }

  // Generic good reasons
  reasons.push(
    '住み替えを検討していた時に、希望の条件に合う物件が見つかりました。立地と価格に納得できました。',
    '通勤時間を短縮したいと考えていました。駅から近く、周辺の生活環境も良好で理想的です。',
    '長年住んでいたエリアですが、より良い住環境を求めて住み替えを決めました。',
    '家族の意見が一致し、みんなが納得できる物件を見つけることができました。',
    '実際に内見して、間取りや日当たりが良く、すぐに気に入りました。周辺環境も申し分ありません。',
    '価格と立地のバランスが良く、資産価値も期待できると判断しました。',
    '管理状態が良く、長期的に安心して住める物件だと感じました。',
    '周辺の生活利便性が高く、日々の暮らしがしやすいと思い購入を決めました。',
    '駅から近く、通勤や買い物に便利な立地が決め手となりました。',
    '近隣に必要な施設が揃っており、快適に暮らせる環境だと判断しました。'
  );

  // Select a random reason from the accumulated list
  const randomIndex = Math.floor(Math.random() * reasons.length);
  return reasons[randomIndex];
}

// Process all buyers
let processedCount = 0;
for (const mansion of mansionData) {
  if (mansion.buyers && Array.isArray(mansion.buyers)) {
    for (const buyer of mansion.buyers) {
      if (buyer.reason) {
        // Generate new reason without property name
        buyer.reason = generateReason(buyer, mansion.name);
        processedCount++;
      }
    }
  }
}

// Convert back to JavaScript format
const outputContent = \\\;

// Write to new file
writeFileSync('/Users/milk/urico-kansai/data/mansion/part5_brushup.js', outputContent, 'utf-8');

console.log(\\\);
console.log('Output written to: /Users/milk/urico-kansai/data/mansion/part5_brushup.js');
