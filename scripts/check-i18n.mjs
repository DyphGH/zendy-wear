import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const i18n = fs.readFileSync(join(root, 'assets/js/i18n.js'), 'utf8');
const html = fs.readFileSync(join(root, 'index.html'), 'utf8');

const ptKeys = new Set();
const enKeys = new Set();
let lang = null;
for (const line of i18n.split('\n')) {
  if (line.includes('  pt: {')) lang = 'pt';
  else if (line.includes('  en: {')) lang = 'en';
  else if (line.trim() === '},' && lang) lang = null;
  else if (lang) {
    const m = line.match(/^\s+'([^']+)':/);
    if (m) (lang === 'pt' ? ptKeys : enKeys).add(m[1]);
  }
}

const htmlKeys = [...html.matchAll(/data-i18n(?:-html|-aria|-placeholder)?="([^"]+)"/g)].map((m) => m[1]);
const missingHtml = [...new Set(htmlKeys)].filter((k) => !ptKeys.has(k));

console.log('PT keys:', ptKeys.size, 'EN keys:', enKeys.size);
console.log('HTML keys missing in PT:', missingHtml);
console.log('In PT not EN:', [...ptKeys].filter((k) => !enKeys.has(k)));
console.log('In EN not PT:', [...enKeys].filter((k) => !ptKeys.has(k)));
