const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const translations = require(path.join(root, 'src/locales/translations.json'));
const keys = require(path.join(root, 'src/locales/source-keys.json'));
const locales = ['en', 'de', 'fr', 'ko', 'zh-CN', 'ja', 'ru', 'it'];
const errors = [];

for (const locale of locales) {
  const catalog = translations[locale];
  if (!catalog) { errors.push(`Missing locale: ${locale}`); continue; }
  for (const key of keys) {
    const value = catalog[key];
    if (!value) { errors.push(`${locale}: missing ${JSON.stringify(key)}`); continue; }
    if (/\r|\n/.test(value)) errors.push(`${locale}: merged translation for ${JSON.stringify(key)}`);
    const sourceSlots = [...key.matchAll(/\{\d+\}/g)].map((match) => match[0]).sort().join(',');
    const targetSlots = [...value.matchAll(/\{\d+\}/g)].map((match) => match[0]).sort().join(',');
    if (sourceSlots !== targetSlots) errors.push(`${locale}: placeholder mismatch for ${JSON.stringify(key)}`);
  }
}

const dynamicKeys = new Set();
const missingVisibleText = new Set();
function walk(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) { if (item.name !== 'locales') walk(file); continue; }
    if (!/\.tsx?$/.test(item.name)) continue;
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isJsxText(node)) {
        const text = node.getText(source).replace(/\s+/g, ' ').trim();
        if (/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(text) && !keys.includes(text)) missingVisibleText.add(text);
      }
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'localizeFormat') {
        const key = node.arguments[0];
        if (key && ts.isStringLiteral(key)) dynamicKeys.add(key.text);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
walk(path.join(root, 'src'));
for (const key of dynamicKeys) {
  if (!keys.includes(key)) errors.push(`Unindexed formatted text: ${JSON.stringify(key)}`);
}
for (const text of missingVisibleText) errors.push(`Untranslated visible text: ${JSON.stringify(text)}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${locales.length} languages, ${keys.length} strings, ${dynamicKeys.size} formatted messages verified.`);
}
