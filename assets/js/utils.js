/**
 * utils.js — small helpers used by every other module.
 */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isHoverCapable = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function lockScrollRestoration() {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
}

export function setPageScrollLocked(locked) {
  document.documentElement.classList.toggle('is-loading', locked);
}

let overlayLockDepth = 0;
let pinnedScrollY = 0;

function canScrollEl(el, deltaY) {
  if (!el || el.scrollHeight <= el.clientHeight + 1) return false;
  const top = el.scrollTop;
  const max = el.scrollHeight - el.clientHeight;
  if (deltaY < 0) return top > 0;
  if (deltaY > 0) return top < max - 1;
  return false;
}

function findScrollableAncestor(target) {
  let el = target;
  while (el && el !== document.documentElement) {
    if (
      el.classList?.contains('site-modal__panel') ||
      el.classList?.contains('cart-items')
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

function onOverlayWheel(e) {
  const scrollEl = findScrollableAncestor(e.target);
  if (scrollEl && canScrollEl(scrollEl, e.deltaY)) {
    e.stopPropagation();
    return;
  }
  e.preventDefault();
  e.stopPropagation();
}

function syncOverlayOpenClass() {
  document.documentElement.classList.toggle('has-overlay-open', overlayLockDepth > 0);
}

/** Posição de scroll actual (Lenis ou nativo). */
export function getScrollY() {
  const native = window.scrollY || document.documentElement.scrollTop || 0;
  const lenis = window.__zendyLenis;
  if (!lenis) return native;
  const fromLenis = lenis.scroll;
  const fromActual = lenis.actualScroll;
  // Lenis pode ir atrás do scroll nativo (ex.: clique no footer) — ficar com o maior
  return Math.max(
    Number.isFinite(fromLenis) ? fromLenis : 0,
    Number.isFinite(fromActual) ? fromActual : 0,
    native,
  );
}

/** Repõe scroll sem animação (force: true — funciona com Lenis locked/stopped). */
export function restoreScrollY(y) {
  try {
    if (window.__zendyLenis) {
      window.__zendyLenis.scrollTo(y, { immediate: true, force: true });
      return;
    }
  } catch { /* noop */ }
  window.scrollTo(0, y);
}

function setLenisLocked(locked) {
  const lenis = window.__zendyLenis;
  if (!lenis) return;
  try {
    lenis.isLocked = locked;
  } catch { /* noop */ }
}

/**
 * Lock background scroll (modals + cart). Ref-counted stack.
 * Mantém a página “congelada” na posição actual (coleção, etc.).
 */
export function setOverlayScrollLock(lock, explicitY) {
  if (lock) {
    overlayLockDepth += 1;
    if (overlayLockDepth !== 1) return;
    pinnedScrollY = typeof explicitY === 'number' ? explicitY : getScrollY();
    setLenisLocked(true);
    document.documentElement.classList.add('overlay-scroll-lock');
    syncOverlayOpenClass();
    document.addEventListener('wheel', onOverlayWheel, { passive: false, capture: true });
  } else {
    overlayLockDepth = Math.max(0, overlayLockDepth - 1);
    syncOverlayOpenClass();
    if (overlayLockDepth !== 0) return;
    document.documentElement.classList.remove('overlay-scroll-lock');
    document.removeEventListener('wheel', onOverlayWheel, { capture: true });
    setLenisLocked(false);
    // Sem body pin a página não se mexeu — só repõe se o scroll tiver derivado
    const y = pinnedScrollY;
    const drift = Math.abs(getScrollY() - y);
    if (drift > 2) requestAnimationFrame(() => restoreScrollY(y));
  }
}

export function scrollToPageTop() {
  const nav = performance.getEntriesByType('navigation')[0];
  if (nav?.type === 'reload' && location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  window.scrollTo(0, 0);
  try {
    window.__zendyLenis?.scrollTo(0, { immediate: true });
  } catch { /* Lenis not ready */ }
}

export function rafThrottle(fn) {
  let scheduled = false;
  let lastArgs = null;
  return function (...args) {
    lastArgs = args;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      fn.apply(this, lastArgs);
    });
  };
}

export function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatEUR(n, opts = {}) {
  const alwaysDecimals = Boolean(opts.alwaysDecimals);
  const isWhole = Number.isFinite(n) && Math.abs(n - Math.round(n)) < 0.001;
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: alwaysDecimals || !isWhole ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
}

let toastEl = null;
let toastTimer = null;
let toastClearTimer = null;

const TOAST_HIDE_MS = 400;

function clearToastContent() {
  if (!toastEl || toastEl.classList.contains('show')) return;
  toastEl.textContent = '';
  toastEl.setAttribute('aria-hidden', 'true');
}

export function showToast(message, ms = 2200) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.setAttribute('aria-hidden', 'true');
    toastEl.addEventListener('transitionend', (e) => {
      if (e.target !== toastEl || e.propertyName !== 'opacity') return;
      if (!toastEl.classList.contains('show')) clearToastContent();
    });
    document.body.appendChild(toastEl);
  }

  clearTimeout(toastTimer);
  clearTimeout(toastClearTimer);
  toastEl.textContent = message;
  toastEl.setAttribute('aria-hidden', 'false');
  toastEl.classList.remove('show');
  void toastEl.offsetWidth;
  toastEl.classList.add('show');

  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
    toastClearTimer = setTimeout(clearToastContent, TOAST_HIDE_MS + 80);
  }, ms);
}

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn('[storage.get] failed for', key, err);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('[storage.set] failed for', key, err);
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  },
};

export function isValidEmail(str) {
  if (typeof str !== 'string') return false;
  const s = str.trim();
  if (s.length < 5 || s.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

export function getDeviceCapability() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cores        = navigator.hardwareConcurrency || 2;
  const w            = window.innerWidth;
  const dpr          = Math.min(window.devicePixelRatio || 1, 2);

  let webgl2 = false;
  try {
    const canvas = document.createElement('canvas');
    webgl2 = !!canvas.getContext('webgl2');
  } catch { /* keep false */ }

  const use3D    = !reduceMotion && webgl2 && cores >= 4 && w >= 768;
  const useBloom = use3D && cores >= 6;
  const useLenis = !reduceMotion;
  const useReveal = !useLenis;

  return { use3D, useBloom, useLenis, useReveal, reduceMotion, dpr, webgl2, cores };
}
