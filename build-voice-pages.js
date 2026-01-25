import fs from 'fs';

console.log('お客様の声ページを構築中...\n');

// 戸建ページを構築
console.log('【戸建】ページ構築中...');
const kodateBase = fs.readFileSync('./kodate-voice-base.html', 'utf-8');
const kodateContent = fs.readFileSync('./voice-kodate-content.html', 'utf-8');
const kodateFinal = kodateBase.replace('<!-- VOICE_CONTENT_HERE -->', kodateContent);
fs.writeFileSync('./voice-kodate.html', kodateFinal, 'utf-8');
console.log('✓ 戸建ページ完了: voice-kodate.html\n');

// 土地ページを構築
console.log('【土地】ページ構築中...');
const tochiBase = fs.readFileSync('./tochi-voice-base.html', 'utf-8');
const tochiContent = fs.readFileSync('./voice-tochi-content.html', 'utf-8');
const tochiFinal = tochiBase.replace('<!-- VOICE_CONTENT_HERE -->', tochiContent);
fs.writeFileSync('./voice-tochi.html', tochiFinal, 'utf-8');
console.log('✓ 土地ページ完了: voice-tochi.html\n');

console.log('=== 全て完了 ===');
