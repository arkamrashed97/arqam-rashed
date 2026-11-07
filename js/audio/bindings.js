import { sound } from './engine.js';
import { ACT_BUTTON_SFX, ACT_TOUCH_SFX } from './manifest.js';
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
  const label = document.getElementById('sound-label');

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

  // Track pointer X across the viewport (mouse AND touch) for stereo placement + velocity audio
  let lastX = window.innerWidth / 2;
  let lastY = window.innerHeight / 2;
  let lastT = performance.now();

  const handleMove = (clientX, clientY, isTouch = false) => {
    const nx = (clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    sound.setPointer(nx);
    if (!sound.enabled) return;

    const now = performance.now();
    const dt = Math.max(8, now - lastT);
    const dx = clientX - lastX;
    const dy = clientY - lastY;
    const dist = Math.hypot(dx, dy);
    const speed = dist / dt; // px per ms
    lastX = clientX;
    lastY = clientY;
    lastT = now;

    // Physical kinetic brush/ripple sound when sweeping the mouse or dragging finger briskly
    const threshold = isTouch ? 1.15 : 2.1;
    if (speed > threshold && dist > 28) {
      const act = sound.currentAct;
      const cue = ACT_TOUCH_SFX[act] || 'touch-act1';
      const rate = Math.max(0.85, Math.min(1.22, 0.9 + speed * 0.08));
      const gain = Math.max(0.45, Math.min(0.88, 0.45 + speed * 0.1));
      sound.play(cue, { rate, gain, pan: nx * 0.65, cooldown: isTouch ? 360 : 480 });
    }
  };

  window.addEventListener('pointermove', (e) => {
    handleMove(e.clientX, e.clientY, e.pointerType === 'touch');
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY, true);
    }
  }, { passive: true });

  // Delegated click sound
  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('#sound-toggle, [data-lang-choice]')) return;
    const hit = e.target.closest('[data-sfx], ' + INTERACTIVE);
    if (!hit) {
      // Clicking/tapping empty space triggers subtle physical section touch cue
      if (sound.enabled && sound.currentAct < 4) {
        const cue = ACT_TOUCH_SFX[sound.currentAct] || 'touch-act1';
        sound.play(cue, { gain: 0.72, rate: 0.96 + Math.random() * 0.08 });
      }
      return;
    }
    const explicit = hit.getAttribute('data-sfx');
    if (explicit === 'none') return;
    if (explicit) {
      sound.play(explicit);
      return;
    }
    const act = actOfElement(hit);
    sound.play(ACT_BUTTON_SFX[act] || 'btn-act1');
  }, true);

  // Subtle hover cue on interactive targets
  let lastHoverEl = null;
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (!(e.target instanceof Element)) return;
    const hit = e.target.closest(INTERACTIVE);
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
