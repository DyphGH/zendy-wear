/**
 * parallax-orbs.js — gentle mouse parallax on the hero orbs.
 *
 * This is Phase 1's "submersive" feel until the Three.js blob lands in
 * Phase 3. When that happens, this module can be deleted and the orbs
 * removed from HTML (or kept as no-WebGL fallback).
 */

import { $$, isHoverCapable, prefersReducedMotion, rafThrottle } from './utils.js';

export function initParallaxOrbs() {
  if (!isHoverCapable() || prefersReducedMotion()) return;

  const orbs = $$('[data-depth]');
  if (orbs.length === 0) return;

  const handler = rafThrottle((e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    orbs.forEach((el) => {
      const d = parseFloat(el.dataset.depth) || 0.3;
      el.style.transform = `translate(${dx * d * 30}px, ${dy * d * 20}px)`;
    });
  });

  document.addEventListener('mousemove', handler, { passive: true });
}
