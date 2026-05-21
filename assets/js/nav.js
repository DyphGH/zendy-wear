/**
 * nav.js — fixed nav gains a solid background after scroll so links stay
 * readable (mix-blend-mode: difference breaks on busy sections).
 */

import { $, rafThrottle } from './utils.js';

export function initNavScroll() {
  const nav = $('nav.site-nav');
  if (!nav) return;

  const update = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 48);
  };

  window.addEventListener('scroll', rafThrottle(update), { passive: true });
  update();
}
