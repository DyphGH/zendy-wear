/**
 * reveal.js — fade/slide-in elements as they scroll into view.
 *
 * Only runs when GSAP ScrollTrigger ISN'T taking over (capability.useReveal).
 * When 3D + Lenis are active, scroll.js handles reveals via richer GSAP
 * timelines, and this module exits early to avoid double-firing.
 */

import { $$, prefersReducedMotion } from './utils.js';

export function initReveal(capability) {
  // GSAP/Lenis path handles richer reveals once scroll.js mounted.
  if (capability?.useReveal === false && document.documentElement.classList.contains('has-gsap-scroll')) {
    return;
  }

  const shop = document.querySelector('#shop');
  const shopCards = shop ? $$('#shop .pc.rv', shop) : [];
  const targets = $$('.rv').filter((el) => !el.closest('#shop'));

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    $$('.rv').forEach((el) => el.classList.add('in'));
    return;
  }

  const revealOpts = { threshold: 0, rootMargin: '200px 0px 0px 0px' };

  if (shop && shopCards.length) {
    const shopObs = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      shopCards.forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.05}s`;
        el.classList.add('in');
      });
      shopObs.disconnect();
    }, revealOpts);
    shopObs.observe(shop);
  }

  if (targets.length === 0) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    },
    revealOpts,
  );

  targets.forEach((el) => obs.observe(el));
}
