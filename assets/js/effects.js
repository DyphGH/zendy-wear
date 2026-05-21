/**
 * effects.js — premium pointer effects.
 *
 *   initTilt()      — adds a subtle 3D tilt to product cards following the cursor.
 *                     CSS variables drive the transform (no transition during
 *                     hover for snappy response; transition kicks in on
 *                     mouseleave for smooth recovery).
 *
 *   initMagnetic()  — buttons marked `data-magnetic` are pulled toward the
 *                     cursor when it's within ~120px. rAF-throttled lerp so
 *                     they trail smoothly without ever lagging behind.
 *
 * Both effects bail entirely on:
 *   - touch / coarse pointer devices
 *   - prefers-reduced-motion
 *
 * No external dependencies.
 */

import { $$, isHoverCapable, prefersReducedMotion, rafThrottle } from './utils.js';

const RESET_CLASS = 'reset-tilt';

export function initTilt() {
  if (!isHoverCapable() || prefersReducedMotion()) return;

  const cards = $$('.pc');
  if (cards.length === 0) return;

  cards.forEach((card) => {
    // Mouse-move: snap to angle (no CSS transition active)
    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5..0.5
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.classList.remove(RESET_CLASS);
      card.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${( x * 5).toFixed(2)}deg`);
    };
    const onLeave = () => {
      // Add the reset class so CSS transition smooths back to 0
      card.classList.add(RESET_CLASS);
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
}

export function initMagnetic() {
  if (!isHoverCapable() || prefersReducedMotion()) return;

  const buttons = $$('[data-magnetic]');
  if (buttons.length === 0) return;

  // Per-button state. We track target + current separately so the lerp loop
  // can smooth toward target each frame.
  const states = buttons.map((btn) => ({
    btn,
    tx: 0, ty: 0,    // target offset
    cx: 0, cy: 0,    // current offset
    active: false,   // any non-zero state to render
  }));

  const RADIUS    = 120; // px from button center where pull engages
  const STRENGTH  = 0.28; // how much of the offset to apply (0..1)
  const SMOOTH    = 0.18; // lerp factor per frame (higher = snappier)
  const EPSILON   = 0.1;  // px — below this we snap and stop animating

  let rafId = 0;

  function loop() {
    let stillActive = false;
    for (const s of states) {
      const dx = s.tx - s.cx;
      const dy = s.ty - s.cy;
      if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON) {
        if (s.active) {
          s.cx = s.tx; s.cy = s.ty;
          s.btn.style.transform = s.tx === 0 && s.ty === 0
            ? ''
            : `translate(${s.cx.toFixed(2)}px, ${s.cy.toFixed(2)}px)`;
          s.active = s.tx !== 0 || s.ty !== 0;
        }
      } else {
        s.cx += dx * SMOOTH;
        s.cy += dy * SMOOTH;
        s.btn.style.transform = `translate(${s.cx.toFixed(2)}px, ${s.cy.toFixed(2)}px)`;
        s.active = true;
        stillActive = true;
      }
    }
    rafId = stillActive ? requestAnimationFrame(loop) : 0;
  }

  const onMove = rafThrottle((e) => {
    let needsLoop = false;
    for (const s of states) {
      const rect = s.btn.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        // Falloff: more pull when very close, less at the edge of the radius
        const falloff = 1 - dist / RADIUS;
        s.tx = dx * STRENGTH * falloff;
        s.ty = dy * STRENGTH * falloff;
        needsLoop = true;
      } else {
        s.tx = 0;
        s.ty = 0;
        if (s.active) needsLoop = true;
      }
    }
    if (needsLoop && !rafId) rafId = requestAnimationFrame(loop);
  });

  document.addEventListener('mousemove', onMove, { passive: true });
}

export function initEffects() {
  initTilt();
  initMagnetic();
}
