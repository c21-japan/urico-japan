#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Helper function to recursively find all JSON files
function findJsonFiles(dir) {
  let results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results = results.concat(findJsonFiles(fullPath));
      } else if (item.isFile() && item.name.endsWith('.json')) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
  return results;
}

// Read occupation list
const occupationList = JSON.parse(fs.readFileSync('/Users/milk/urico-kansai/prompts/occupation_list.json', 'utf8'));
const occupations = occupationList.occupations;

// Global ID counter
let globalIdCounter = 1;

// Statistics tracking
const stats = {
  filesProcessed: 0,
  totalBuyers: 0,
  errors: [],
  distributions: {
    family: {},
    age: {},
    occupation: {},
    timing: {},
    method: {},
    reason: {},
    ng: {},
    purpose: {},
    landArea: {},
    walkingDistance: {}
  }
};

// Helper function to select random item based on weights
function weightedRandom(choices) {
  const total = choices.reduce((sum, [_, weight]) => sum + weight, 0);
  const rand = Math.random() * total;
  let sum = 0;
  for (const [value, weight] of choices) {
    sum += weight;
    if (rand < sum) return value;
  }
  return choices[choices.length - 1][0];
}

// Generate age based on family structure
function generateAge(family) {
  const ageRanges = {
    "単身": [28, 45],
    "夫婦": [30, 55],
    "夫婦+子供1人": [30, 50],
    "夫婦+子供2人": [32, 52],
    "夫婦+子供3人": [33, 53],
    "三世代同居希望": [35, 60],
    "親との同居予定": [35, 60]
  };

  const [min, max] = ageRanges[family];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Select family based on purpose
function selectFamilyByPurpose(purpose, reason) {
  // Special case: if reason is "二世帯住宅を建てたい", increase probability of multi-generation family
  if (reason === "二世帯住宅を建てたい") {
    return weightedRandom([
      ["三世代同居希望", 40],
      ["親との同居予定", 30],
      ["夫婦+子供2人", 15],
      ["夫婦+子供3人", 10],
      ["夫婦+子供1人", 5]
    ]);
  }

  // Business/investment land - allow all family types
  if (purpose === "事業用地" || purpose === "投資用地" || purpose === "駐車場用地") {
    return weightedRandom([
      ["夫婦", 30],
      ["単身", 25],
      ["夫婦+子供2人", 20],
      ["夫婦+子供1人", 15],
      ["夫婦+子供3人", 10]
    ]);
  }

  // Two-generation housing - must be compatible family
  if (purpose === "二世帯住宅") {
    return weightedRandom([
      ["三世代同居希望", 35],
      ["親との同居予定", 25],
      ["夫婦+子供2人", 20],
      ["夫婦+子供3人", 15],
      ["夫婦+子供1人", 5]
    ]);
  }

  // Default distribution
  return weightedRandom([
    ["夫婦+子供2人", 32],
    ["夫婦+子供1人", 25],
    ["夫婦", 12],
    ["夫婦+子供3人", 12],
    ["単身", 8],
    ["三世代同居希望", 6],
    ["親との同居予定", 5]
  ]);
}

// Select purpose
function selectPurpose() {
  return weightedRandom([
    ["戸建住宅", 70],
    ["二世帯住宅", 12],
    ["賃貸併用住宅", 5],
    ["事業用地", 3],
    ["投資用地", 2],
    ["駐車場用地", 3],
    ["その他", 5]
  ]);
}

// Select reason based on purpose
function selectReasonByPurpose(purpose) {
  if (purpose === "二世帯住宅") {
    return Math.random() < 0.7 ? "二世帯住宅を建てたい" : weightedRandom([
      ["実家の近く", 40],
      ["広い家を建てたい", 30],
      ["注文住宅を建てたい", 20],
      ["新築戸建を建てたい", 10]
    ]);
  }

  if (purpose === "事業用地") {
    return "事業用地として";
  }

  if (purpose === "投資用地") {
    return "投資用地として";
  }

  if (purpose === "駐車場用地") {
    return weightedRandom([
      ["資産形成", 50],
      ["駐車場が必要", 30],
      ["投資用地として", 20]
    ]);
  }

  // Default distribution for residential
  return weightedRandom([
    ["新築戸建を建てたい", 25],
    ["注文住宅を建てたい", 20],
    ["子供の学区", 10],
    ["実家の近く", 8],
    ["広い家を建てたい", 8],
    ["庭付きの家を建てたい", 6],
    ["資産形成", 5],
    ["静かな環境", 3],
    ["二世帯住宅を建てたい", 8],
    ["駐車場が必要", 2],
    ["ペットを飼いたい", 2],
    ["リモートワーク環境", 1],
    ["将来的な転売", 1],
    ["事業用地として", 0.5],
    ["投資用地として", 0.5]
  ]);
}

// Select occupation based on age, family, and purpose
function selectOccupation(age, family, purpose) {
  // Filter by age restrictions
  let availableOccupations = occupations.filter(occ => {
    if (occ.id === 49 && age < 57) return false; // パート・アルバイト
    if (occ.id === 50 && age < 67) return false; // 無職
    return true;
  });

  const stableIncomeIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 28, 29, 31, 32, 33];
  const businessOwnerIds = [26, 27, 28, 29, 31, 32, 33];

  // Business/investment land - prioritize business owners (60%)
  if (purpose === "事業用地" || purpose === "投資用地") {
    if (Math.random() < 0.6) {
      const businessOccs = availableOccupations.filter(occ => businessOwnerIds.includes(occ.id));
      if (businessOccs.length > 0) {
        availableOccupations = businessOccs;
      }
    }
  } else {
    // Residential - prioritize stable income (80%)
    if (Math.random() < 0.8) {
      const stableOccs = availableOccupations.filter(occ => stableIncomeIds.includes(occ.id));
      if (stableOccs.length > 0) {
        availableOccupations = stableOccs;
      }
    }
  }

  // Random selection
  const selected = availableOccupations[Math.floor(Math.random() * availableOccupations.length)];
  return selected.name;
}

