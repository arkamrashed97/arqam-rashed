import { applyLanguage, toggleLanguage } from '../i18n/i18n.js';
import { finishBoot } from '../core/boot.js';
import { haptic } from '../core/env.js';
import { sound } from '../audio/index.js';

/**
 * Language onboarding gate (#lang-gate).
 * - Locks all wheel/touch/keyboard scrolling while open.
 * - Provides dedicated, distinct ElevenLabs audio cues for every element on the onboarding screen.
 * - Choosing a language unlocks & enables the full soundscape and opens Act I cleanly at scroll 0.
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

  // Ensure page starts at the very top and pre-decode all onboarding cues immediately
  window.scrollTo(0, 0);
  sound.preloadGate();

  const playGateCue = (name, opts = {}) => {
    sound.unlock();
    sound.playNow(name, { force: true, ...opts });
  };

  // Block wheel and touchmove scrolling completely while onboarding gate is active
  const preventGateScroll = (e) => {
    if (root.classList.contains('lang-pending')) {
      e.preventDefault();
    }
  };
  gate.addEventListener('wheel', preventGateScroll, { passive: false });
  gate.addEventListener('touchmove', preventGateScroll, { passive: false });

  gate.removeAttribute('aria-hidden');
  window.setTimeout(() => {
    if (!root.classList.contains('lang-pending')) return;
    const first = gate.querySelector('[data-lang-choice]');
    if (first) first.focus({ preventScroll: true });
  }, 90);

  // Gate pointerdown unlocks WebAudio context silently without jarring sound bursts
  gate.addEventListener('pointerdown', () => {
    sound.unlock();
  });

  const finish = () => {
    window.scrollTo(0, 0);
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
    finishBoot(true);
    window.dispatchEvent(new CustomEvent('arqam:gate-closed'));

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => gate.remove(), reduced ? 0 : 340);
  };

  gate.querySelectorAll('[data-lang-choice]').forEach((button) => {
    const lang = button.getAttribute('data-lang-choice');
    const hoverCue = lang === 'ar' ? 'gate-hover-ar' : 'gate-hover-en';
    const selectCue = lang === 'ar' ? 'gate-select-ar' : 'gate-select-en';
    const pan = lang === 'ar' ? -0.22 : 0.22;

    button.addEventListener('pointerenter', () => {
      playGateCue(hoverCue, { pan });
    });
    button.addEventListener('focus', () => {
      playGateCue(hoverCue, { pan });
    });
    button.addEventListener('pointerdown', () => {
      haptic(8);
      playGateCue(hoverCue, { pan, rate: 1.04 });
    });
    button.addEventListener('click', () => {
      haptic(14);
      // Unlock and enable ambient soundscape inside the user gesture, then play language-specific portal cue
      sound.enable();
      sound.playNow(selectCue, { force: true, pan });
      applyLanguage(lang, true);
      finish();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (!root.classList.contains('lang-pending')) return;
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(event.key) && !event.target.closest('[data-lang-choice]')) {
      event.preventDefault();
      return;
    }
    if (event.key !== 'Tab') return;
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
