/**
 * cart.js — localStorage-backed cart drawer.
 *
 * Public API:
 *   initCart()                            — wire DOM, return cleanup fn
 *   addItem({id, name, size, price, img})
 *   removeItem(id, size)
 *   setQty(id, size, qty)
 *   clearCart()
 *   getState() / subscribe(fn)            — for other modules
 *
 * Storage: localStorage key `zendy_cart_v1`, JSON-serialised
 *   { items: [{id, name, size, qty, price, img}], updatedAt }
 *
 * STRIPE MIGRATION PATH (when ready):
 *   Replace the contents of `handleCheckout()` below with EITHER
 *     (a) a redirect to a per-product Stripe Payment Link, OR
 *     (b) a fetch() to your backend that creates a Checkout Session and
 *         returns its `url`, then window.location.href = url.
 *   Cart state shape is already compatible with Stripe `line_items`
 *   (each item maps to {price_data:{currency:'eur', unit_amount:item.price*100,
 *   product_data:{name:item.name+' ('+item.size+')'}}, quantity:item.qty}).
 */

import { $, $$, storage, showToast, formatEUR, getScrollY, setOverlayScrollLock } from './utils.js';
import { t, onLangChange, getLang } from './i18n.js';

const STORAGE_KEY = 'zendy_cart_v1';
const QTY_CAP     = 10;             // sanity ceiling per line
const MAILTO_TO   = 'orders@zendywear.com';

const subscribers = new Set();

let drawer, backdrop, itemsEl, totalEl, checkoutBtn, toggleBtn, closeBtn;
let lastFocus = null;
let lastRenderedKeys = null;        // null = uninitialised; [] = empty cart rendered

// ---------------------------------------------------------------------------
// State (with resilience to malformed localStorage)
// ---------------------------------------------------------------------------

function read() {
  const state = storage.get(STORAGE_KEY, { items: [], updatedAt: 0 });
  state.items = (state.items || []).filter(isValidItem);
  state.items.forEach((i) => {
    i.qty = Math.max(1, Math.min(QTY_CAP, Math.floor(i.qty)));
  });
  return state;
}

function isValidItem(i) {
  return (
    i &&
    typeof i.id === 'string'    && i.id.length > 0 &&
    typeof i.name === 'string'  && i.name.length > 0 &&
    typeof i.size === 'string'  && i.size.length > 0 &&
    typeof i.price === 'number' && Number.isFinite(i.price) && i.price >= 0 &&
    typeof i.qty === 'number'   && Number.isFinite(i.qty)   && i.qty > 0 &&
    typeof i.img === 'string'
  );
}

function write(state) {
  state.updatedAt = Date.now();
  storage.set(STORAGE_KEY, state);
  subscribers.forEach((fn) => {
    try { fn(state); } catch (err) { console.warn('[cart subscriber]', err); }
  });
}

// ---------------------------------------------------------------------------
// Public mutators
// ---------------------------------------------------------------------------

export function addItem(item) {
  const normalised = { ...item, qty: item.qty || 1 };
  if (!isValidItem(normalised)) {
    console.warn('[cart] addItem ignored — invalid payload', item);
    return;
  }
  const state = read();
  const existing = state.items.find((i) => i.id === item.id && i.size === item.size);
  if (existing) {
    existing.qty = Math.min(QTY_CAP, existing.qty + normalised.qty);
  } else {
    state.items.push({ ...normalised, qty: Math.min(QTY_CAP, normalised.qty) });
  }
  write(state);
  showToast(`${t('cart.toastAdded')} · ${item.name} · ${item.size}`);
}

export function removeItem(id, size) {
  const state = read();
  state.items = state.items.filter((i) => !(i.id === id && i.size === size));
  write(state);
}

export function setQty(id, size, qty) {
  const state = read();
  const item = state.items.find((i) => i.id === id && i.size === size);
  if (!item) return;
  if (qty <= 0) return removeItem(id, size);
  item.qty = Math.min(QTY_CAP, Math.floor(qty));
  write(state);
}

export function clearCart() {
  write({ items: [], updatedAt: Date.now() });
}

