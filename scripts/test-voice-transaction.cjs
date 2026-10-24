const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/voiceTransaction.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', compiled)(mod, mod.exports, require);
const { parseVoiceTransaction } = mod.exports;

const cases = [
  ['tr', 'Market için 250 lira nakit gider', { type: 'expense', amount: 250, accountType: 'cash', title: 'Market' }],
  ['tr', 'İki yüz elli lira kahve nakit gider', { type: 'expense', amount: 250, accountType: 'cash', title: 'Kahve' }],
  ['tr', 'Maaş 2.500 TL banka gelir', { type: 'income', amount: 2500, accountType: 'bank' }],
  ['en', 'Spent 25 dollars on coffee in cash', { type: 'expense', amount: 25, accountType: 'cash', title: 'Coffee' }],
  ['de', '25 Euro Kaffee bar bezahlt', { type: 'expense', amount: 25, accountType: 'cash', title: 'Kaffee' }],
  ['fr', '25 euros de café en espèces dépense', { type: 'expense', amount: 25, accountType: 'cash' }],
  ['ko', '커피 2500원 현금 지출', { type: 'expense', amount: 2500, accountType: 'cash', title: '커피' }],
  ['zh', '现金支付 25 元咖啡 支出', { type: 'expense', amount: 25, accountType: 'cash' }],
  ['ja', 'コーヒーに現金で250円支出', { type: 'expense', amount: 250, accountType: 'cash', title: 'コーヒー' }],
  ['ru', 'Кофе 250 рублей наличными расход', { type: 'expense', amount: 250, accountType: 'cash' }],
  ['it', '25 euro per un caffè in contanti spesa', { type: 'expense', amount: 25, accountType: 'cash' }],
];

for (const [language, spoken, expected] of cases) {
  const actual = parseVoiceTransaction(spoken, language, []);
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(actual[key], value, `${language}: ${spoken} → ${key} = ${actual[key]}`);
  }
}

const categorized = parseVoiceTransaction('Maaş 2.500 TL banka gelir', 'tr', [
  { name: 'Maaş / Hakediş', type: 'income', localizedName: 'Maaş / Hakediş' },
]);
assert.equal(categorized.category, 'Maaş / Hakediş');
assert.equal(categorized.type, 'income');

console.log(`${cases.length + 1} sesli işlem örneği doğrulandı.`);
