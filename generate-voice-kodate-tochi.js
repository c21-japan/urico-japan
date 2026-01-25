import fs from 'fs';

// ===========================
// データ定義
// ===========================

const prefectures = ['奈良県', '大阪府', '兵庫県', '京都府', '滋賀県'];

const cities = {
  '奈良県': ['奈良市', '生駒市', '橿原市', '天理市', '大和郡山市', '香芝市', '桜井市', '葛城市', '宇陀市'],
  '大阪府': ['大阪市', '堺市', '豊中市', '吹田市', '高槻市', '枚方市', '茨木市', '八尾市', '寝屋川市'],
  '兵庫県': ['神戸市', '姫路市', '西宮市', '尼崎市', '明石市', '加古川市', '宝塚市', '伊丹市', '川西市'],
  '京都府': ['京都市', '宇治市', '亀岡市', '城陽市', '向日市', '長岡京市', '八幡市', '京田辺市', '木津川市'],
  '滋賀県': ['大津市', '草津市', '守山市', '栗東市', '野洲市', '近江八幡市', '彦根市', '長浜市', '東近江市']
};

const occupations = [
  '会社員', '経営者', '公務員', '自営業', '医師', '看護師', '薬剤師', '教師', '保育士', '介護士',
  'エンジニア', 'デザイナー', '営業', '事務職', '販売員', '美容師', '調理師', '建築士', '不動産業',
  '金融業', 'コンサルタント', '弁護士', '税理士', '会計士', '社労士', 'フリーランス', '派遣社員',
  'パート', 'アルバイト', '主婦', '主夫', '年金受給者', '無職', '学生', '農業', '林業'
];

const houseMadori = ['3LDK', '4LDK', '5LDK', '6LDK', '3DK', '4DK'];
const landMokuteki = ['宅地', '雑種地', '農地', '山林', '宅地（古家付き）'];
const landTokki = ['更地', '古家付き', '接道良好', '接道2m', '整形地', '不整形地', '角地'];

// ===========================
// ヘルパー関数
// ===========================

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomCity() {
  const pref = randomChoice(prefectures);
  const city = randomChoice(cities[pref]);
  return `${pref} ${city}`;
}

function getRandomYear() {
  return `${randomInt(1970, 2020)}年${randomInt(1, 12)}月`;
}

// ===========================
// 戸建のお客様の声生成
// ===========================

const houseVoicePatterns = [
  (location, age, occupation) => `大手不動産会社3社に半年間依頼していましたが、なかなか買い手が見つからず困っていました。ポストに入っていたURICOのチラシを見て問い合わせたところ、わずか2週間で成約できました。複数の購入希望者の中から、条件の合う方を選べたのが良かったです。${occupation}として働きながらの売却活動でしたが、スムーズに進めることができ感謝しています。`,

  (location, age, occupation) => `相続した実家を売却する必要があり、どこに依頼すればいいか悩んでいました。URICOを利用したところ、4社の購入希望者情報が届き、その中から最も条件の良い方と契約できました。従来なら数ヶ月かかると思っていましたが、わずか10日で成約。担当者の対応も丁寧で安心できました。`,

  (location, age, occupation) => `転勤が急に決まり、3ヶ月以内に売却する必要がありました。大手に依頼したところ値下げを提案されましたが、URICOのチラシに掲載されていた購入希望者Bさんが希望価格で即決してくれました。引っ越し準備と並行しての売却でしたが、スピーディーな対応に助けられました。`,

  (location, age, occupation) => `築35年の古い戸建で、リフォームが必要と言われ売却を諦めかけていました。しかしURICOを通じて、現状のままで購入したいという方が見つかり、希望価格で売却できました。${location}のような地域でも需要があることに驚きました。感謝しかありません。`,

  (location, age, occupation) => `離婚に伴う財産分与で、感情的にも辛い時期でした。URICOの担当者は親身に相談に乗ってくださり、公平な価格で売却できました。従来の方法では時間がかかると思っていましたが、1ヶ月足らずで成約。新しい生活をスタートできて感謝しています。`,

  (location, age, occupation) => `父が亡くなり、実家を売却することになりました。思い出の詰まった家なので、大切に住んでくれる方に譲りたいと思っていました。URICOで紹介された購入希望者の方は子育て世代で、家を気に入ってくれました。価格も満足で、安心して引き渡せました。`,

  (location, age, occupation) => `地元の不動産屋に1年近く依頼していましたが反応がありませんでした。URICOに切り替えたところ、3週間で6件の問い合わせがあり、最終的に建売業者の方に購入していただきました。複数の選択肢から選べたのが大きかったです。`,

  (location, age, occupation) => `住宅ローンの支払いが厳しくなり、売却を決意しました。大手では査定額が低く悩んでいましたが、URICOで適正価格で購入してくれる方が見つかりました。ローン完済もでき、新たなスタートを切れました。迅速な対応に感謝しています。`,

  (location, age, occupation) => `子供の独立を機に、広すぎる戸建を売却してマンションに住み替えることにしました。URICOのチラシで購入希望者が多いことを知り、問い合わせました。希望通りの価格で売却でき、理想的な住み替えができました。${age}歳でも安心して任せられました。`,

  (location, age, occupation) => `建て替えのため土地として売却したかったのですが、古家の解体費用をどうするか悩んでいました。URICOで紹介された工務店が古家付きのまま購入してくれて、解体費用も節約できました。想定以上の価格で売却でき大満足です。`
];