/** Alinha preços no localStorage com o servidor (ex. promo 29,99). */
export function syncCartPrices(priceEur) {
  const price = Number(priceEur);
  if (!Number.isFinite(price) || price < 0) return;
  const state = read();
  let changed = false;
  state.items.forEach((item) => {
    if (item.price !== price) {
      item.price = price;
      changed = true;
    }
  });
  if (changed) write(state);
}

export function getState() { return read(); }
export function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

function getTotal(state) { return state.items.reduce((s, i) => s + i.price * i.qty, 0); }
function getCount(state) { return state.items.reduce((n, i) => n + i.qty, 0); }
function keyOf(i)        { return `${i.id}|${i.size}`; }

// ---------------------------------------------------------------------------
// Init / drawer behaviour
// ---------------------------------------------------------------------------

export function initCart() {
  drawer      = $('#cart-drawer');
  backdrop    = $('[data-cart-backdrop]');
  itemsEl     = $('[data-cart-items]');
  totalEl     = $('[data-cart-total]');
  checkoutBtn = $('[data-cart-checkout]');
  toggleBtn   = $('.cart-toggle');
  closeBtn    = $('[data-cart-close]');

  if (!drawer || !backdrop || !itemsEl || !totalEl || !checkoutBtn || !toggleBtn) {
    console.warn('[cart] drawer markup not found — skipping init');
    return () => {};
  }

  // Wire drawer open/close
  toggleBtn.addEventListener('click', openCart);
  closeBtn?.addEventListener('click', closeCart);
  backdrop.addEventListener('click', closeCart);

  const onKey = (e) => {
    if (e.key !== 'Escape' || drawer.getAttribute('aria-hidden') !== 'false') return;
    if (window.__zendyModalOpen) return;
    e.preventDefault();
    closeCart();
  };
  document.addEventListener('keydown', onKey);

  // Wire add-to-cart buttons on product cards
  $$('[data-add-to-cart]').forEach((btn) => {
    btn.addEventListener('click', () => handleAdd(btn));
  });

  // Checkout
  checkoutBtn.addEventListener('click', handleCheckout);

  document.addEventListener('zendy:checkout-complete', () => {
    clearCart();
    closeCart();
  });
  document.addEventListener('zendy:cart-close', closeCart);

  // Delegação — +/- e remover leem sempre o estado actual (evita closure stale)
  itemsEl.addEventListener('click', handleItemsClick);

  // Subscribe & do initial render (also picks up state restored from a
  // previous session via localStorage)
  subscribe(render);
  render(read());
  onLangChange(() => {
    lastRenderedKeys = null;
    render(read());
  });

  return function cleanup() {
    toggleBtn.removeEventListener('click', openCart);
    closeBtn?.removeEventListener('click', closeCart);
    backdrop.removeEventListener('click', closeCart);
    document.removeEventListener('keydown', onKey);
    checkoutBtn.removeEventListener('click', handleCheckout);
    itemsEl.removeEventListener('click', handleItemsClick);
  };
}

function handleItemsClick(e) {
  const li = e.target.closest('.cart-item');
  if (!li?.dataset?.id || !li.dataset.size) return;

  const { id, size } = li.dataset;
  const live = read().items.find((i) => i.id === id && i.size === size);
  if (!live) return;

  if (e.target.closest('.qty-plus')) {
    setQty(id, size, live.qty + 1);
    return;
  }

  if (e.target.closest('.qty-minus')) {
    if (live.qty <= 1) return;
    setQty(id, size, live.qty - 1);
    return;
  }

  if (e.target.closest('.cart-item-remove')) {
    const willBeEmpty = read().items.filter(
      (i) => !(i.id === id && i.size === size),
    ).length === 0;
    removeItem(id, size);
    requestAnimationFrame(() => {
      (willBeEmpty ? closeBtn : checkoutBtn)?.focus({ preventScroll: true });
    });
  }
}

function handleAdd(btn) {
  const card = btn.closest('.pc');
  const sizeGroup = card?.querySelector('.size-selector');
  const selected  = sizeGroup?.querySelector('.size-btn[aria-pressed="true"]');

  if (!selected) {
    // Should be unreachable — add button is disabled until size picked —
    // but defend anyway. Bounce focus to size buttons.
    showToast(t('cart.toastPickSize'));
    sizeGroup?.querySelector('.size-btn')?.focus();
    return;
  }

  addItem({
    id:    btn.dataset.productId,
    name:  btn.dataset.productName,
    size:  selected.dataset.size,
    price: parseFloat(btn.dataset.productPrice),
    img:   btn.dataset.productImg,
    qty:   1,
  });
}

