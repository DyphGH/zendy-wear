/**
 * pricing.js — sync product cards + cart with /api/pricing (server source of truth).
 */

import { $, $$, formatEUR } from './utils.js';
import { t, onLangChange } from './i18n.js';
import { syncCartPrices } from './cart.js';

let snapshot = null;

export function getPricingSnapshot() {
  return snapshot;
}

function renderPriceEl(el, pricing) {
  el.replaceChildren();
  el.setAttribute(
    'aria-label',
    pricing.compareAtEur
      ? t('price.ariaPromo')
          .replace('{compare}', formatEUR(pricing.compareAtEur, { alwaysDecimals: true }))
          .replace('{price}', formatEUR(pricing.priceEur, { alwaysDecimals: true }))
      : t('price.aria')
          .replace('{price}', formatEUR(pricing.priceEur, { alwaysDecimals: true })),
  );

  if (pricing.compareAtEur != null) {
    const compare = document.createElement('span');
    compare.className = 'price-compare';
    compare.setAttribute('aria-hidden', 'true');
    compare.textContent = formatEUR(pricing.compareAtEur, { alwaysDecimals: true });
    el.appendChild(compare);
  }

  const now = document.createElement('span');
  now.className = 'price-now';
  now.textContent = formatEUR(pricing.priceEur, { alwaysDecimals: true });
  el.appendChild(now);
}

function renderPromoBadges(pricing) {
  $$('[data-promo-badge]').forEach((el) => {
    if (!pricing.promoActive) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.textContent = t('product.promoBadge').replace('{remaining}', String(pricing.unitsRemaining));
  });
}

export async function initPricing() {
  try {
    const res = await fetch('/api/pricing');
    if (!res.ok) throw new Error('pricing fetch failed');
    snapshot = await res.json();
  } catch (err) {
    console.warn('[pricing]', err);
    snapshot = {
      promoActive: true,
      priceEur: 29.99,
      compareAtEur: 45,
      unitsRemaining: 50,
    };
  }

  $$('[data-add-to-cart]').forEach((btn) => {
    btn.dataset.productPrice = String(snapshot.priceEur);
  });

  $$('.product-price').forEach((el) => renderPriceEl(el, snapshot));
  renderPromoBadges(snapshot);
  syncCartPrices(snapshot.priceEur);

  try { window.__zendyPricing = snapshot; } catch { /* sandboxed */ }

  onLangChange(() => {
    if (!snapshot) return;
    $$('.product-price').forEach((el) => renderPriceEl(el, snapshot));
    renderPromoBadges(snapshot);
  });

  return snapshot;
}
