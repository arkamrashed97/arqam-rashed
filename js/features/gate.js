import { applyLanguage, toggleLanguage } from '../i18n/i18n.js';
import { finishBoot } from '../core/boot.js';
import { haptic } from '../core/env.js';
import { sound } from '../audio/index.js';

/**
 * Language onboarding gate.
 * Choosing a language closes the gate, reveals the page, starts the boot hand-off and
 * (inside the same tap, which browsers require) switches the soundscape on.
 */
export function initGate(pending) {
  const root = document.documentElement;
  const gate = document.getElementById('lang-gate');

  const toggle = document.getElementById('lang-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      haptic(10);
      toggleLanguage();
    });
  }
  if (!gate) return;

  if (!pending) {
    gate.hidden = true;
    gate.setAttribute('aria-hidden', 'true');
    gate.remove();
    return;
  }

  gate.removeAttribute('aria-hidden');
  window.setTimeout(() => {
    if (!root.classList.contains('lang-pending')) return;
    const first = gate.querySelector('[data-lang-choice]');
    if (first) first.focus({ preventScroll: true });
  }, 90);

  const finish = () => {
    gate.classList.add('is-closing');
    gate.style.pointerEvents = 'none';
    gate.style.opacity = '0';
    root.classList.remove('lang-pending');
    root.classList.add('lang-set');
    document.body.classList.remove('is-booting');
    document.body.classList.add('is-ready');
    const boot = document.getElementById('boot');
    if (boot) {
      boot.hidden = true;
      boot.setAttribute('aria-hidden', 'true');
      boot.style.display = 'none';
    }
    finishBoot();
    window.dispatchEvent(new CustomEvent('arqam:gate-closed'));

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => gate.remove(), reduced ? 0 : 340);
  };

  gate.querySelectorAll('[data-lang-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      haptic(10);
      // Order matters: unlock audio first, synchronously, inside the user gesture.
      sound.enable();
      sound.play('gate-open');
      applyLanguage(button.getAttribute('data-lang-choice'), true);
      finish();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (!root.classList.contains('lang-pending') || event.key !== 'Tab') return;
    const buttons = gate.querySelectorAll('[data-lang-choice]');
    if (!buttons.length) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