// Map old timing values to new standardized values
function mapTiming(oldTiming) {
  const timingMap = {
    "即時": "即時",
    "3ヶ月後": "3ヶ月以内",
    "6ヶ月後": "6ヶ月以内",
    "1年後": "1年以内",
    "相談": "良い物件があれば",
    "3ヶ月以内": "3ヶ月以内",
    "6ヶ月以内": "6ヶ月以内",
    "1年以内": "1年以内",
    "良い物件があれば": "良い物件があれば"
  };

  return timingMap[oldTiming] || "良い物件があれば";
}

// Select purchase method based on occupation and purpose
function selectMethod(occupation, purpose) {
  const highIncomeOccupations = ["医師", "歯科医師", "経営者・役員", "不動産業", "建設業"];

  if (highIncomeOccupations.includes(occupation)) {
    return weightedRandom([
      ["現金購入", 50],
      ["住宅ローン", 30],
      ["親族の援助あり", 15],
      ["買い替え", 5]
    ]);
  }

  if (purpose === "事業用地" || purpose === "投資用地") {
    return weightedRandom([
      ["現金購入", 60],
      ["住宅ローン", 25],
      ["親族の援助あり", 10],
      ["買い替え", 5]
    ]);
  }

  const stableOccupations = ["公務員（国家公務員）", "公務員（地方公務員）", "教員（小・中・高校）", "会社員（管理職）"];

  if (stableOccupations.includes(occupation)) {
    return weightedRandom([
      ["住宅ローン", 60],
      ["親族の援助あり", 20],
      ["現金購入", 15],
      ["買い替え", 5]
    ]);
  }

  // Default
  return weightedRandom([
    ["住宅ローン", 50],
    ["現金購入", 25],
    ["親族の援助あり", 15],
    ["買い替え", 10]
  ]);
}

// Select NG condition
function selectNG() {
  return weightedRandom([
    ["特になし", 45],
    ["再建築不可", 8],
    ["接道不良", 8],
    ["隣地との境界未確定", 7],
    ["市街化調整区域", 6],
    ["傾斜地", 6],
    ["水害リスクエリア", 6],
    ["地盤が弱い", 5],
    ["墓地や葬儀場の近く", 4],
    ["高圧線下", 3],
    ["不整形地", 2]
  ]);
}

// Select land area based on family, purpose, and reason
function selectLandArea(family, purpose, reason) {
  // Parking lot land
  if (purpose === "駐車場用地") {
    return weightedRandom([
      ["51〜150㎡", 40],
      ["151〜300㎡", 50],
      ["301㎡以上", 10]
    ]);
  }

  // Business/investment land
  if (purpose === "事業用地" || purpose === "投資用地") {
    return weightedRandom([
      ["151〜300㎡", 40],
      ["301㎡以上", 60]
    ]);
  }

  // Two-generation housing or large families
  if (purpose === "二世帯住宅" || family === "三世代同居希望" || family === "夫婦+子供3人") {
    return weightedRandom([
      ["151〜300㎡", 50],
      ["301㎡以上", 50]
    ]);
  }

  // Single or couple
  if (family === "単身" || family === "夫婦") {
    return weightedRandom([
      ["〜50㎡", 10],
      ["51〜150㎡", 40],
      ["151〜300㎡", 40],
      ["301㎡以上", 10]
    ]);
  }

  // Large house desire
  if (reason === "庭付きの家を建てたい" || reason === "ペットを飼いたい" || reason === "広い家を建てたい") {
    return Math.random() < 0.9 ? (Math.random() < 0.6 ? "151〜300㎡" : "301㎡以上") : "51〜150㎡";
  }

  // Default
  return weightedRandom([
    ["〜50㎡", 5],
    ["51〜150㎡", 25],
    ["151〜300㎡", 45],
    ["301㎡以上", 25]
  ]);
}

