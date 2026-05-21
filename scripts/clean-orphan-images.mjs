#!/usr/bin/env node
/**
 * clean-orphan-images.mjs — remove cut-print assets from products/ (Drop 001).
 *
 * Keeps only:
 *   Detail_Collar, Logo_Front, Heads_Back, Sun_Back, Skull_Back
 *   (+ their -400/-800/-1600 .avif/.webp/.jpeg variants)
 *
 * Removes (and optionally moves masters to _archive/):
 *   Hand_Back, Eye_Back, Snake_Back
 *
 * USAGE:
 *   npm run clean:images              # delete orphans + refresh manifest.json
 *   npm run clean:images -- --dry-run # list only, no changes
 *   npm run clean:images -- --move-archive  # move master JPEG/PNG to _archive/ first
 */

import { readdir, unlink, rename, stat, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, parse, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS_DIR = join(ROOT, 'assets', 'img', 'products');
const SOURCE_DIR = join(PRODUCTS_DIR, 'source');
const ARCHIVE_DIR = join(ROOT, 'assets', 'img', '_archive');

/** Drop 001 — must match index.html + LEIA-ME.txt */
const KEEP_BASES = new Set([
  'Detail_Collar',
  'Logo_Front',
  'Heads_Back',
  'Sun_Back',
  'Skull_Back',
]);

/** Cut from the collection — see assets/img/_archive/README.md */
const ORPHAN_BASES = new Set(['Hand_Back', 'Eye_Back', 'Snake_Back']);

const VARIANT_RE = /^(.+)-(400|800|1600)\.(avif|webp|jpe?g|png)$/i;
const SOURCE_RE = /^(.+)\.(jpe?g|png)$/i;
const SKIP_NAMES = new Set(['manifest.json', 'LEIA-ME.txt', 'README.md']);

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const moveArchive = args.has('--move-archive');

const ok = (msg) => console.log('  ✓', msg);
const warn = (msg) => console.warn('  ⚠', msg);
const info = (msg) => console.log('  ·', msg);

function baseNameOf(filename) {
  const variant = VARIANT_RE.exec(filename);
  if (variant) return variant[1];
  const source = SOURCE_RE.exec(filename);
  if (source) return source[1];
  return null;
}

function isMasterImage(filename) {
  return SOURCE_RE.test(filename) && !VARIANT_RE.test(filename);
}

async function ensureArchiveDir() {
  if (!existsSync(ARCHIVE_DIR)) await mkdir(ARCHIVE_DIR, { recursive: true });
}

async function collectFiles(dir) {
  if (!existsSync(dir)) return [];
  const names = await readdir(dir);
  const out = [];
  for (const name of names) {
    if (SKIP_NAMES.has(name)) continue;
    const full = join(dir, name);
    const s = await stat(full);
    if (s.isFile()) out.push({ dir, name, full });
  }
  return out;
}

async function removeFile(full, label) {
  if (dryRun) {
    info(`[dry-run] would delete ${label}`);
    return;
  }
  await unlink(full);
  ok(`deleted ${label}`);
}

async function moveToArchive(full, name) {
  await ensureArchiveDir();
  const dest = join(ARCHIVE_DIR, name);
  if (existsSync(dest)) {
    warn(`archive already has ${name} — deleting ${full}`);
    if (!dryRun) await unlink(full);
    return;
  }
  if (dryRun) {
    info(`[dry-run] would move → _archive/${name}`);
    return;
  }
  await rename(full, dest);
  ok(`moved → _archive/${name}`);
}

async function rebuildManifest() {
  const files = await readdir(PRODUCTS_DIR);
  const sources = files.filter(
    (f) => SOURCE_RE.test(f) && !VARIANT_RE.test(f) && KEEP_BASES.has(baseNameOf(f)),
  );
  const manifest = {};
  for (const f of sources) {
    const base = parse(f).name;
    const widths = [];
    for (const w of [400, 800, 1600]) {
      const any = ['avif', 'webp', 'jpeg'].some((ext) =>
        existsSync(join(PRODUCTS_DIR, `${base}-${w}.${ext}`)),
      );
      if (any) widths.push(w);
    }
    if (widths.length) manifest[base] = widths.sort((a, b) => a - b);
  }
  const manifestPath = join(PRODUCTS_DIR, 'manifest.json');
  const body = `${JSON.stringify(manifest, null, 2)}\n`;
  if (dryRun) {
    info(`[dry-run] would write manifest.json → ${Object.keys(manifest).join(', ')}`);
    return;
  }
  await writeFile(manifestPath, body, 'utf8');
  ok(`manifest.json (${Object.keys(manifest).length} products)`);
}

async function processDirectory(dir, relLabel) {
  const files = await collectFiles(dir);
  let removed = 0;

  for (const { name, full } of files) {
    const base = baseNameOf(name);
    if (!base) {
      warn(`skip unrecognized file: ${relLabel}/${name}`);
      continue;
    }

    if (KEEP_BASES.has(base)) continue;

    if (ORPHAN_BASES.has(base)) {
      if (moveArchive && isMasterImage(name) && dir === PRODUCTS_DIR) {
        await moveToArchive(full, name);
      } else {
        await removeFile(full, `${relLabel}/${name}`);
      }
      removed += 1;
      continue;
    }

    warn(`unknown base "${base}" in ${relLabel}/${name} — not in KEEP or ORPHAN list (manual review)`);
  }

  return removed;
}

async function main() {
  console.log('Zendy Wear — clean orphan product images\n');
  if (dryRun) warn('DRY RUN — no files changed\n');
  if (moveArchive && !dryRun) info('Masters will move to assets/img/_archive/ when possible\n');

  let total = 0;
  total += await processDirectory(PRODUCTS_DIR, 'products');
  total += await processDirectory(SOURCE_DIR, 'products/source');

  console.log(`\nRemoved or moved: ${total} file(s)`);
  console.log('\nRegenerating manifest from kept sources:');
  await rebuildManifest();

  console.log('\nDone.');
  if (!dryRun && total > 0) {
    console.log('Tip: hard-refresh the site (Ctrl+Shift+R) to pick up manifest.json.\n');
  } else if (dryRun) {
    console.log('Run without --dry-run to apply.\n');
  }
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
