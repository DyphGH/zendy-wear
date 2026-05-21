/**
 * boot-loader.js — entry script for the splash screen only.
 * Must be an external file (not inline) to satisfy CSP script-src.
 */
import { initLoader } from './loader.js';
import { lockScrollRestoration, scrollToPageTop, setPageScrollLocked } from './utils.js';

lockScrollRestoration();
scrollToPageTop();
setPageScrollLocked(true);

window.addEventListener('pageshow', (e) => {
  if (e.persisted) scrollToPageTop();
});

initLoader();
