/**
 * scroll.js — smooth scrolling (Lenis) + scroll-driven animations (GSAP +
 * ScrollTrigger). Replaces the IntersectionObserver-based reveal in
 * reveal.js when enabled (reveal.js checks `capability.useLenis` and bails).
 *
 * Effects added:
 *   - Lenis inertial scroll (~1.2 default smoothness)
 *   - .rv elements fade up via GSAP timeline (richer easing than CSS)
 *   - Manifesto section "pinned" while its text slides word-by-word
 *   - Collar strip mid + right tiles get a real parallax translateY (vs
 *     the simple hover effect from Phase 1)
 *
 * Skips entirely when capability.useLenis === false (prefers-reduced-motion).
 */

import { $$, prefersReducedMotion, scrollToPageTop } from './utils.js';

export async function initScroll(capability) {
  if (!capability?.useLenis) return () => {};
  if (prefersReducedMotion()) return () => {};

  // Lazy import — only load these CDNs when we'll actually use them.
  let Lenis, gsap, ScrollTrigger;
  const CDN_TIMEOUT = 8000;
  const withTimeout = (p, label) =>
    Promise.race([
      p,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${label} CDN timeout (${CDN_TIMEOUT / 1000}s)`)), CDN_TIMEOUT),
      ),
    ]);

  try {
    const lenisModule = await withTimeout(import('lenis'), 'Lenis');
    Lenis = lenisModule.default || lenisModule.Lenis;

    const gsapModule = await withTimeout(import('gsap'), 'GSAP');
    gsap = gsapModule.default || gsapModule.gsap || gsapModule;

    const stModule = await withTimeout(import('gsap/ScrollTrigger'), 'ScrollTrigger');
    ScrollTrigger = stModule.ScrollTrigger || stModule.default;
  } catch (err) {
    console.warn('[scroll] Lenis/GSAP failed to load — native scroll only:', err);
    return () => {};
  }

  if (!Lenis || !gsap || !ScrollTrigger) {
    console.warn('[scroll] module shape unexpected — abort');
    return () => {};
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('has-gsap-scroll');

  // ---- Lenis ---------------------------------------------------------------
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false, // mobile native scroll feels better than smoothed
  });

  // Bridge Lenis ticks into GSAP's ticker — single RAF loop, no fighting
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  try { window.__zendyLenis = lenis; } catch { /* sandboxed */ }
  scrollToPageTop();
  ScrollTrigger.refresh();

  // ---- Reveal-on-scroll (replaces reveal.js when active) ------------------
  const shopSection = document.querySelector('#shop');
  const shopCards = shopSection ? $$('#shop .pc.rv', shopSection) : [];

  if (shopSection && shopCards.length) {
    gsap.fromTo(
      shopCards,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        stagger: 0.05,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: shopSection,
          start: 'top bottom',
          toggleActions: 'play none none none',
        },
      },
    );
    shopCards.forEach((el) => el.classList.add('in'));
  }

  $$('.rv').forEach((el) => {
    if (el.closest('#shop')) return;
    const stagger = /\bd(\d)\b/.exec(el.className);
    const delay = stagger ? parseInt(stagger[1], 10) * 0.06 : 0;
    gsap.fromTo(
      el,
      { opacity: 0, y: 36 },
      {
        opacity: 1,
        y: 0,
        duration: 0.75,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      },
    );
    el.classList.add('in');
  });

  setupManifestoPin(gsap, ScrollTrigger);

  // Collar strip: no parallax — images stay fixed with the page (no “floating” on scroll)

  // ---- Teardown -----------------------------------------------------------
  return function cleanup() {
    ScrollTrigger.getAll().forEach((st) => st.kill());
    lenis.destroy();
    try { delete window.__zendyLenis; } catch { window.__zendyLenis = undefined; }
    manifestoPin = null;
  };
}

let manifestoPin = null;
let manifestoGsap = null;
let manifestoST = null;

function setupManifestoPin(gsap, ScrollTrigger) {
  manifestoGsap = gsap;
  manifestoST = ScrollTrigger;
  if (manifestoPin) manifestoPin.kill();

  const manifesto = document.querySelector('.mani');
  if (!manifesto) return;

  const txt = manifesto.querySelector('.mani-txt');
  if (!txt) return;

  const html = txt.innerHTML;
  const chunks = html.split(/<br\s*\/?>\s*<br\s*\/?>/i);
  txt.innerHTML = chunks.map((c) => `<span class="mani-chunk">${c}</span>`).join('');

  const chunkEls = txt.querySelectorAll('.mani-chunk');
  gsap.set(chunkEls, { opacity: 0.15, y: 12 });

  manifestoPin = ScrollTrigger.create({
    trigger: manifesto,
    start: 'top top+=80',
    end: '+=80%',
    pin: true,
    pinSpacing: true,
    scrub: 0.5,
    onUpdate: (self) => {
      const p = self.progress;
      chunkEls.forEach((c, i) => {
        const local = (p - i * 0.18) / 0.5;
        const eased = Math.max(0, Math.min(1, local));
        gsap.set(c, { opacity: 0.15 + eased * 0.85, y: 12 - eased * 12 });
      });
    },
  });
}

/** Re-chunk manifesto after language switch (i18n overwrites .mani-txt HTML). */
export function refreshManifestoForLang() {
  if (!document.documentElement.classList.contains('has-gsap-scroll')) return;
  if (!manifestoGsap || !manifestoST) return;
  setupManifestoPin(manifestoGsap, manifestoST);
}
