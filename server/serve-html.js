/**
 * serve-html.js — inject public site URL into index.html + ensure OG JPEG exists.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_PATH = join(ROOT, 'index.html');
const OG_JPG = join(ROOT, 'assets', 'img', 'og', 'og-default.jpg');
const OG_SVG = join(ROOT, 'assets', 'img', 'og', 'og-default.svg');

let indexTemplate = null;

export async function ensureOgImage() {
  if (existsSync(OG_JPG) || !existsSync(OG_SVG)) return;
  try {
    const sharp = (await import('sharp')).default;
    await sharp(OG_SVG, { density: 192 })
      .resize(1200, 630, { fit: 'cover' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(OG_JPG);
    console.log('[assets] Generated assets/img/og/og-default.jpg');
  } catch (err) {
    console.warn('[assets] og-default.jpg missing — run: npm run optimize');
    console.warn('[assets]', err.message);
  }
}

export async function loadIndexTemplate() {
  indexTemplate = await readFile(INDEX_PATH, 'utf8');
}

export function renderIndexHtml(siteOrigin) {
  const origin = (siteOrigin || '').replace(/\/$/, '');
  const html = indexTemplate ?? '';
  return html.replaceAll('__SITE_ORIGIN__', origin);
}

export async function sendIndexHtml(req, res, siteOrigin) {
  if (!indexTemplate) await loadIndexTemplate();
  res.type('html').send(renderIndexHtml(siteOrigin));
}
