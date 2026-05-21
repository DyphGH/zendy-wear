#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * generate-sri.mjs — compute SHA-384 Subresource Integrity hashes for the
 * pinned CDN modules used by Phase 3 (Three.js, Lenis, GSAP, ScrollTrigger),
 * and print ready-to-paste <link rel="modulepreload" integrity="...">
 * snippets you drop into index.html.
 *
 * USAGE:
 *   node scripts/generate-sri.mjs
 *
 * Re-run only when you bump a pinned version in the importmap inside
 * index.html (search for "IMPORT MAP" there).
 *
 * No external dependencies — uses Node's built-in fetch + crypto.
 * Requires Node 18+ (for global fetch). All Node 20+ definitely fine.
 */

import { createHash } from 'node:crypto';

const URLS = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js',
  'https://cdn.jsdelivr.net/npm/lenis@1.3.23/+esm',
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm',
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js/+esm',
];

async function sha384(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const hash = createHash('sha384').update(buf).digest('base64');
  return { url, integrity: `sha384-${hash}`, bytes: buf.length };
}

console.log('Computing SHA-384 hashes (this fetches each module once):\n');

const results = [];
for (const url of URLS) {
  try {
    const r = await sha384(url);
    results.push(r);
    console.log(`  ✓ ${url}`);
    console.log(`    ${r.integrity}  (${(r.bytes / 1024).toFixed(1)} KB)\n`);
  } catch (err) {
    console.error(`  ✗ ${url}\n    ${err.message}\n`);
  }
}

console.log('\n--- Paste these into index.html, replacing the existing <link rel="modulepreload"> block ---\n');
for (const r of results) {
  console.log(`<link rel="modulepreload" href="${r.url}" integrity="${r.integrity}" crossorigin="anonymous">`);
}
console.log('\nDone.\n');