// Select walking distance based on reason and purpose
function selectWalkingDistance(reason, purpose) {
  // Business/parking lot - prioritize near station
  if (purpose === "事業用地" || purpose === "駐車場用地") {
    return weightedRandom([
      ["駅徒歩10分以内", 40],
      ["駅徒歩11〜15分", 30],
      ["駅徒歩16〜20分", 15],
      ["駅徒歩21分以上", 15]
    ]);
  }

  // School district or near family - station distance not important
  if (reason === "子供の学区" || reason === "実家の近く") {
    return weightedRandom([
      ["駅徒歩10分以内", 25],
      ["駅徒歩11〜15分", 25],
      ["駅徒歩16〜20分", 25],
      ["駅徒歩21分以上", 25]
    ]);
  }

  // Quiet environment - prefer far from station
  if (reason === "静かな環境") {
    return weightedRandom([
      ["駅徒歩10分以内", 15],
      ["駅徒歩11〜15分", 20],
      ["駅徒歩16〜20分", 25],
      ["駅徒歩21分以上", 40]
    ]);
  }

  // Default - equal distribution
  return weightedRandom([
    ["駅徒歩10分以内", 25],
    ["駅徒歩11〜15分", 25],
    ["駅徒歩16〜20分", 25],
    ["駅徒歩21分以上", 25]
  ]);
}

// Process single buyer
function processBuyer(existingBuyer) {
  // 1. Select purpose first (determines many other fields)
  const purpose = selectPurpose();

  // 2. Select reason (aligned with purpose)
  const reason = selectReasonByPurpose(purpose);

  // 3. Select family (aligned with purpose/reason)
  const family = selectFamilyByPurpose(purpose, reason);

  // 4. Generate age (based on family)
  const age = generateAge(family);

  // 5. Select occupation (based on age, purpose)
  const occupation = selectOccupation(age, family, purpose);

  // 6. Map existing timing value
  const timing = mapTiming(existingBuyer.timing);

  // 7. Select method (based on occupation and purpose)
  const method = selectMethod(occupation, purpose);

  // 8. Select NG condition
  const ng = selectNG();

  // 9. Select land area (aligned with family/purpose/reason)
  const landArea = selectLandArea(family, purpose, reason);

  // 10. Select walking distance (adjusted by reason/purpose)
  const walkingDistance = selectWalkingDistance(reason, purpose);

  // 11. Generate new ID
  const id = `TO-${String(globalIdCounter).padStart(5, '0')}`;
  globalIdCounter++;

  // Track statistics
  stats.distributions.family[family] = (stats.distributions.family[family] || 0) + 1;
  stats.distributions.age[`${age}歳`] = (stats.distributions.age[`${age}歳`] || 0) + 1;
  stats.distributions.occupation[occupation] = (stats.distributions.occupation[occupation] || 0) + 1;
  stats.distributions.timing[timing] = (stats.distributions.timing[timing] || 0) + 1;
  stats.distributions.method[method] = (stats.distributions.method[method] || 0) + 1;
  stats.distributions.reason[reason] = (stats.distributions.reason[reason] || 0) + 1;
  stats.distributions.ng[ng] = (stats.distributions.ng[ng] || 0) + 1;
  stats.distributions.purpose[purpose] = (stats.distributions.purpose[purpose] || 0) + 1;
  stats.distributions.landArea[landArea] = (stats.distributions.landArea[landArea] || 0) + 1;
  stats.distributions.walkingDistance[walkingDistance] = (stats.distributions.walkingDistance[walkingDistance] || 0) + 1;

  return {
    id,
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

// Process single file
function processFile(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!Array.isArray(data)) {
      stats.errors.push(`${filePath}: Not an array`);
      return;
    }

    const newBuyers = data.map(buyer => processBuyer(buyer));

    fs.writeFileSync(filePath, JSON.stringify(newBuyers, null, 2), 'utf8');

    stats.filesProcessed++;
    stats.totalBuyers += newBuyers.length;

    if (stats.filesProcessed % 50 === 0) {
      console.log(`Processed ${stats.filesProcessed} files, ${stats.totalBuyers} buyers...`);
    }
  } catch (error) {
    stats.errors.push(`${filePath}: ${error.message}`);
  }
}

