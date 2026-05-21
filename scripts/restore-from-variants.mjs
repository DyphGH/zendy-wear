#!/usr/bin/env node
/**
 * Restaura masters a partir de *-1600.jpeg (gerados 16 Mai, antes do prepare-collar).
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'assets', 'img', 'products');
const SRC = join(DIR, 'source');

const NAMES = [
  'Detail_Collar',
  'Logo_Front',
  'Heads_Back',
  'Sun_Back',
  'Skull_Back',
];

async function main() {
  await mkdir(SRC, { recursive: true });
  console.log('\nRestaurar JPEG a partir das variantes -1600 (16 Mai)…\n');
  for (const name of NAMES) {
    const variant = join(DIR, `${name}-1600.jpeg`);
    const master = join(DIR, `${name}.jpeg`);
    if (!existsSync(variant)) {
      console.warn(`  ⚠ falta ${name}-1600.jpeg`);
      continue;
    }
    await copyFile(variant, master);
    await copyFile(variant, join(SRC, `${name}.jpeg`));
    console.log(`  ✓ ${name}.jpeg ← ${name}-1600.jpeg`);
  }
  console.log('\nFeito. Opcional: npm run optimize (regenera AVIF/WebP)\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
