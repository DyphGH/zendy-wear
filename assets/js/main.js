/**
 * main.js — entry point.
 *
 * Computes the device capability ONCE and passes it to every module that
 * cares (shader, hero-blob, scroll, reveal). That way they all agree on
 * whether we're running the high-tier 3D path or the CSS fallback path,
 * and there's no risk of (e.g.) the shader running while orbs are still
 * shown.
 */

import { initNavScroll }         from './nav.js';
import { initResponsiveImages }  from './responsive-images.js';
import { initCursor }            from './cursor.js';
import { initParallaxOrbs }  from './parallax-orbs.js';
import { initViewers }       from './viewer.js';
import { initSizeSelectors } from './size-selector.js';
import { initEffects }       from './effects.js';
import { initReveal }        from './reveal.js';
import { initNewsletter }    from './newsletter.js';
import { initModals }        from './modals.js';
import { initPricing }       from './pricing.js';
import { initCart }          from './cart.js';
import { initCheckout, handleCheckoutReturnFromUrl } from './checkout.js';
import { initSecurity }      from './security.js';
import { initShader }        from './shader.js';
import { initHeroBlob }      from './hero-blob.js';
import { initScroll }        from './scroll.js';
import { getDeviceCapability, lockScrollRestoration, scrollToPageTop, showToast } from './utils.js';
import { initI18n, onLangChange, t } from './i18n.js';
import { refreshManifestoForLang } from './scroll.js';

initResponsiveImages();

const ready = async () => {
  lockScrollRestoration();
  scrollToPageTop();
  initI18n();
  onLangChange(() => refreshManifestoForLang());
  const capability = getDeviceCapability();

  // Visible diagnostics so you can confirm at-a-glance whether 3D is on.
  // Open DevTools → Console to see this. The styled banner is hard to miss.
  const bannerStyle = (color) =>
    `background:#04040a;color:${color};padding:6px 12px;font-size:13px;font-weight:bold;font-family:monospace;letter-spacing:2px`;
  if (capability.use3D) {
    console.log('%c⚡ ZENDY · 3D MODE: ON', bannerStyle('#ff2dca'));
  } else {
    console.log('%c⚠ ZENDY · 3D MODE: OFF (CSS fallback)', bannerStyle('#b8ff00'));
  }
  console.log('Capability snapshot:', capability);
  console.log('Tip: %cwindow.__zendyCapability%c lets you re-check.', 'color:#ff2dca', '');

  // Expose for in-browser debugging
  try { window.__zendyCapability = capability; } catch { /* sandboxed */ }

  // Always-on modules
  try { initSecurity();       } catch (e) { console.warn('[security]', e); }
  try { initNavScroll();      } catch (e) { console.warn('[nav]', e); }
  try { initCursor();         } catch (e) { console.warn('[cursor]', e); }
  try { initViewers();        } catch (e) { console.warn('[viewer]', e); }
  try { initSizeSelectors();  } catch (e) { console.warn('[size-selector]', e); }
  try { initEffects();        } catch (e) { console.warn('[effects]', e); }
  try { initNewsletter();     } catch (e) { console.warn('[newsletter]', e); }
  try { await initModals();   } catch (e) { console.warn('[modals]', e); }
  try { await initPricing();  } catch (e) { console.warn('[pricing]', e); }
  try { initCart();           } catch (e) { console.warn('[cart]', e); }
  try { initCheckout();       } catch (e) { console.warn('[checkout]', e); }

  try {
    if (!(await handleCheckoutReturnFromUrl())) {
      const legacy = new URLSearchParams(location.search).get('checkout');
      if (legacy === 'success') {
        const { clearCart } = await import('./cart.js');
        clearCart();
        showToast(t('cart.checkoutSuccess'));
        history.replaceState({}, '', location.pathname + location.hash);
      }
    }
  } catch (e) { console.warn('[checkout return]', e); }

  // Reveal product/brand blocks immediately — never wait on CDN (Three/GSAP).
  // On the GSAP path, scroll.js takes over; IO is a no-op once .in is set.
  try {
    initReveal(capability.useReveal ? capability : { ...capability, useReveal: true });
  } catch (e) { console.warn('[reveal]', e); }

  // Capability-gated modules
  if (!capability.use3D) {
    try { initParallaxOrbs(); } catch (e) { console.warn('[parallax]', e); }
    return;
  }

  // High-tier path: WebGL shader, 3D blob, Lenis smooth scroll + GSAP (non-blocking)
  Promise.allSettled([
    initShader(capability),
    initHeroBlob(capability),
    initScroll(capability),
  ]).then((results) => {
    const names = ['shader', 'hero-blob', 'scroll'];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.warn(`%c✗ [${names[i]}] failed:`, bannerStyle('#b8ff00'), r.reason);
      } else {
        console.log(`%c✓ [${names[i]}] mounted`, 'color:#b8ff00;font-family:monospace');
      }
    });
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ready, { once: true });
} else {
  ready();
}

// Service worker registration — deferred to Phase 4 (when sw.js exists).
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () =>
//     navigator.serviceWorker.register('/sw.js').catch(() => {})
//   );
// }
