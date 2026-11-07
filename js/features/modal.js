import { CASE_STUDIES } from './case-studies-data.js';
import { scrollEngine } from '../core/scroll.js';

/**
 * Case-study drawer. Content comes from case-studies-data.js (EN + AR).
 * Opening pauses smooth scrolling and moves focus into the dialog; closing restores both.
 */
export function initModal() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;
  const el = (id) => document.getElementById(id);
  const parts = {
    index: el('modal-index'),
    title: el('modal-title'),
    desc: el('modal-desc'),
    metrics: el('modal-metrics'),
    archTitle: el('modal-arch-title'),
    archText: el('modal-arch-text'),
    link: el('modal-link'),
    close: el('modal-close'),
    backdrop: el('modal-backdrop')
  };
  let opener = null;

  function open(idx, trigger) {
    const data = CASE_STUDIES[idx];
    if (!data) return;
    const local = document.documentElement.lang === 'ar' ? data.ar : data;
    parts.index.textContent = local.index;
    parts.title.textContent = local.title;
    parts.desc.textContent = local.desc;
    parts.archTitle.textContent = local.archTitle;
    parts.archText.textContent = local.archText;
    parts.link.href = data.link;
    parts.link.textContent = local.btnText;
    parts.metrics.innerHTML = local.metrics
      .map((m) => `<div class="project-modal__metric"><b>${m.val}</b><span>${m.label}</span></div>`)
      .join('');

    opener = trigger || null;
    modal.hidden = false;
    modal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    if (scrollEngine.lenis) scrollEngine.lenis.stop();
    parts.close.focus({ preventScroll: true });
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (scrollEngine.lenis) scrollEngine.lenis.start();
    if (opener) opener.focus({ preventScroll: true });
    opener = null;
  }

  document.querySelectorAll('[data-case]').forEach((btn) => {
    btn.addEventListener('click', () => open(parseInt(btn.getAttribute('data-case'), 10), btn));
  });
  parts.close.addEventListener('click', close);
  parts.backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}