export function isCartOpen() {
  return drawer?.getAttribute('aria-hidden') === 'false';
}

export function closeCart() {
  if (!drawer || drawer.getAttribute('aria-hidden') === 'true') return;
  drawer.setAttribute('aria-hidden', 'true');
  backdrop?.classList.remove('open');
  backdrop?.setAttribute('aria-hidden', 'true');
  toggleBtn?.setAttribute('aria-expanded', 'false');
  setOverlayScrollLock(false);
  $('main')?.removeAttribute('inert');
  $('nav.site-nav')?.removeAttribute('inert');
  $('#site-footer')?.removeAttribute('inert');
  if (lastFocus && document.contains(lastFocus)) {
    lastFocus.focus({ preventScroll: true });
  } else {
    toggleBtn?.focus({ preventScroll: true });
  }
}

function openCart() {
  if (drawer.getAttribute('aria-hidden') === 'false') return;
  const scrollY = getScrollY();
  lastFocus = document.activeElement;
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden', 'false');
  toggleBtn.setAttribute('aria-expanded', 'true');

  setOverlayScrollLock(true, scrollY);

  // Inert the rest of the page (a11y: keeps screen-reader virtual cursor
  // inside the dialog; keeps Tab from escaping into background content).
  $('main')?.setAttribute('inert', '');
  $('nav.site-nav')?.setAttribute('inert', '');
  $('#site-footer')?.setAttribute('inert', '');

  // Move focus into the drawer. requestAnimationFrame gives the inert
  // attribute time to take effect on Safari.
  requestAnimationFrame(() => closeBtn?.focus({ preventScroll: true }));
}


// ---------------------------------------------------------------------------
// Render — with a small structural diff so qty +/- doesn't rebuild the list
// (preserves focus on the +/- button being clicked).
// ---------------------------------------------------------------------------

function render(state) {
  if (!itemsEl) return;

  const newKeys      = state.items.map(keyOf);
  const structureSame = lastRenderedKeys !== null
    && newKeys.length === lastRenderedKeys.length
    && newKeys.every((k, i) => k === lastRenderedKeys[i]);

  if (!structureSame) {
    fullRender(state);
    lastRenderedKeys = newKeys;
  } else {
    updateInPlace(state);
  }

  // Total + nav count — always
  totalEl.textContent = formatEUR(getTotal(state));
  const count = getCount(state);
  $$('.cart-count').forEach((el) => {
    el.textContent = String(count);
    el.dataset.count = String(count);
  });
  checkoutBtn.disabled = state.items.length === 0;
}

function fullRender(state) {
  itemsEl.replaceChildren();

  if (state.items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'cart-empty';
    empty.textContent = t('cart.empty');
    itemsEl.appendChild(empty);
    return;
  }

  state.items.forEach((item) => itemsEl.appendChild(renderItem(item)));
}

function updateInPlace(state) {
  // Find each LI by data-id + data-size and update qty / line price /
  // plus-button disabled state. Used for +/- clicks.
  state.items.forEach((item) => {
    const li = Array.from(itemsEl.children).find(
      (el) => el.dataset && el.dataset.id === item.id && el.dataset.size === item.size,
    );
    if (!li) return;
    const qtyEl  = li.querySelector('.qty');
    const priceEl = li.querySelector('.cart-item-price');
    const plusBtn = li.querySelector('.qty-plus');
    const minusBtn = li.querySelector('.qty-minus');
    if (qtyEl) qtyEl.textContent = String(item.qty);
    if (priceEl) priceEl.textContent = formatEUR(item.price * item.qty);
    if (plusBtn) plusBtn.disabled = item.qty >= QTY_CAP;
    if (minusBtn) minusBtn.disabled = item.qty <= 1;
  });
}

/**
 * Build a single line-item LI. Pure DOM construction — no innerHTML, so we
 * cannot accidentally inject any cart data into the HTML parser.
 */
