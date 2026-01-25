const fs = require('fs');
const path = require('path');

// ===========================
// ヘルパー関数
// ===========================

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`ファイルが見つかりません: ${filePath}`);
    process.exit(1);
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`JSON解析エラー: ${filePath}`, error.message);
    process.exit(1);
  }
}

function writeJSON(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function weightedRandomChoice(options) {
  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  let random = Math.random() * totalWeight;

  for (const opt of options) {
    random -= opt.weight;
    if (random <= 0) {
      return opt.value;
    }
  }

  return options[0].value;
}

// ===========================
// マスターデータ読み込み
// ===========================

console.log('マスターデータを読み込み中...');

const areaTownData = readJSON('./area_town_data.json');
const occupationList = readJSON('./occupation_list.json');

console.log('✓ マスターデータ読み込み完了');

// ===========================
// 購入希望者数の決定
// ===========================

function determineBuyerCount(town) {
  // 主要エリアは40〜63件、その他は16〜39件
  const majorTowns = [
    "学園南", "学園北", "富雄元町", "西大寺本町", "三条本町",
    "梅田", "心斎橋", "難波", "本町", "三宮町", "元町通",
    "四条烏丸", "河原町", "祇園", "北山", "嵐山",
    "広陵町", "香芝市", "大和高田市"
  ];

  if (majorTowns.some(major => town.includes(major))) {
    return randomInt(40, 63);
  }

  return randomInt(16, 39);
}

// ===========================
// 戸建購入希望者生成
// ===========================

function generateHouseBuyer(globalId, occupationList) {
  // 家族構成
  const familyOptions = [
    { value: "単身", weight: 10 },
    { value: "夫婦", weight: 15 },
    { value: "夫婦+子供1人", weight: 25 },
    { value: "夫婦+子供2人", weight: 30 },
    { value: "夫婦+子供3人", weight: 10 },
    { value: "三世代同居希望", weight: 5 },
    { value: "親との同居予定", weight: 5 }
  ];
  const family = weightedRandomChoice(familyOptions);

  // 年齢（家族構成に応じた範囲）
  const ageRanges = {
    "単身": [25, 45],
    "夫婦": [30, 55],
    "夫婦+子供1人": [30, 50],
    "夫婦+子供2人": [30, 50],
    "夫婦+子供3人": [30, 50],
    "三世代同居希望": [35, 60],
    "親との同居予定": [35, 60]
  };
  const [minAge, maxAge] = ageRanges[family];
  const age = randomInt(minAge, maxAge);

  // 職業（年齢制限を考慮）
  const availableOccupations = occupationList.occupations.filter(occ => {
    if (occ.id === 49 && age < 57) return false; // パート・アルバイトは57歳以上
    if (occ.id === 50 && age < 67) return false; // 無職は67歳以上
    return true;
  });
  const occupation = randomChoice(availableOccupations).name;

  // 購入時期
  const timingOptions = [
    { value: "即時", weight: 20 },
    { value: "3ヶ月以内", weight: 25 },
    { value: "6ヶ月以内", weight: 30 },
    { value: "1年以内", weight: 15 },
    { value: "良い物件があれば", weight: 10 }
  ];
  const timing = weightedRandomChoice(timingOptions);

  // 購入方法
  const methodOptions = [
    { value: "現金購入", weight: 15 },
    { value: "住宅ローン", weight: 60 },
    { value: "親族の援助あり", weight: 15 },
    { value: "買い替え", weight: 10 }
  ];
  const method = weightedRandomChoice(methodOptions);

  // 購入理由
  const reasonOptions = [
    "通勤の利便性", "子供の学区", "実家の近く", "広い家が欲しい",
    "庭付きの家が欲しい", "戸建に住みたい", "資産形成", "両親との同居",
    "静かな環境", "駐車場が必要", "ペットを飼いたい", "リモートワーク環境"
  ];
  const reason = randomChoice(reasonOptions);

  // NG条件
  const ngOptions = [
    { value: "特になし", weight: 50 },
    { value: "再建築不可", weight: 5 },
    { value: "旧耐震基準", weight: 6 },
    { value: "接道不良", weight: 5 },
    { value: "事故物件", weight: 6 },
    { value: "隣地との境界未確定", weight: 5 },
    { value: "傾斜地", weight: 5 },
    { value: "水害リスクエリア", weight: 6 },
    { value: "墓地や葬儀場の近く", weight: 5 },
    { value: "大規模な修繕が必要", weight: 7 }
  ];
  const ng = weightedRandomChoice(ngOptions);

  // 希望築年数（「特に希望なし」を追加）
  const buildingAgeOptions = [
    { value: "築15年まで", weight: 25 },
    { value: "築16〜25年", weight: 25 },
    { value: "築26〜35年", weight: 20 },
    { value: "築36年以上", weight: 10 },
    { value: "特に希望なし", weight: 20 }
  ];
  const buildingAge = weightedRandomChoice(buildingAgeOptions);

  // 希望間取り（家族構成と整合性を持たせる）
  let layout;
  if (family === "単身") {
    layout = randomChoice(["2LDKまで", "特に希望なし"]);
  } else if (family === "夫婦") {
    layout = randomChoice(["2LDKまで", "3LDK〜5LDK", "特に希望なし"]);
  } else if (family.includes("子供3人") || family.includes("三世代")) {
    layout = randomChoice(["3LDK〜5LDK", "5LDK以上", "特に希望なし"]);
  } else {
    const layoutOptions = [
      { value: "特に希望なし", weight: 30 },
      { value: "2LDKまで", weight: 10 },
      { value: "3LDK〜5LDK", weight: 45 },
      { value: "5LDK以上", weight: 15 }
    ];
    layout = weightedRandomChoice(layoutOptions);
  }

  // 希望土地面積（「特に希望なし」を追加）
  let landArea;
  if (family === "単身" || family === "夫婦") {
    const landAreaOptions = [
      { value: "〜50㎡", weight: 8 },
      { value: "51〜150㎡", weight: 35 },
      { value: "151〜300㎡", weight: 35 },
      { value: "301㎡以上", weight: 7 },
      { value: "特に希望なし", weight: 15 }
    ];
    landArea = weightedRandomChoice(landAreaOptions);
  } else {
    const landAreaOptions = [
      { value: "〜50㎡", weight: 3 },
      { value: "51〜150㎡", weight: 20 },
      { value: "151〜300㎡", weight: 40 },
      { value: "301㎡以上", weight: 22 },
      { value: "特に希望なし", weight: 15 }
    ];
    landArea = weightedRandomChoice(landAreaOptions);
  }

  // 駅徒歩（「特に希望なし」を追加）
  const walkingDistanceOptions = [
    { value: "駅徒歩10分以内", weight: 25 },
    { value: "駅徒歩11〜15分", weight: 25 },
    { value: "駅徒歩16〜20分", weight: 20 },
    { value: "駅徒歩21分以上", weight: 10 },
    { value: "特に希望なし", weight: 20 }
  ];
  const walkingDistance = weightedRandomChoice(walkingDistanceOptions);

  return {
    id: `KO-${String(globalId).padStart(5, '0')}`,
    family,
    age: `${age}歳`,
    occupation,
    timing,
    method,
    reason,
    ng,
    buildingAge,
    layout,
    landArea,
    walkingDistance
  };
}

// ===========================
// 土地購入希望者生成
// ===========================

function generateLandBuyer(globalId, occupationList) {
  // 家族構成
  const familyOptions = [
    { value: "単身", weight: 8 },
    { value: "夫婦", weight: 12 },
    { value: "夫婦+子供1人", weight: 25 },
    { value: "夫婦+子供2人", weight: 32 },
    { value: "夫婦+子供3人", weight: 12 },
    { value: "三世代同居希望", weight: 6 },
    { value: "親との同居予定", weight: 5 }
  ];
  const family = weightedRandomChoice(familyOptions);

  // 年齢
  const ageRanges = {
    "単身": [28, 45],
    "夫婦": [30, 55],
    "夫婦+子供1人": [30, 50],
    "夫婦+子供2人": [32, 52],
    "夫婦+子供3人": [33, 53],
    "三世代同居希望": [35, 60],
    "親との同居予定": [35, 60]
  };
  const [minAge, maxAge] = ageRanges[family];
  const age = randomInt(minAge, maxAge);

  // 職業（年齢制限を考慮）
  const availableOccupations = occupationList.occupations.filter(occ => {
    if (occ.id === 49 && age < 57) return false;
    if (occ.id === 50 && age < 67) return false;
    return true;
  });
  const occupation = randomChoice(availableOccupations).name;

  // 購入時期
  const timingOptions = [
    { value: "即時", weight: 15 },
    { value: "3ヶ月以内", weight: 20 },
    { value: "6ヶ月以内", weight: 30 },
    { value: "1年以内", weight: 20 },
    { value: "良い物件があれば", weight: 15 }
  ];
  const timing = weightedRandomChoice(timingOptions);

  // 購入方法
  const methodOptions = [
    { value: "現金購入", weight: 25 },
    { value: "住宅ローン", weight: 50 },
    { value: "親族の援助あり", weight: 15 },
    { value: "買い替え", weight: 10 }
  ];
  const method = weightedRandomChoice(methodOptions);

  // 購入理由
  const reasonOptions = [
    { value: "新築戸建を建てたい", weight: 25 },
    { value: "注文住宅を建てたい", weight: 20 },
    { value: "二世帯住宅を建てたい", weight: 8 },
    { value: "子供の学区", weight: 10 },
    { value: "実家の近く", weight: 8 },
    { value: "広い家を建てたい", weight: 8 },
    { value: "庭付きの家を建てたい", weight: 6 },
    { value: "資産形成", weight: 5 },
    { value: "静かな環境", weight: 3 },
    { value: "駐車場が必要", weight: 2 },
    { value: "ペットを飼いたい", weight: 2 },
    { value: "リモートワーク環境", weight: 1 },
    { value: "将来的な転売", weight: 1 },
    { value: "事業用地として", weight: 0.5 },
    { value: "投資用地として", weight: 0.5 }
  ];
  const reason = weightedRandomChoice(reasonOptions);

  // NG条件
  const ngOptions = [
    { value: "特になし", weight: 45 },
    { value: "再建築不可", weight: 8 },
    { value: "接道不良", weight: 8 },
    { value: "市街化調整区域", weight: 6 },
    { value: "隣地との境界未確定", weight: 7 },
    { value: "傾斜地", weight: 6 },
    { value: "地盤が弱い", weight: 5 },
    { value: "水害リスクエリア", weight: 6 },
    { value: "墓地や葬儀場の近く", weight: 4 },
    { value: "高圧線下", weight: 3 },
    { value: "不整形地", weight: 2 }
  ];
  const ng = weightedRandomChoice(ngOptions);

  // 利用目的
  const purposeOptions = [
    { value: "戸建住宅", weight: 70 },
    { value: "二世帯住宅", weight: 12 },
    { value: "賃貸併用住宅", weight: 5 },
    { value: "事業用地", weight: 3 },
    { value: "投資用地", weight: 2 },
    { value: "駐車場用地", weight: 3 },
    { value: "その他", weight: 5 }
  ];
  const purpose = weightedRandomChoice(purposeOptions);

  // 希望土地面積（「特に希望なし」を追加）
  let landArea;
  if (family === "単身" || family === "夫婦") {
    const landAreaOptions = [
      { value: "〜50㎡", weight: 8 },
      { value: "51〜150㎡", weight: 35 },
      { value: "151〜300㎡", weight: 35 },
      { value: "301㎡以上", weight: 7 },
      { value: "特に希望なし", weight: 15 }
    ];
    landArea = weightedRandomChoice(landAreaOptions);
  } else {
    const landAreaOptions = [
      { value: "〜50㎡", weight: 3 },
      { value: "51〜150㎡", weight: 20 },
      { value: "151〜300㎡", weight: 40 },
      { value: "301㎡以上", weight: 22 },
      { value: "特に希望なし", weight: 15 }
    ];
    landArea = weightedRandomChoice(landAreaOptions);
  }

  // 駅徒歩（「特に希望なし」を追加）
  const walkingDistanceOptions = [
    { value: "駅徒歩10分以内", weight: 25 },
    { value: "駅徒歩11〜15分", weight: 25 },
    { value: "駅徒歩16〜20分", weight: 20 },
    { value: "駅徒歩21分以上", weight: 10 },
    { value: "特に希望なし", weight: 20 }
  ];
  const walkingDistance = weightedRandomChoice(walkingDistanceOptions);

  return {
    id: `TO-${String(globalId).padStart(5, '0')}`,
    family,
    age: `${age}歳`,
    occupation,
    timing,
    method,
    reason,
    ng,
    purpose,
    landArea,
    walkingDistance
  };
}

// ===========================
// メイン処理（エリア別データのみ生成）
// ===========================

let houseIdCounter = 1;
let landIdCounter = 1;

console.log('\n=== 戸建・土地購入希望者データ生成開始 ===\n');

// ===========================
// エリア別データ生成
// ===========================

console.log('【エリア別データ生成】\n');

for (const [prefecture, cities] of Object.entries(areaTownData)) {
  console.log(`--- ${prefecture} ---`);

  for (const [city, towns] of Object.entries(cities)) {

    for (const town of towns) {
      // 戸建データ生成
      const houseBuyerCount = determineBuyerCount(town);
      const houseBuyers = [];

      for (let i = 0; i < houseBuyerCount; i++) {
        houseBuyers.push(generateHouseBuyer(houseIdCounter, occupationList));
        houseIdCounter++;
      }

      const houseAreaPath = `./data/house/area/${prefecture}/${city}/${town}.json`;
      writeJSON(houseAreaPath, houseBuyers);

      // 土地データ生成
      const landBuyerCount = determineBuyerCount(town);
      const landBuyers = [];

      for (let i = 0; i < landBuyerCount; i++) {
        landBuyers.push(generateLandBuyer(landIdCounter, occupationList));
        landIdCounter++;
      }

      const landAreaPath = `./data/land/area/${prefecture}/${city}/${town}.json`;
      writeJSON(landAreaPath, landBuyers);

      console.log(`✓ ${city}/${town} - 戸建:${houseBuyerCount}件, 土地:${landBuyerCount}件`);
    }
  }
}

console.log('\n=== データ生成完了 ===');
console.log(`戸建: ${houseIdCounter - 1}件`);
console.log(`土地: ${landIdCounter - 1}件`);
console.log(`\n※駅別データは生成しません。駅検索時はstation_town_mapping.jsonを参照してエリアデータを取得します。`);
