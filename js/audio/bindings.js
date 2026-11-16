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
    btn.classList.toggle('is-muted', !on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    const ar = document.documentElement.lang === 'ar';
    btn.setAttribute('title', on ? (ar ? 'إيقاف الصوت المحيطي' : 'Mute ambient sound') : (ar ? 'تشغيل الصوت المحيطي' : 'Enable ambient sound'));
    if (label) {
      label.textContent = on ? (ar ? 'الصوت: يعمل' : 'SOUND: ON') : (ar ? 'الصوت: صامت' : 'SOUND: OFF');
    }
  }

  sound.onChange(syncButton);
  window.addEventListener('arqam:lang', () => syncButton(sound.enabled));
  syncButton(sound.enabled);

  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      haptic(10);
      sound.toggle();
    });
  }

  // Track pointer X across the viewport for subtle stereo placement & wake idle ambience
  let lastActivityPing = 0;
  const pingActivity = () => {
    const now = performance.now();
    if (now - lastActivityPing > 450) {
      lastActivityPing = now;
      sound.touchActivity();
    }
  };

  const handleMove = (clientX) => {
    const nx = (clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    sound.setPointer(nx);
    pingActivity();
  };

  window.addEventListener('pointermove', (e) => {
    handleMove(e.clientX);
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    } else {
      pingActivity();
    }
  }, { passive: true });

  window.addEventListener('scroll', pingActivity, { passive: true });

  // Delegated click sound — only on actual interactive elements, with clean debounce
  let lastClickSfxAt = 0;
  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('#sound-toggle, [data-lang-choice]')) return;
    const hit = e.target.closest('[data-sfx], ' + INTERACTIVE);
    if (!hit) return;

    const now = performance.now();
    if (now - lastClickSfxAt < 130) return;
    lastClickSfxAt = now;
    sound.touchActivity();

    const explicit = hit.getAttribute('data-sfx');
    if (explicit === 'none') return;
    if (explicit) {
      sound.play(explicit);
      return;
    }
    const act = actOfElement(hit);
    sound.play(ACT_BUTTON_SFX[act] || 'btn-act1');
  }, true);

  // Subtle hover cue on desktop mouse only, with gentle spacing so sweeping never chatters
  let lastHoverEl = null;
  let lastHoverAt = 0;
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!sound.enabled) return;
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('#sound-toggle, [data-lang-choice]')) return;
    const hit = e.target.closest('a, button, [role="button"], .cluster');
    if (!hit || hit === lastHoverEl) return;
    lastHoverEl = hit;
    const now = performance.now();
    if (now - lastHoverAt < 220) return;
    lastHoverAt = now;
    sound.play('hover-soft');
  }, { passive: true });

  // Soft key tap inside the inquiry form
  const form = document.getElementById('inquiry-form');
  if (form) {
    form.addEventListener('keydown', (e) => {
      sound.touchActivity();
      if (e.key.length === 1 || e.key === 'Backspace') sound.play('type-tick');
    });
  }
}

export function armAutoStart() {
  const events = ['click', 'keydown'];
  const start = (e) => {
    if (e && e.target instanceof Element) {
      if (e.target.closest('#sound-toggle, #lang-gate, [data-lang-choice]')) return;
    }
    events.forEach((ev) => window.removeEventListener(ev, start, true));
    if (sound.preferenceOff || sound.enabled) return;
    sound.enable({ delayAmbientMs: 250, playCue: false });
  };
  events.forEach((ev) => window.addEventListener(ev, start, { capture: true, passive: true }));
}