// Calculate percentage distribution
function calculateDistribution(field) {
  const counts = stats.distributions[field];
  const total = stats.totalBuyers;
  const result = {};

  for (const [key, count] of Object.entries(counts)) {
    result[key] = {
      count,
      percentage: ((count / total) * 100).toFixed(2) + '%'
    };
  }

  return result;
}

// Main execution
function main() {
  console.log('Starting land buyer data generation...');
  console.log(`Occupation list loaded: ${occupations.length} occupations`);

  // Get all files
  const areaFiles = findJsonFiles('/Users/milk/urico-kansai/data/land/area');
  const stationFiles = findJsonFiles('/Users/milk/urico-kansai/data/land/station');
  const allFiles = [...areaFiles, ...stationFiles];

  console.log(`Found ${allFiles.length} files to process`);
  console.log('');

  // Process all files
  for (const filePath of allFiles) {
    processFile(filePath);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('PROCESSING COMPLETE');
  console.log('='.repeat(80));
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Total buyers updated: ${stats.totalBuyers}`);
  console.log(`Errors: ${stats.errors.length}`);
  console.log('');

  if (stats.errors.length > 0) {
    console.log('ERRORS:');
    stats.errors.forEach(err => console.log(`  - ${err}`));
    console.log('');
  }

  // Display distribution statistics
  console.log('DISTRIBUTION STATISTICS:');
  console.log('');

  console.log('Purpose (利用目的):');
  const purposeDist = calculateDistribution('purpose');
  for (const [key, val] of Object.entries(purposeDist).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${key}: ${val.count} (${val.percentage})`);
  }
  console.log('');

  console.log('Family (家族構成):');
  const familyDist = calculateDistribution('family');
  for (const [key, val] of Object.entries(familyDist).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${key}: ${val.count} (${val.percentage})`);
  }
  console.log('');

  console.log('Timing (購入時期):');
  const timingDist = calculateDistribution('timing');
  for (const [key, val] of Object.entries(timingDist).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${key}: ${val.count} (${val.percentage})`);
  }
  console.log('');

  console.log('Method (購入方法):');
  const methodDist = calculateDistribution('method');
  for (const [key, val] of Object.entries(methodDist).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${key}: ${val.count} (${val.percentage})`);
  }
  console.log('');

  console.log('Land Area (希望土地面積):');
  const landAreaDist = calculateDistribution('landArea');
  const landAreaOrder = ['〜50㎡', '51〜150㎡', '151〜300㎡', '301㎡以上'];
  for (const key of landAreaOrder) {
    const val = landAreaDist[key];
    if (val) {
      console.log(`  ${key}: ${val.count} (${val.percentage})`);
    }
  }
  console.log('');

  console.log('Walking Distance (駅徒歩):');
  const walkingDist = calculateDistribution('walkingDistance');
  const walkingOrder = ['駅徒歩10分以内', '駅徒歩11〜15分', '駅徒歩16〜20分', '駅徒歩21分以上'];
  for (const key of walkingOrder) {
    const val = walkingDist[key];
    if (val) {
      console.log(`  ${key}: ${val.count} (${val.percentage})`);
    }
  }
  console.log('');

  console.log('Top 10 Occupations (職業):');
  const occupationDist = calculateDistribution('occupation');
  const topOccupations = Object.entries(occupationDist)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  for (const [key, val] of topOccupations) {
    console.log(`  ${key}: ${val.count} (${val.percentage})`);
  }
  console.log('');

  console.log('Top 10 Reasons (購入理由):');
  const reasonDist = calculateDistribution('reason');
  const topReasons = Object.entries(reasonDist)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  for (const [key, val] of topReasons) {
    console.log(`  ${key}: ${val.count} (${val.percentage})`);
  }
  console.log('');

  console.log('NG Conditions (NG条件):');
  const ngDist = calculateDistribution('ng');
  const topNG = Object.entries(ngDist)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);
  for (const [key, val] of topNG) {
    console.log(`  ${key}: ${val.count} (${val.percentage})`);
  }
  console.log('');

  console.log('='.repeat(80));
  console.log('All files have been updated successfully!');
  console.log('='.repeat(80));
}

main();
