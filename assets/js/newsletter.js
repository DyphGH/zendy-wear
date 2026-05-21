/**
 * newsletter.js — newsletter signup at the footer.
 *
 * Phase 1: validates email client-side and opens a mailto: to drop the
 * address into your inbox (defensive; not a real list, but works pre-launch).
 *
 * Phase 4 / later: swap the submit handler to POST to a privacy-friendly
 * provider (Buttondown, Listmonk, EmailOctopus). The TODO comment marks
 * the exact line to change.
 */

import { $, isValidEmail } from './utils.js';
import { t } from './i18n.js';

export function initNewsletter() {
  const form = $('.newsletter');
  if (!form) return;
  const input = form.querySelector('input[type="email"]');
  const msg   = $('.newsletter-msg');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = (input.value || '').trim();

    if (!isValidEmail(value)) {
      setMsg(msg, t('newsletter.invalid'), 'error');
      input.focus();
      return;
    }

    // ---- TODO[Phase 4]: replace with real API POST ------------------------
    // fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email: value }) })
    //   .then(r => r.ok ? setMsg(msg, 'Subscribed. Welcome to the noise.', 'ok')
    //                   : setMsg(msg, 'Something broke. Try again.', 'error'));
    // -----------------------------------------------------------------------
    const body =
      `${t('newsletter.mailIntro')}\n${value}\n\n${t('newsletter.mailNote')}`;
    window.location.href =
      `mailto:zendywear@gmail.com?subject=${encodeURIComponent(t('newsletter.mailSubject'))}` +
      `&body=${encodeURIComponent(body)}`;

    setMsg(msg, t('newsletter.ok'), 'ok');
    input.value = '';
  });
}

/** textContent only — no innerHTML, no user input interpolated into HTML. */
function setMsg(el, text, kind) {
  if (!el) return;
  el.textContent = text;
  el.classList.remove('ok', 'error');
  if (kind) el.classList.add(kind);
}
