/**
 * security.js — endurecimento no cliente (deterrentes UX).
 * Nota: HTML/CSS/JS são sempre descarregáveis; isto dificulta cópia casual.
 */

const ALLOW_INTERACTION =
  'input, textarea, select, option, [contenteditable="true"], [data-allow-select]';

function isEditableTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  return Boolean(target.closest(ALLOW_INTERACTION));
}

function hardenImages(root = document) {
  root.querySelectorAll('img').forEach((img) => {
    img.draggable = false;
    img.setAttribute('draggable', 'false');
    img.setAttribute('ondragstart', 'return false');
  });
}

export function initSecurity() {
  hardenImages();

  const imgObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node instanceof HTMLImageElement) hardenImages(node.parentElement || document);
        else if (node instanceof Element) hardenImages(node);
      });
    }
  });
  imgObserver.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('contextmenu', (e) => {
    if (isEditableTarget(e.target)) return;
    e.preventDefault();
  });

  document.addEventListener('dragstart', (e) => {
    const t = e.target;
    if (t instanceof HTMLImageElement || t.closest?.('img, picture, svg, video, canvas')) {
      e.preventDefault();
    }
  });

  document.addEventListener('copy', (e) => {
    if (isEditableTarget(e.target)) return;
    e.preventDefault();
  });

  document.addEventListener('cut', (e) => {
    if (isEditableTarget(e.target)) return;
    e.preventDefault();
  });

  document.addEventListener('selectstart', (e) => {
    if (isEditableTarget(e.target)) return;
    e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    if (isEditableTarget(document.activeElement)) return;

    const key = e.key?.toLowerCase?.() || '';
    const ctrl = e.ctrlKey || e.metaKey;

    if (key === 'f12') {
      e.preventDefault();
      return;
    }
    if (ctrl && e.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) {
      e.preventDefault();
      return;
    }
    if (ctrl && ['u', 's', 'p'].includes(key)) {
      e.preventDefault();
    }
  }, true);

  return function cleanup() {
    imgObserver.disconnect();
  };
}