function generateHouseVoice(index) {
  const location = getRandomCity();
  const year = getRandomYear();
  const madori = randomChoice(houseMadori);
  const menseki = `${randomInt(80, 150)}㎡`;
  const age = randomInt(25, 75);
  const occupation = randomChoice(occupations);
  const voiceText = randomChoice(houseVoicePatterns)(location, age, occupation);
  const graphNum = String(index).padStart(3, '0');

  return `<div class="voice-card">
    <div class="voice-card-header">
        <div class="voice-location">${location}</div>
        <div class="voice-specs">
            <span class="voice-spec">${year}</span>
            <span class="voice-spec">${madori}</span>
            <span class="voice-spec">${menseki}</span>
        </div>
    </div>
    <div class="voice-card-body">
        <div class="voice-top-section">
            <div class="voice-content">
                <p class="voice-text">${voiceText}</p>
            </div>
        </div>
        <div class="voice-graph">
            <img src="./images/voice-kodate-graph-${graphNum}.jpg" alt="売却グラフ">
        </div>
        <div class="voice-person-info">
            <span class="person-occupation">${occupation}</span>
            <span class="person-age">${age}歳</span>
        </div>
    </div>
</div>`;
}

// ===========================
// 土地のお客様の声生成
// ===========================

const landVoicePatterns = [
  (location, age, occupation) => `相続した土地の固定資産税が毎年負担で、10年以上放置していました。地元の不動産屋では買い手がつかないと言われていましたが、URICOを通じて地元工務店と繋がり、わずか2週間で成約しました。長年の悩みが解消され、本当に助かりました。`,

  (location, age, occupation) => `古家付きの土地で、解体費用200万円が必要と言われ途方に暮れていました。しかしURICOで紹介された建売業者が、古家付きのまま購入したいと言ってくれました。解体費用も節約でき、希望価格で売却できて大満足です。`,

  (location, age, occupation) => `狭小地で接道も2mしかなく、大手不動産会社には相手にされませんでした。URICOで建売業者を紹介してもらい、適正価格で即決してもらえました。${location}のような場所でも需要があることに驚きました。感謝しています。`,

  (location, age, occupation) => `農地転用の手続きが複雑で困っていましたが、URICOで紹介された不動産会社が全てサポートしてくれました。書類作成から役所との調整まで丁寧に対応してもらい、安心して売却できました。専門知識が必要な案件も任せられます。`,

  (location, age, occupation) => `3人の相続人がいて意見がまとまらず、売却が進みませんでした。URICOで全員が納得できる買主を見つけてもらい、公平に分割できました。調整役としても機能してくれて、家族関係も良好なまま解決できました。`,

  (location, age, occupation) => `市街化調整区域の土地で、売れにくいと諦めていました。しかしURICOで紹介された地元業者が、適正価格で購入してくれました。地域の事情に詳しい業者とマッチングできるのがURICOの強みだと感じました。`,

  (location, age, occupation) => `境界確定が未了で、売却できないと言われていました。URICOの担当者が測量士を紹介してくれて、境界確定から売却まで一貫してサポートしてもらえました。複雑な手続きも安心して進められました。`,

  (location, age, occupation) => `父から相続した山林を何とか売却したいと思っていました。通常では買い手がつかない物件でしたが、URICOで林業関係の業者を紹介してもらい、想定以上の価格で売却できました。専門的なネットワークがあるのが強みです。`,

  (location, age, occupation) => `駅から遠く不便な場所で、大手では査定すらしてもらえませんでした。URICOを通じて地元密着の不動産会社と繋がり、適正価格で売却できました。地域のニーズを理解している業者とマッチングできるのが良かったです。`,

  (location, age, occupation) => `雑種地で地目変更が必要でしたが、手続きが複雑で困っていました。URICOで紹介された司法書士が全て対応してくれて、スムーズに売却できました。${age}歳の私にとって、専門家のサポートは心強かったです。`
];

