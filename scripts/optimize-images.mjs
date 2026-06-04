#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * optimize-images.mjs — generate responsive image variants for Zendy Wear.
 *
 * For each source JPEG under assets/img/products/, produces:
 *   - resized versions at 400, 800, 1600 px wide
 *   - AVIF and WebP encodings of each size
 *   - keeps the original JPEG untouched as `<name>.jpeg`
 *
 * Also generates:
 *   - favicon PNGs from assets/img/icons/logo.svg
 *   - apple-touch-icon (180×180)
 *   - manifest icons (192, 512)
 *   - og-default.jpg (1200×630) from assets/img/og/og-default.svg
 *
 * USAGE:
 *   1.  npm init -y               (first time only)
 *   2.  npm install --save-dev sharp
 *   3.  node scripts/optimize-images.mjs
 *
 * Or add to package.json:   "scripts": { "optimize": "node scripts/optimize-images.mjs" }
 *
 * Outputs all live next to their sources (we don't move files; we add).
 */

import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, parse, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('\n❌ `sharp` is not installed. Run:\n   npm install --save-dev sharp\n');
  process.exit(1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS_DIR = join(ROOT, 'assets', 'img', 'products');
const ICONS_DIR    = join(ROOT, 'assets', 'img', 'icons');
const OG_DIR       = join(ROOT, 'assets', 'img', 'og');

const WIDTHS = [400, 800, 1600];
const FORMATS = [
  { ext: 'avif', opts: { quality: 62, effort: 6 } },
  { ext: 'webp', opts: { quality: 88, effort: 5 } },
  { ext: 'jpeg', opts: { quality: 92, mozjpeg: true, progressive: true } },
];

const ok   = (msg) => console.log('  ✓', msg);
const warn = (msg) => console.warn('  ⚠', msg);
const err  = (msg) => console.error('  ✗', msg);

async function ensureDir(dir) { if (!existsSync(dir)) await mkdir(dir, { recursive: true }); }

async function processProductImage(srcPath) {
  const { name } = parse(srcPath);
  const meta = await sharp(srcPath).metadata();
  const origW = meta.width || 1600;
  const generated = [];

  for (const w of WIDTHS) {
    if (w > origW) continue; // don't upscale
    for (const fmt of FORMATS) {
      const outPath = join(PRODUCTS_DIR, `${name}-${w}.${fmt.ext}`);
      if (existsSync(outPath)) {
        if (!generated.includes(w)) generated.push(w);
        continue;
      }
      try {
        await sharp(srcPath)
          .resize({ width: w, withoutEnlargement: true })
          .toFormat(fmt.ext, fmt.opts)
          .toFile(outPath);
        ok(`${name}-${w}.${fmt.ext}`);
        if (!generated.includes(w)) generated.push(w);
      } catch (e) {
        err(`${name}-${w}.${fmt.ext} — ${e.message}`);
      }
    }
  }
  return generated.sort((a, b) => a - b);
}

const BRAND_BG = { r: 4, g: 4, b: 10, alpha: 1 };

/** logo.svg is black-on-transparent; PWA/home-screen needs cream on brand bg. */
async function ensureAppIconSvg(logoPath, appIconPath) {
  const { readFile: rf } = await import('node:fs/promises');
  let svg = await rf(logoPath, 'utf8');
  svg = svg.replace(/fill="rgba\(0,0,0,1\)"/gi, 'fill="#f0ede8"');
  if (!svg.includes('fill="#04040a"')) {
    svg = svg.replace(
      /<svg([^>]*)>/,
      '<svg$1>\n  <rect width="1024" height="1024" fill="#04040a"/>',
    );
    svg = svg.replace(/<g>\s*/i, '<g transform="translate(102 102) scale(0.80)">\n  ');
  }
  await writeFile(appIconPath, svg, 'utf8');
  return appIconPath;
}

async function renderSquareIcon(srcPath, outPath, w, { maskable = false, force = false } = {}) {
  if (existsSync(outPath) && !force) return;
  const pad = maskable ? 0.12 : 0.08;
  const inner = Math.round(w * (1 - pad * 2));
  await sharp(srcPath, { density: 384 })
    .resize({ width: inner, height: inner, fit: 'contain', background: BRAND_BG })
    .extend({
      top: Math.round(w * pad),
      bottom: Math.round(w * pad),
      left: Math.round(w * pad),
      right: Math.round(w * pad),
      background: BRAND_BG,
    })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function processFavicons(logoPath, { force = false } = {}) {
  if (!existsSync(logoPath)) { warn(`logo not found at ${logoPath}, skipping favicons`); return; }
  const appIconPath = join(ICONS_DIR, 'app-icon.svg');
  await ensureAppIconSvg(logoPath, appIconPath);
  ok('app-icon.svg (cream mark on #04040a)');

  const sizes = [
    { name: 'favicon-16.png',         w: 16 },
    { name: 'favicon-32.png',         w: 32 },
    { name: 'apple-touch-icon.png',   w: 180 },
    { name: 'icon-192.png',           w: 192 },
    { name: 'icon-512.png',           w: 512 },
    { name: 'icon-maskable-192.png',  w: 192, maskable: true },
    { name: 'icon-maskable-512.png',  w: 512, maskable: true },
  ];
  for (const s of sizes) {
    const out = join(ICONS_DIR, s.name);
    try {
      await renderSquareIcon(appIconPath, out, s.w, { maskable: s.maskable, force });
      ok(s.name);
    } catch (e) {
      err(`${s.name} — ${e.message}`);
    }
  }
}

async function processOgImage({ force = false } = {}) {
  const svgPath = join(OG_DIR, 'og-default.svg');
  const jpgPath = join(OG_DIR, 'og-default.jpg');
  const rootOg = join(ROOT, 'og.jpg');
  if (!existsSync(svgPath)) { warn(`OG template ${svgPath} missing, skipping`); return; }
  if (!force && existsSync(jpgPath) && existsSync(rootOg)) return;
  try {
    const buf = await sharp(svgPath, { density: 192 })
      .resize(1200, 630, { fit: 'cover' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
    await writeFile(jpgPath, buf);
    await writeFile(rootOg, buf);
    ok('og-default.jpg + /og.jpg (1200×630, static-host friendly)');
  } catch (e) { err(`og-default.jpg — ${e.message}`); }
}

async function main() {
  const force = process.argv.includes('--force');
  console.log('Zendy Wear — image optimisation\n');
  await ensureDir(PRODUCTS_DIR);
  await ensureDir(ICONS_DIR);
  await ensureDir(OG_DIR);

  console.log('Products:');
  const files = await readdir(PRODUCTS_DIR);
  const sources = files.filter((f) => /\.(jpe?g|png)$/i.test(f) && !/-(?:400|800|1600)\./.test(f));
  if (sources.length === 0) warn('no source images found in assets/img/products/');
  const manifest = {};
  for (const f of sources) {
    const p = join(PRODUCTS_DIR, f);
    const s = await stat(p);
    if (!s.isFile()) continue;
    const widths = await processProductImage(p);
    if (widths.length > 0) manifest[parse(p).name] = widths;
  }
  const manifestPath = join(PRODUCTS_DIR, 'manifest.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  ok('manifest.json (responsive <picture> srcsets)');

  console.log('\nFavicons:');
  await processFavicons(join(ICONS_DIR, 'logo.svg'), { force });

  console.log('\nOpen Graph:');
  await processOgImage({ force: force || process.argv.includes('--force-og') });

  console.log('\nDone.\n');
}

main().catch((e) => { err(e.stack || e.message); process.exit(1); });
