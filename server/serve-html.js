/**
 * serve-html.js — inject public site URL into index.html + OG share image.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_PATH = join(ROOT, 'index.html');
const OG_JPG = join(ROOT, 'assets', 'img', 'og', 'og-default.jpg');
const OG_SVG = join(ROOT, 'assets', 'img', 'og', 'og-default.svg');

let indexTemplate = null;
let ogImageBuffer = null;

async function buildOgJpegBuffer() {
  if (ogImageBuffer) return ogImageBuffer;
  if (existsSync(OG_JPG)) {
    ogImageBuffer = await readFile(OG_JPG);
    return ogImageBuffer;
  }
  if (!existsSync(OG_SVG)) {
    throw new Error('og-default.svg missing');
  }
  const sharp = (await import('sharp')).default;
  ogImageBuffer = await sharp(OG_SVG, { density: 192 })
    .resize(1200, 630, { fit: 'cover' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  try {
    await writeFile(OG_JPG, ogImageBuffer);
  } catch {
    /* ephemeral disk — ok if write fails */
  }
  return ogImageBuffer;
}

export async function ensureOgImage() {
  try {
    await buildOgJpegBuffer();
    console.log('[assets] OG share image ready (1200×630 JPEG)');
  } catch (err) {
    console.warn('[assets] OG image not ready — social previews may fail until sharp/svg works');
    console.warn('[assets]', err.message);
  }
}

/** Public route for Facebook/WhatsApp crawlers — always JPEG, not SVG. */
export async function serveOgImage(_req, res) {
  try {
    const buf = await buildOgJpegBuffer();
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.type('jpeg');
    res.send(buf);
  } catch (err) {
    console.error('[og-image]', err);
    res.status(503).type('text/plain').send('OG image unavailable');
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
