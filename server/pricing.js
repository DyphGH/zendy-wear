/**
 * pricing.js — promo launch pricing (first N units at sale price).
 * Units sold persisted in data/promo-units-sold.json (updated via Stripe webhook).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = join(ROOT, 'data', 'promo-units-sold.json');

const PROMO_LIMIT = Math.max(1, Number(process.env.PROMO_UNIT_LIMIT) || 50);
const PROMO_PRICE_EUR = Number(process.env.PROMO_PRICE_EUR) || 29.99;
const PROMO_COMPARE_EUR = Number(process.env.PROMO_COMPARE_EUR) || 45;
const REGULAR_PRICE_EUR = Number(process.env.REGULAR_PRICE_EUR) || 45;

async function readUnitsSold() {
  if (!existsSync(DATA_FILE)) return 0;
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Math.max(0, Math.floor(Number(data.unitsSold) || 0));
  } catch {
    return 0;
  }
}

export async function getUnitsSold() {
  return readUnitsSold();
}

export async function addUnitsSold(delta) {
  const add = Math.max(0, Math.floor(Number(delta) || 0));
  if (add === 0) return readUnitsSold();
  const next = (await readUnitsSold()) + add;
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(
    DATA_FILE,
    `${JSON.stringify({ unitsSold: next, updatedAt: new Date().toISOString() }, null, 2)}\n`,
    'utf8',
  );
  return next;
}

/** @returns {Promise<{ promoActive: boolean, unitsSold: number, unitsLimit: number, unitsRemaining: number, priceEur: number, compareAtEur: number|null }>} */
export async function getPricingSnapshot() {
  const unitsSold = await readUnitsSold();
  const promoActive = unitsSold < PROMO_LIMIT;
  return {
    promoActive,
    unitsSold,
    unitsLimit: PROMO_LIMIT,
    unitsRemaining: Math.max(0, PROMO_LIMIT - unitsSold),
    priceEur: promoActive ? PROMO_PRICE_EUR : REGULAR_PRICE_EUR,
    compareAtEur: promoActive ? PROMO_COMPARE_EUR : null,
    regularPriceEur: REGULAR_PRICE_EUR,
    promoPriceEur: PROMO_PRICE_EUR,
  };
}

export async function getChargePriceEur() {
  const snap = await getPricingSnapshot();
  return snap.priceEur;
}
