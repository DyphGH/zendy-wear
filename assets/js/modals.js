/**
 * modals.js — overlays empilhados (modal > carrinho > página).
 * A página fica “congelada” na secção onde estavas (ex.: coleção).
 */

import { $, $$, getScrollY, setOverlayScrollLock } from './utils.js';
import { t } from './i18n.js';
import { initPhoneCountry, getFullPhone } from './phone-country.js';
import { isCartOpen } from './cart.js';

const PARTIAL_URL = '/assets/partials/modals.html';
const ROOT_ID = 'zendy-modal-root';

let openId = null;
let lastFocus = null;
let wired = false;
let contactWired = false;
let pendingOpenScrollY = null;

const isMouseUI = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function isModalOpen() {
  return openId !== null;
}

function getModal(id) {
  return document.getElementById(`modal-${id}`);
}

function getModalRoot() {
  return document.getElementById(ROOT_ID);
}

function mountModalPortal() {
  const root = getModalRoot();
  if (!root || root.dataset.portalMounted === '1') return;
  root.dataset.portalMounted = '1';
  root.setAttribute('data-lenis-prevent', '');
  root.removeAttribute('hidden');
  root.removeAttribute('aria-hidden');
}

async function ensureModalsInDom() {
  if (document.getElementById('modal-size-guide')) {
    mountModalPortal();
    return;
  }
  try {
    const res = await fetch(PARTIAL_URL);
    if (!res.ok) throw new Error('partial fetch failed');
    let root = getModalRoot();
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }
    root.innerHTML = await res.text();
    mountModalPortal();
  } catch (err) {
    console.warn('[modals] could not load partial', err);
  }
}

function trapFocus(modal, e) {
  if (e.key !== 'Tab') return;
  const focusable = modal.querySelectorAll(
    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus({ preventScroll: true });
  }
}

function setPageInertForModal(on) {
  $('main')?.toggleAttribute('inert', on);
  $('nav.site-nav')?.toggleAttribute('inert', on);
  $('#site-footer')?.toggleAttribute('inert', on);
  // Carrinho fica aberto por baixo — não meter inert no drawer
}

export function openModal(id, scrollY = pendingOpenScrollY ?? getScrollY()) {
  const modal = getModal(id);
  if (!modal || openId === id) return;

  pendingOpenScrollY = null;

  if (openId) closeModal(openId, false);

  // Não fechar o carrinho — empilhar: modal por cima do cart
  lastFocus = document.activeElement;
  openId = id;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('has-modal-open');
  try { window.__zendyModalOpen = true; } catch { /* sandboxed */ }

  setOverlayScrollLock(true, scrollY);
  setPageInertForModal(true);

  if (!isMouseUI()) {
    requestAnimationFrame(() => {
      modal.querySelector('.site-modal__close')?.focus({ preventScroll: true });
    });
  }
}

export function closeModal(id = openId, restoreFocus = true) {
  if (!id) return;
  const modal = getModal(id);
  if (!modal) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  openId = null;
  document.documentElement.classList.remove('has-modal-open');
  try { window.__zendyModalOpen = false; } catch { /* sandboxed */ }
  document.dispatchEvent(new CustomEvent('zendy:modal-closed', { detail: { id } }));

  setOverlayScrollLock(false);
  setPageInertForModal(false);

  // Se o carrinho ainda está aberto, volta a inert só na página (cart já tinha isso no openCart)
  if (isCartOpen()) {
    $('main')?.setAttribute('inert', '');
    $('nav.site-nav')?.setAttribute('inert', '');
    $('#site-footer')?.setAttribute('inert', '');
  }

  if (restoreFocus && lastFocus?.focus) {
    lastFocus.focus({ preventScroll: true });
  }
}

function wireModalShells() {
  $$('.site-modal').forEach((modal) => {
    if (modal.dataset.wired === '1') return;
    modal.dataset.wired = '1';
    const id = modal.id.replace('modal-', '');
    modal.querySelector('[data-modal-backdrop]')?.addEventListener('click', () => closeModal(id));
    modal.querySelector('.site-modal__close')?.addEventListener('click', () => closeModal(id));
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal(id);
      trapFocus(modal, e);
    });
  });
}

function wireTriggers() {
  if (wired) return;
  wired = true;

  // Guardar scroll no mousedown (antes de qualquer salto no click)
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('[data-modal-open]')) {
      pendingOpenScrollY = getScrollY();
    }
  }, true);

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal-open]');
    if (!trigger) return;
    e.preventDefault();
    e.stopPropagation();
    const id = trigger.getAttribute('data-modal-open');
    if (id) openModal(id);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openId) {
      e.preventDefault();
      e.stopPropagation();
      closeModal(openId);
    }
  }, true);
}

export async function initModals() {
  await ensureModalsInDom();
  mountModalPortal();
  wireModalShells();
  wireTriggers();
  initSizeTabs();
  initContactForm();
}

function initSizeTabs() {
  const modal = getModal('size-guide');
  if (!modal || modal.dataset.tabsWired === '1') return;
  modal.dataset.tabsWired = '1';
  const tabs = modal.querySelectorAll('[data-size-tab]');
  const panels = modal.querySelectorAll('[data-size-panel]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const region = tab.getAttribute('data-size-tab');
      tabs.forEach((tb) => {
        const on = tb.getAttribute('data-size-tab') === region;
        tb.classList.toggle('is-active', on);
        tb.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach((p) => {
        const show = p.getAttribute('data-size-panel') === region;
        p.classList.toggle('is-hidden', !show);
        if (show) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
    });
  });
}

function initContactForm() {
  const form = $('#contact-form');
  if (!form || contactWired) return;
  contactWired = true;
  const msg = $('#contact-form-msg');
  const dialSelect = $('#contact-dial');
  const phoneInput = $('#contact-phone');
  initPhoneCountry(dialSelect);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (form.querySelector('[name="email"]')?.value || '').trim();
    const phone = getFullPhone(dialSelect, phoneInput);
    if (!email && !phone) {
      setFormMsg(msg, t('modal.contact.empty'), 'error');
      return;
    }
    const body =
      `${t('modal.contact.mailIntro')}\n\n${t('modal.contact.labelEmail')}: ${email || '—'}\n${t('modal.contact.labelPhone')}: ${phone || '—'}\n`;
    window.location.href =
      `mailto:zendywear@gmail.com?subject=${encodeURIComponent(t('modal.contact.mailSubject'))}` +
      `&body=${encodeURIComponent(body)}`;
    setFormMsg(msg, t('modal.contact.ok'), 'ok');
    form.reset();
  });
}

function setFormMsg(el, text, kind) {
  if (!el) return;
  el.textContent = text;
  el.classList.remove('ok', 'error');
  if (kind) el.classList.add(kind);
}
