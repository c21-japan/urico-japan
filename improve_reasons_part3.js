const fs = require('fs');

// Read the input file
const inputPath = '/Users/milk/urico-kansai/data/mansion/part3.js';
const outputPath = '/Users/milk/urico-kansai/data/mansion/part3_brushup.js';

const content = fs.readFileSync(inputPath, 'utf-8');

// Extract the data array from the export statement
const dataMatch = content.match(/export const MANSION_DB_PART = (\[[\s\S]*\]);/);
if (!dataMatch) {
  console.error('Could not find MANSION_DB_PART array');
  process.exit(1);
}

const data = JSON.parse(dataMatch[1]);

// Function to generate improved reason based on buyer attributes
function generateReason(buyer, propertyName) {
  const { age, family, occupation, method, timing } = buyer;

  // Parse age range
  const ageMatch = age.match(/(\d+)代/);
  const ageRange = ageMatch ? parseInt(ageMatch[1]) : 30;

  // Parse family structure
  const hasChildren = family.includes('子') || family.includes('息子') || family.includes('娘');
  const isCouple = family.includes('夫婦');
  const isSingle = family.includes('１名') || family.includes('1名');

  // Generate diverse and natural reasons
  const reasons = [];

  // Age-based reasons
  if (ageRange >= 20 && ageRange < 40) {
    if (hasChildren) {
      reasons.push(
        '子どもの成長を考え、教育環境の良い場所で暮らしたいと思いました。駅近で保育園や学校も充実しており、家族での生活に最適な環境です。',
        '結婚を機に新居を探していました。駅から近く、近隣に保育園やスーパーもあり、子育てを考えた時に最適な環境だと思い購入を決めました。',
        '子育てしやすい環境を探していたところ、公園や医療施設が近く、通勤アクセスも良好なこの物件に出会いました。',
        '小学校入学を控え、学区や通学路の安全性を重視して物件を探していました。周辺環境も良く、安心して子育てできそうです。',
        '賃貸では手狭になってきたため、子ども部屋を確保できる広さの物件を希望していました。間取りも理想的で即決しました。',
        '共働きのため、保育園に近く通勤にも便利な立地を最優先に考えていました。生活動線が良く、育児との両立がしやすそうです。',
        '将来の家族計画を考えて、今のうちにしっかりした住まいを確保したいと思いました。管理状況も良好で安心です。'
      );
    } else {
      reasons.push(
        '初めてのマイホーム購入です。駅近で通勤に便利な立地と、周辺の生活施設の充実度に魅力を感じました。',
        '賃貸の家賃を払い続けるより、資産として持ちたいと考えました。管理体制もしっかりしており、将来的な価値も期待できます。',
        '結婚のタイミングで二人の新居を探していました。間取りも希望通りで、駅からのアクセスも申し分ありません。',
        '転勤でこのエリアに来ることになり、通勤アクセスの良さと周辺の生活利便性を重視して選びました。広さも希望通りです。',
        '賃貸契約の更新を機に、思い切ってマイホーム購入を決意しました。資産形成にもつながり、満足しています。',
        'リモートワークが増えたため、仕事部屋を確保できる間取りを探していました。日当たりも良く快適に作業できそうです。',
        '職場へのアクセスが格段に良くなり、通勤時間を大幅に短縮できます。プライベートの時間を増やせることが一番の魅力です。'
      );
    }
  } else if (ageRange >= 40 && ageRange < 60) {
    if (hasChildren) {
      reasons.push(
        '子どもの中学受験を考え、学習環境が整った地域で物件を探していました。図書館や塾へのアクセスも良好です。',
        '家族構成の変化に伴い、より広い間取りが必要になりました。各部屋の広さも十分で、家族それぞれの時間を大切にできます。',
        '子どもの進学を機に、より良い教育環境を求めて住み替えを検討しました。希望する学区内で条件に合う物件が見つかりました。',
        '二世帯で暮らせる広さを探していました。それぞれのプライバシーを保ちながら、家族で支え合える環境が整っています。',
        '実家の近くで物件を探しており、両親のサポートも受けやすい距離感が決め手になりました。住環境も申し分ありません。',
        '子どもの習い事や部活動を考えると、交通の便が良いこの立地は理想的でした。家族みんなが納得しています。'
      );
    } else {
      reasons.push(
        '住み替えを検討していた際、希望する間取りと価格帯がマッチしました。管理状態も良好で、長く安心して暮らせそうです。',
        '転勤族でしたが、このエリアに定住することを決めました。生活環境が整っており、永住先として最適だと感じています。',
        '老後を見据えて、バリアフリーで駅近の物件を探していました。医療機関も近く、将来的にも安心して暮らせると判断しました。',
        '子どもが独立したため、夫婦二人で暮らしやすいコンパクトな住まいを探していました。駅近で買い物も便利な立地が魅力です。',
        '実家の相続を機に住み替えを決意しました。利便性の高い立地で、これまでより快適な生活が送れそうです。',
        '勤務先の移転に伴い、通勤しやすいエリアで物件を探していました。駅からの距離と周辺環境のバランスが理想的です。',
        'セカンドライフを見据えて、文化施設や趣味を楽しめる環境が整った場所を選びました。充実した日々を過ごせそうです。'
      );
    }
  } else if (ageRange >= 60) {
    reasons.push(
      '定年退職を控え、老後の住まいとして駅近で買い物も便利な立地を探していました。管理状態も良く、長く住める物件だと判断しました。',
      '年金生活に入る前に、利便性の高い住まいを確保したいと考えていました。病院やスーパーが徒歩圏内で安心して暮らせます。',
      '子どもたちの近くに引っ越したいと思っており、孫の顔も見やすくなります。バリアフリー設計も魅力的でした。',
      '夫婦二人の生活に合わせて、管理しやすいコンパクトな住まいを希望していました。日常生活に必要な施設が全て近くに揃っています。',
      '老後の生活を考えると、駅近でエレベーター付きの物件が必須でした。医療機関へのアクセスも良好で、安心して暮らせます。',
      '終の棲家として、静かで落ち着いた環境を求めていました。管理組合の運営もしっかりしており、長く安心して住めそうです。',
      '持ち家の維持が負担になってきたため、管理の行き届いたマンションへの住み替えを決めました。駅近で生活も便利です。',
      '足腰のことを考え、駅やスーパーに近い平坦な立地を最優先に探していました。バリアフリーで暮らしやすい環境です。'
    );
  }

  // Method-based reasons (キャッシュ購入など)
  if (method.includes('キャッシュ') && ageRange < 50) {
    reasons.push(
      '親からの援助もあり、早めにマイホームを持つことができました。これから家族を築いていく拠点として最適です。',
      '資産運用の一環として、立地の良いマンションを探していました。賃貸需要も見込め、将来性のあるエリアだと判断しました。',
      '相続した資金を有効活用したいと考え、駅近物件への投資を決めました。管理状態も良く、資産価値を維持できそうです。'
    );
  }

  // Occupation-based reasons
  if (occupation.includes('公務員') || occupation.includes('教員')) {
    reasons.push(
      '転勤の少ない職種のため、腰を据えて長く住める物件を探していました。通勤にも便利で、安定した生活が送れそうです。',
      '職場までの通勤時間を短縮したいと考えていました。交通アクセスが良く、仕事とプライベートの両立がしやすくなります。'
    );
  }

  if (occupation.includes('自営業') || occupation.includes('個人事業主')) {
    reasons.push(
      '自宅兼事務所として使える物件を検討していました。来客にも便利な立地で、仕事とプライベートの切り替えもしやすいです。',
      '独立開業を機に、仕事場と住居を兼ねられる物件を探していました。駅近でアクセスも良く、理想的な環境です。'
    );
  }

  // Timing-based reasons
  if (timing === '即時') {
    reasons.push(
      '内覧時の第一印象が非常に良く、設備や管理状況を確認して即決しました。希望する条件を全て満たしていました。',
      '賃貸契約の更新時期が迫っており、すぐに入居できる物件を探していました。リフォーム済みですぐに住めるのも魅力です。',
      '転勤が決まり急いで物件を探していましたが、条件に合う理想的な物件に出会えました。すぐに契約を決めました。'
    );
  }

  // General diverse reasons
  reasons.push(
    '周辺環境の良さと日常生活の利便性を重視して探していました。実際に歩いてみて、住みやすさを実感できました。',
    '南向きで日当たりが良く、風通しも抜群です。実際に内覧して明るい室内に魅力を感じ、購入を決めました。',
    '管理組合がしっかり機能しており、長期修繕計画も明確でした。安心して長く住める物件だと確信しました。',
    '同じマンションに知人が住んでおり、住環境の良さを聞いていました。実際に見学して納得し、購入を決意しました。',
    '収納スペースが豊富で、家族の荷物をしっかり整理できそうです。ウォークインクローゼットも使いやすい設計です。',
    '角部屋で眺望が良く、プライバシーも確保できる点が魅力的でした。静かな住環境で快適に過ごせそうです。',
    'リノベーション済みで設備が新しく、すぐに快適な生活を始められます。内装のセンスも気に入りました。',
    '複数の路線が使える立地で、通勤や外出の選択肢が広がります。利便性の高さが決め手になりました。',
    'ペットと一緒に暮らせる物件を長年探しており、ようやく希望に合う物件に出会えました。近隣に動物病院もあり安心です。',
    '防音性能が高く、上下階の音も気になりません。小さな子どもがいるため、この点は特に重要でした。',
    '共用施設が充実しており、快適なマンションライフが送れそうです。管理人も常駐しており、セキュリティ面も安心です。'
  );

  // Select a random reason from the accumulated list
  return reasons[Math.floor(Math.random() * reasons.length)];
}

// Process all buyers
let count = 0;
data.forEach(property => {
  if (property.buyers && Array.isArray(property.buyers)) {
    property.buyers.forEach(buyer => {
      buyer.reason = generateReason(buyer, property.name);
      count++;
    });
  }
});

// Write the improved data back
const output = `export const MANSION_DB_PART = ${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(outputPath, output, 'utf-8');

console.log(`Successfully improved ${count} buyer reasons`);
console.log(`Output written to: ${outputPath}`);
