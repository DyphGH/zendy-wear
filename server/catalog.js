/**
 * Catálogo oficial — única fonte de preços no servidor.
 * O frontend NÃO define o valor cobrado no Stripe.
 */
import { getChargePriceEur } from './pricing.js';

/** @type {Record<string, { name: string }>} */
export const PRODUCTS = {
  'melting-heads': { name: 'Melting Heads' },
  'sun-moon-meltdown': { name: 'Sun & Moon Meltdown' },
  'neon-skull-melt': { name: 'Neon Skull Melt' },
};

export const ALLOWED_SIZES = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
export const MAX_QTY_PER_LINE = 10;

/**
 * @param {{ id: string, size: string, qty: number }[]} items
 */
export async function buildLineItems(items) {
  const priceEur = await getChargePriceEur();
  const unitAmount = Math.round(priceEur * 100);
  const lines = [];

  for (const row of items) {
    const id = String(row?.id || '').trim();
    const size = String(row?.size || '').trim().toUpperCase();
    const qty = Math.floor(Number(row?.qty));
    if (!id || !PRODUCTS[id]) {
      throw new Error(`Unknown product: ${id}`);
    }
    if (!ALLOWED_SIZES.has(size)) {
      throw new Error(`Invalid size: ${size}`);
    }
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      throw new Error(`Invalid quantity for ${id}`);
    }
    const product = PRODUCTS[id];
    lines.push({
      price_data: {
        currency: 'eur',
        unit_amount: unitAmount,
        product_data: {
          name: `${product.name} · ${size}`,
          metadata: { product_id: id, size },
        },
      },
      quantity: qty,
    });
  }
  return lines;
}
