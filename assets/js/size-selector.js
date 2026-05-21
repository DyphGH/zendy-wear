/**
 * size-selector.js — wires S/M/L/XL/XXL toggle groups in each product card.
 *
 * For each `.size-selector`:
 *   - all `.size-btn` start aria-pressed="false"
 *   - clicking one sets it aria-pressed="true" and others to false (radio-like)
 *   - the corresponding Add-to-Cart button is disabled until one is picked,
 *     and its label changes from "Select size" → "Add to Cart"
 *
 * Why buttons + aria-pressed instead of real radios:
 *   - native radio styling is brutal to override consistently across browsers
 *   - aria-pressed has the right semantic (toggle), and screen readers
 *     announce the selection clearly
 *   - we wrap in <fieldset><legend class="sr-only">…</legend> so the group
 *     has accessible context
 */

import { $$ } from './utils.js';
import { t, onLangChange } from './i18n.js';

function wireSizeSelectors() {
  $$('.size-selector').forEach((group) => {
    const buttons = $$('.size-btn', group);
    const card    = group.closest('.pc');
    const block   = group.closest('[data-size-block]');
    const status  = block?.querySelector('[data-size-status]');
    const addBtn  = card?.querySelector('[data-add-to-cart]');
    if (buttons.length === 0 || !addBtn) return;

    const realLabel = t('product.add');
    addBtn.dataset.realLabel = realLabel;
    updateSizeUi(block, status, addBtn, null, realLabel);

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const wasSelected = btn.getAttribute('aria-pressed') === 'true';
        buttons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        const picked = !wasSelected ? btn : null;
        if (picked) picked.setAttribute('aria-pressed', 'true');
        updateSizeUi(block, status, addBtn, picked, realLabel);
      });
    });
  });
}

function refreshAddLabels() {
  $$('[data-add-to-cart]').forEach((addBtn) => {
    const card = addBtn.closest('.pc');
    const block = card?.querySelector('[data-size-block]');
    const status = block?.querySelector('[data-size-status]');
    const selected = card?.querySelector('.size-btn[aria-pressed="true"]');
    const realLabel = t('product.add');
    addBtn.dataset.realLabel = realLabel;
    updateSizeUi(block, status, addBtn, selected, realLabel);
  });
}

function updateSizeUi(block, status, addBtn, pickedBtn, realLabel) {
  const size = pickedBtn?.getAttribute('data-size') || null;
  const hasSize = Boolean(size);
  if (block) {
    block.classList.toggle('has-size', hasSize);
    block.classList.toggle('is-pending', !hasSize);
  }
  if (status) {
    status.textContent = hasSize
      ? t('size.selected').replace('{size}', size)
      : t('size.pick');
  }
  setAddBtnState(addBtn, hasSize, realLabel);
}

export function initSizeSelectors() {
  wireSizeSelectors();
  onLangChange(refreshAddLabels);
}

function setAddBtnState(addBtn, sizePicked, realLabel) {
  addBtn.disabled = !sizePicked;
  addBtn.textContent = sizePicked ? realLabel : t('product.selectSize');
  addBtn.setAttribute('aria-disabled', sizePicked ? 'false' : 'true');
}
