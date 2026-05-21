/**
 * loader.js — hide the splash loader when the page is actually ready.
 *
 * The v1 site used a hardcoded 2200ms timeout, which felt slow on fast
 * connections and incomplete on slow ones. We now wait for two things:
 *   1. window 'load' event (all images, stylesheets, fonts requested)
 *   2. a minimum visible duration so the brand animation actually plays
 *
 * Reduced motion users see the page sooner.
 */

import { $, prefersReducedMotion, scrollToPageTop, setPageScrollLocked } from './utils.js';

const MIN_DURATION = 2400; // ms — brand animation + short hold (was 3200)
const MAX_DURATION = 3800; // ms — safety net

export function initLoader() {
  const loader = $('#loader');
  if (!loader) return;

  // Under reduced-motion the slide animation is skipped — hide ASAP.
  if (prefersReducedMotion()) {
    requestAnimationFrame(() => hide(loader));
    return;
  }

  const start = performance.now();
  let hidden = false;

  function tryHide() {
    if (hidden) return;
    const elapsed = performance.now() - start;
    const wait = Math.max(0, MIN_DURATION - elapsed);
    setTimeout(() => {
      if (hidden) return;
      hidden = true;
      hide(loader);
    }, wait);
  }

  if (document.readyState === 'complete') {
    tryHide();
  } else {
    window.addEventListener('load', tryHide, { once: true });
  }
  // Safety: never block longer than MAX_DURATION
  setTimeout(() => { if (!hidden) { hidden = true; hide(loader); } }, MAX_DURATION);
}

function hide(loader) {
  loader.classList.add('hidden');
  setPageScrollLocked(false);
  scrollToPageTop();
  requestAnimationFrame(() => scrollToPageTop());
  // Drop it from the DOM after the fade so it doesn't trap focus or eat events.
  setTimeout(() => {
    loader.remove();
    scrollToPageTop();
  }, 1100);
}
