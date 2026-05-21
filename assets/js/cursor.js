/**
 * cursor.js — custom cursor for desktop (hover + fine pointer only).
 */

import { $, isHoverCapable, prefersReducedMotion, rafThrottle } from './utils.js';

export function initCursor() {
  if (!isHoverCapable()) return () => {};

  const cur = $('#cursor');
  if (!cur) return () => {};

  document.body.appendChild(cur);
  document.documentElement.classList.add('has-cursor');

  const reduceMotion = prefersReducedMotion();
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let cx = mx;
  let cy = my;
  let rafId = 0;

  function setPos(x, y) {
    cur.style.left = `${x}px`;
    cur.style.top = `${y}px`;
  }

  setPos(cx, cy);

  const onMove = rafThrottle((e) => {
    mx = e.clientX;
    my = e.clientY;
    if (reduceMotion) setPos(mx, my);
  });

  function tick() {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    setPos(cx, cy);
    rafId = requestAnimationFrame(tick);
  }

  if (!reduceMotion) rafId = requestAnimationFrame(tick);

  const onDown = () => cur.classList.add('click');
  const onUp = () => cur.classList.remove('click');

  const HOVER_SELECTOR =
    'a, button, .pc, .detail-card, .brand-frame, input, [data-hover], ' +
    '#zendy-modal-root button, #zendy-modal-root a, #zendy-modal-root input, #zendy-modal-root select, ' +
    '#cart-drawer button, #cart-drawer a, #cart-drawer input, #cart-drawer select';

  function onOver(e) {
    if (e.target.closest(HOVER_SELECTOR)) cur.classList.add('hover');
  }
  function onOut(e) {
    if (e.target.closest(HOVER_SELECTOR) && !e.relatedTarget?.closest(HOVER_SELECTOR)) {
      cur.classList.remove('hover');
    }
  }

  document.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mousedown', onDown);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('mouseover', onOver);
  document.addEventListener('mouseout', onOut);

  return function cleanup() {
    cancelAnimationFrame(rafId);
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mousedown', onDown);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('mouseover', onOver);
    document.removeEventListener('mouseout', onOut);
    document.documentElement.classList.remove('has-cursor');
  };
}
