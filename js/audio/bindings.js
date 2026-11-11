import { sound } from './engine.js';
import { ACT_BUTTON_SFX } from './manifest.js';
import { haptic } from '../core/env.js';

/**
 * Connects DOM events (clicks, hovers, typing, pointer pan, physical mouse/touch sweeps)
 * to the sound engine.
 */

const INTERACTIVE = 'a, button, [role="button"], select, [data-cursor], .cluster';

function actOfElement(el) {
  const sec = el.closest('[data-act]');
  if (sec) return Math.max(0, Math.min(4, parseInt(sec.getAttribute('data-act'), 10) || 0));
  if (el.closest('.site-footer')) return 3;
  return sound.currentAct;
}

export function initSoundUI() {
  const btn = document.getElementById('sound-toggle');
  const label = document.getElementById('sound-label') || document.getElementById('sound-toggle-text');

  function syncButton(on) {
    if (!btn) return;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (label) {
      const ar = document.documentElement.lang === 'ar';
      label.textContent = on ? (ar ? 'الصوت: مفعّل' : 'SOUND: ON') : (ar ? 'الصوت' : 'SOUND');
    }
  }

  sound.onChange(syncButton);
  window.addEventListener('arqam:lang', () => syncButton(sound.enabled));
  syncButton(sound.enabled);

  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      haptic(12);
      sound.toggle();
    });
  }

  // Track pointer X across the viewport for clean stereo placement
  const handleMove = (clientX) => {
    const nx = (clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    sound.setPointer(nx);
  };

  window.addEventListener('pointermove', (e) => {
    handleMove(e.clientX);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  }, { passive: true });

  // Delegated click sound — only on actual interactive elements
  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('#sound-toggle, [data-lang-choice]')) return;
    const hit = e.target.closest('[data-sfx], ' + INTERACTIVE);
    if (!hit) return; // Clean silence on empty page clicks

    const explicit = hit.getAttribute('data-sfx');
    if (explicit === 'none') return;
    if (explicit) {
      sound.play(explicit);
      return;
    }
    const act = actOfElement(hit);
    sound.play(ACT_BUTTON_SFX[act] || 'btn-act1');
  }, true);

  // Subtle hover cue on real links, buttons, and cluster cards only
  let lastHoverEl = null;
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (!(e.target instanceof Element)) return;
    const hit = e.target.closest('a, button, [role="button"], .cluster');
    if (!hit || hit === lastHoverEl) return;
    lastHoverEl = hit;
    sound.play('hover-soft');
  }, { passive: true });

  // Soft key tap inside the inquiry form
  const form = document.getElementById('inquiry-form');
  if (form) {
    form.addEventListener('keydown', (e) => {
      if (e.key.length === 1 || e.key === 'Backspace') sound.play('type-tick');
    });
  }
}

export function armAutoStart() {
  if (sound.preferenceOff) return;
  const events = ['click', 'pointerup', 'touchend', 'keydown'];
  const start = () => {
    events.forEach((ev) => window.removeEventListener(ev, start, true));
    if (sound.preferenceOff) return;
    sound.enable();
  };
  events.forEach((ev) => window.addEventListener(ev, start, { capture: true, passive: true }));
}
