/**
 * viewer.js — the 3-state product viewer (Front / Back / Collar).
 *
 * Builds on top of the role="tablist" / role="tabpanel" semantics in HTML.
 * Handles:
 *   - click / tap on tabs
 *   - keyboard navigation (ArrowLeft, ArrowRight, Home, End) per WAI-ARIA
 *     authoring practices for tabs
 *   - touch swipe (left/right) to switch view — pure native pointerevents,
 *     no library
 *
 * One initViewers() call wires up every .shirt-viewer on the page.
 */

import { $$, prefersReducedMotion } from './utils.js';

const VIEWS = ['front', 'back', 'collar'];

export function initViewers(root = document) {
  const viewers = $$('.shirt-viewer', root);
  viewers.forEach(setupViewer);
}

function setupViewer(viewer) {
  const tablist = viewer.querySelector('[role="tablist"]');
  if (!tablist) return; // graceful no-op if structure missing

  const tabs   = Array.from(viewer.querySelectorAll('[role="tab"]'));
  const panes  = Array.from(viewer.querySelectorAll('[role="tabpanel"]'));

  if (tabs.length === 0 || panes.length === 0) return;

  function setActive(index, { focus = false } = {}) {
    if (index < 0) index = tabs.length - 1;
    if (index >= tabs.length) index = 0;

    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      if (selected && focus) tab.focus();
    });
    panes.forEach((pane, i) => {
      pane.classList.toggle('active', i === index);
      if (i === index) {
        pane.removeAttribute('hidden');
      } else {
        // Only hide AFTER the fade transition completes — otherwise the
        // outgoing pane disappears instantly mid-fade. Skip the delay under
        // reduced motion.
        if (prefersReducedMotion()) {
          pane.setAttribute('hidden', '');
        } else {
          setTimeout(() => {
            if (!pane.classList.contains('active')) pane.setAttribute('hidden', '');
          }, 500);
        }
      }
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => setActive(i));
    tab.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          setActive(i - 1, { focus: true });
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          setActive(i + 1, { focus: true });
          break;
        case 'Home':
          e.preventDefault();
          setActive(0, { focus: true });
          break;
        case 'End':
          e.preventDefault();
          setActive(tabs.length - 1, { focus: true });
          break;
        default:
          // pass through (Tab/Enter/Space etc.)
      }
    });
  });

  // -------- Touch swipe (no libs) ------------------------------------------
  // Pointer events cover touch + mouse + pen. We only act on touch/pen, since
  // mouse users have tabs.
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerActive = false;
  let pointerType = '';
  const SWIPE_THRESHOLD = 50; // px

  viewer.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return; // ignore mouse drag
    pointerActive = true;
    pointerType = e.pointerType;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
  });

  viewer.addEventListener('pointerup', (e) => {
    if (!pointerActive || e.pointerType !== pointerType) return;
    pointerActive = false;
    const dx = e.clientX - pointerStartX;
    const dy = e.clientY - pointerStartY;
    // Horizontal intent only: |dx| must dominate, otherwise it's a vertical scroll
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.4) return;

    const currentIndex = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    if (currentIndex < 0) return;
    setActive(dx < 0 ? currentIndex + 1 : currentIndex - 1);
  });

  viewer.addEventListener('pointercancel', () => { pointerActive = false; });

  const defaultView = parseInt(viewer.dataset.defaultView ?? '0', 10);
  if (!Number.isNaN(defaultView)) setActive(defaultView);
}
