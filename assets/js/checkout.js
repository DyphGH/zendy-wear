/**
 * checkout.js — Stripe Embedded Checkout (stays on zendywear.com).
 */

import { showToast } from './utils.js';
import { t, getLang } from './i18n.js';
import { openModal, closeModal } from './modals.js';

let stripeJsPromise = null;
let configPromise = null;
let embeddedCheckout = null;
let activeClientSecret = null;

function loadStripeJs() {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  if (stripeJsPromise) return stripeJsPromise;
  stripeJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => resolve(window.Stripe);
    script.onerror = () => reject(new Error('stripe_js_load_failed'));
    document.head.appendChild(script);
  });
  return stripeJsPromise;
}

async function getStripeConfig() {
  if (!configPromise) {
    configPromise = fetch('/api/stripe-config').then((r) => r.json());
  }
  return configPromise;
}

export function destroyEmbeddedCheckout() {
  if (embeddedCheckout) {
    try { embeddedCheckout.destroy(); } catch { /* already torn down */ }
    embeddedCheckout = null;
  }
  activeClientSecret = null;
  const mount = document.getElementById('stripe-checkout-mount');
  if (mount) mount.replaceChildren();
}

export async function showThankYouModal() {
  try {
    const { clearCart, closeCart } = await import('./cart.js');
    clearCart();
    closeCart();
  } catch (err) {
    console.warn('[checkout] clear cart failed', err);
  }
  document.dispatchEvent(new CustomEvent('zendy:checkout-complete'));
  destroyEmbeddedCheckout();
  closeModal('checkout', false);
  openModal('thank-you');
}

function cleanCheckoutQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete('checkout');
  url.searchParams.delete('session_id');
  url.searchParams.delete('lang');
  const next = url.pathname + url.search + url.hash;
  history.replaceState({}, '', next || '/');
}

export async function handleCheckoutReturnFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkout') !== 'return' || !params.get('session_id')) return false;
  await showThankYouModal();
  cleanCheckoutQuery();
  return true;
}

async function mountEmbeddedCheckout(clientSecret) {
  const { publishableKey } = await getStripeConfig();
  if (!publishableKey) {
    throw new Error('stripe_publishable_missing');
  }

  const Stripe = await loadStripeJs();
  const stripe = Stripe(publishableKey);

  destroyEmbeddedCheckout();
  activeClientSecret = clientSecret;

  embeddedCheckout = await stripe.initEmbeddedCheckout({
    clientSecret,
    onComplete: () => {
      void showThankYouModal().then(() => cleanCheckoutQuery());
    },
  });

  const mount = document.getElementById('stripe-checkout-mount');
  if (!mount) throw new Error('checkout_mount_missing');
  embeddedCheckout.mount(mount);
}

export async function startEmbeddedCheckout(items) {
  const payload = {
    items: items.map((i) => ({ id: i.id, size: i.size, qty: i.qty })),
    lang: getLang(),
  };

  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.clientSecret) {
    if (data.error === 'stripe_not_configured') throw new Error('stripe_not_configured');
    throw new Error(data.error || 'checkout_failed');
  }

  document.dispatchEvent(new CustomEvent('zendy:cart-close'));
  openModal('checkout');

  const loading = document.querySelector('[data-checkout-loading]');
  const mount = document.getElementById('stripe-checkout-mount');
  if (loading) loading.hidden = false;
  if (mount) mount.hidden = true;

  try {
    await mountEmbeddedCheckout(data.clientSecret);
    if (loading) loading.hidden = true;
    if (mount) mount.hidden = false;
  } catch (err) {
    closeModal('checkout', false);
    destroyEmbeddedCheckout();
    if (err.message === 'stripe_publishable_missing' || err.message === 'stripe_not_configured') {
      showToast(t('cart.stripeSetup'));
    } else {
      showToast(t('cart.checkoutError'));
    }
    throw err;
  }
}

export function initCheckout() {
  document.addEventListener('zendy:modal-closed', (e) => {
    if (e.detail?.id === 'checkout') destroyEmbeddedCheckout();
  });

  const thankBtn = document.querySelector('[data-thank-you-close]');
  thankBtn?.addEventListener('click', () => closeModal('thank-you'));
}