function generateLandVoice(index) {
  const location = getRandomCity();
  const mokuteki = randomChoice(landMokuteki);
  const menseki = `${randomInt(50, 500)}㎡`;
  const tokki = randomChoice(landTokki);
  const age = randomInt(25, 80);
  const occupation = randomChoice(occupations);
  const voiceText = randomChoice(landVoicePatterns)(location, age, occupation);
  const graphNum = String(index).padStart(3, '0');

  return `<div class="voice-card">
    <div class="voice-card-header">
        <div class="voice-location">${location}</div>
        <div class="voice-specs">
            <span class="voice-spec">${mokuteki}</span>
            <span class="voice-spec">${menseki}</span>
            <span class="voice-spec">${tokki}</span>
        </div>
    </div>
    <div class="voice-card-body">
        <div class="voice-top-section">
            <div class="voice-content">
                <p class="voice-text">${voiceText}</p>
            </div>
        </div>
        <div class="voice-graph">
            <img src="./images/voice-tochi-graph-${graphNum}.jpg" alt="売却グラフ">
        </div>
        <div class="voice-person-info">
            <span class="person-occupation">${occupation}</span>
            <span class="person-age">${age}歳</span>
        </div>
    </div>
</div>`;
}

// ===========================
// メイン処理
// ===========================

console.log('お客様の声を生成中...\n');

// 戸建1000件生成
console.log('【戸建】1000件生成中...');
let houseContent = '';
for (let i = 1; i <= 1000; i++) {
  houseContent += generateHouseVoice(i) + '\n\n';
  if (i % 100 === 0) console.log(`  ${i}件完了`);
}
fs.writeFileSync('./voice-kodate-content.html', houseContent, 'utf-8');
console.log('✓ 戸建1000件完了: voice-kodate-content.html\n');

// 土地1000件生成
console.log('【土地】1000件生成中...');
let landContent = '';
for (let i = 1; i <= 1000; i++) {
  landContent += generateLandVoice(i) + '\n\n';
  if (i % 100 === 0) console.log(`  ${i}件完了`);
}
fs.writeFileSync('./voice-tochi-content.html', landContent, 'utf-8');
console.log('✓ 土地1000件完了: voice-tochi-content.html\n');

console.log('=== 全て完了 ===');
console.log('戸建: voice-kodate-content.html');
console.log('土地: voice-tochi-content.html');