function renderItem(item) {
  const li = document.createElement('li');
  li.className = 'cart-item';
  li.dataset.id = item.id;
  li.dataset.size = item.size;

  // Thumb
  const imgWrap = document.createElement('div');
  imgWrap.className = 'cart-item-img';
  const img = document.createElement('img');
  img.src = item.img;
  img.alt = t('cart.thumbAlt').replace('{name}', item.name);
  img.width = 80;
  img.height = 100;
  img.loading = 'lazy';
  img.decoding = 'async';
  imgWrap.appendChild(img);

  // Info column
  const info = document.createElement('div');
  info.className = 'cart-item-info';

  const name = document.createElement('p');
  name.className = 'cart-item-name';
  name.textContent = item.name;

  const meta = document.createElement('p');
  meta.className = 'cart-item-meta';
  meta.textContent = `${t('cart.size')} ${item.size}`;

  const qty = document.createElement('div');
  qty.className = 'cart-item-qty';
  qty.setAttribute('role', 'group');
  qty.setAttribute(
    'aria-label',
    t('cart.qtyGroupAria').replace('{name}', item.name).replace('{size}', item.size),
  );

  const minus = document.createElement('button');
  minus.type = 'button';
  minus.className = 'qty-minus';
  minus.textContent = '\u2212';
  minus.setAttribute('aria-label', t('cart.qtyMinusAria').replace('{name}', item.name).replace('{size}', item.size));
  minus.disabled = item.qty <= 1;

  const qtyVal = document.createElement('span');
  qtyVal.className = 'qty';
  qtyVal.textContent = String(item.qty);
  qtyVal.setAttribute('aria-live', 'polite');
  qtyVal.setAttribute('aria-atomic', 'true');

  const plus = document.createElement('button');
  plus.type = 'button';
  plus.className = 'qty-plus';
  plus.textContent = '+';
  plus.setAttribute('aria-label', t('cart.qtyPlusAria').replace('{name}', item.name).replace('{size}', item.size));
  plus.disabled = item.qty >= QTY_CAP;

  qty.append(minus, qtyVal, plus);
  info.append(name, meta, qty);

  // Price + remove (× remove a linha inteira, qualquer quantidade)
  const side = document.createElement('div');
  side.className = 'cart-item-side';

  const price = document.createElement('p');
  price.className = 'cart-item-price';
  price.textContent = formatEUR(item.price * item.qty);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'cart-item-remove';
  remove.textContent = '\u00d7';
  remove.setAttribute('aria-label', t('cart.removeAria').replace('{name}', item.name).replace('{size}', item.size));

  side.append(remove, price);

  li.append(imgWrap, info, side);
  return li;
}

// ---------------------------------------------------------------------------
// Checkout — mailto today, Stripe tomorrow.
// ---------------------------------------------------------------------------

async function handleCheckout() {
  const state = read();
  if (state.items.length === 0) return;

  checkoutBtn.disabled = true;

  try {
    const { startEmbeddedCheckout } = await import('./checkout.js');
    await startEmbeddedCheckout(state.items);
  } catch (err) {
    if (err?.message === 'stripe_not_configured') {
      fallbackMailtoCheckout(state);
      return;
    }
    if (err?.message !== 'stripe_publishable_missing' && err?.message !== 'checkout_failed') {
      fallbackMailtoCheckout(state);
    }
  } finally {
    checkoutBtn.disabled = read().items.length === 0;
  }
}

function fallbackMailtoCheckout(state) {
  const lines = state.items.map((i) =>
    `  - ${i.name} (${i.size}) x ${i.qty} = ${formatEUR(i.price * i.qty)}`,
  ).join('\n');
  const total = formatEUR(getTotal(state));
  const itemCount = getCount(state);
  const body =
    `${t('cart.mail.greeting')}\n\n` +
    `${t('cart.mail.intro')}\n\n${lines}\n\n` +
    `${t('cart.mail.total')}: ${total}\n\n` +
    `${t('cart.mail.shipping')}\n` +
    `  ${t('cart.mail.name')}\n` +
    `  ${t('cart.mail.address')}\n` +
    `  ${t('cart.mail.city')}\n` +
    `  ${t('cart.mail.phone')}\n\n` +
    `${t('cart.mail.thanks')}`;
  const subject = `${t('cart.mail.subject')} (${itemCount} ${itemCount === 1 ? t('cart.item') : t('cart.items')}, ${total})`;
  window.location.href =
    `mailto:zendywear@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
