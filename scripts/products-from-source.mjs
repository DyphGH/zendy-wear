#!/usr/bin/env node
/**
 * Copy untouched originals from assets/img/products/source/ → products/.
 * No re-encoding — preserves full quality.
 */
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets', 'img', 'products', 'source');
const OUT = join(ROOT, 'assets', 'img', 'products');

const EXPECTED = [
  'Detail_Collar.jpeg',
  'Logo_Front.jpeg',
  'Heads_Back.jpeg',
  'Sun_Back.jpeg',
  'Skull_Back.jpeg',
];

function printHelp() {
  console.error('\n❌ A pasta source/ está vazia.\n');
  console.error('Coloca aqui os JPEG ORIGINAIS (exportação máxima, antes de scripts do site):\n');
  EXPECTED.forEach((f) => console.error(`   • ${f}`));
  console.error(`\nCaminho:\n   ${SRC}\n`);
  console.error(
    'Nota: copiar os ficheiros que já estão em products/ NÃO melhora a qualidade —\n' +
      'precisas dos masters do Photoshop/câmara (ou OneDrive → Histórico de versões).\n',
  );
}

async function main() {
  if (!existsSync(SRC)) {
    await mkdir(SRC, { recursive: true });
  }
  const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f) && !f.startsWith('.'));
  if (files.length === 0) {
    printHelp();
    process.exit(1);
  }
  console.log('\nA copiar originais (sem recompressão)…\n');
  for (const f of files) {
    await copyFile(join(SRC, f), join(OUT, f));
    console.log('  ✓', f);
  }
  console.log('\nFeito. Corre: npm run optimize\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
