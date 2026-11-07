import { langText } from './lang.js';
import { measureLayout } from './scroll.js';
import { ACT_NAME_KEYS, refs, state } from './state.js';
import { clamp } from './utils.js';
import { applyMotion, renderCopyLabel, renderDomain, setCluster } from './widgets.js';

/* HUD telemetry */
export const clockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

export const hudStats = {
  lastTime: performance.now(),
  frames: 0,
  fps: 60,
  lastClock: '',
  lastWave: 0,
  lastCoords: 0,
  lastAct: -1
};

export function updateHUD(now) {
  hudStats.frames++;
  if (now - hudStats.lastTime > 500) {
    hudStats.fps = Math.round((hudStats.frames * 1000) / (now - hudStats.lastTime));
    hudStats.frames = 0;
    hudStats.lastTime = now;
    if (refs.fps) refs.fps.textContent = String(hudStats.fps);
    if (refs.fps2) refs.fps2.textContent = String(hudStats.fps);
  }

  if (now - hudStats.lastClock > 900) {
    hudStats.lastClock = now;
    const clock = clockFormatter.format(new Date());
    if (refs.clock) refs.clock.textContent = 'CAI ' + clock;
  }

  if (now - hudStats.lastCoords > 90) {
    hudStats.lastCoords = now;
    document.body.classList.toggle('contact-in-view', (state.m3 || 0) > 0.18);
    if (refs.pointerCoords) {
      refs.pointerCoords.textContent = String(Math.round(state.pointerX)).padStart(4, '0') + ' / ' + String(Math.round(state.pointerY)).padStart(4, '0');
    }
    if (refs.velReadout) refs.velReadout.textContent = Math.abs(state.velocitySmooth).toFixed(3);
  }

  if (now - hudStats.lastWave > 70) {
    hudStats.lastWave = now;
    const points = [];
    const amplitude = state.motion ? 1 + Math.min(3.4, Math.abs(state.velocitySmooth) * 1.5) : 0.25;
    for (let i = 0; i < 13; i++) {
      const x = (i / 12) * 74;
      const base = Math.sin(state.time * 3.4 + i * 0.85) * 1.35;
      const mod = Math.sin(state.time * 1.3 + i * 1.9) * 1.1;
      const y = 10 + (base + mod) * amplitude * (i === 0 || i === 12 ? 0.2 : 1);
      points.push(x.toFixed(1) + ',' + clamp(y, 1, 19).toFixed(1));
    }
    if (refs.wave) refs.wave.setAttribute('points', points.join(' '));
  }

  const actIndex = clamp(Math.round(state.actMix), 0, 4);
  if (actIndex !== hudStats.lastAct) {
    hudStats.lastAct = actIndex;
    if (refs.hudActNum) refs.hudActNum.textContent = '0' + (actIndex + 1);
    if (refs.hudActName) refs.hudActName.textContent = langText(ACT_NAME_KEYS[actIndex]);
    refs.actLinks.forEach((a) => {
      a.classList.toggle('is-active', Number(a.dataset.actLink) === actIndex);
    });
    document.body.classList.toggle('act-4-on', actIndex >= 3);
  }
}

/* Language changes update every live label without a reload */
window.addEventListener('arqam:lang', () => {
  if (!state.ready) return;
  setCluster(state.activeCluster);
  applyMotion(state.motion, false);
  renderCopyLabel();
  renderDomain();
  if (refs.hudActName) {
    refs.hudActName.textContent = langText(ACT_NAME_KEYS[clamp(Math.round(state.actMix), 0, 4)]);
  }
  if (document.body.classList.contains('cursor-hover')) {
    const hovered = document.querySelector('[data-cursor]:hover');
    if (hovered && refs.cursorLabel) refs.cursorLabel.textContent = hovered.dataset.cursor || '';
  }
  measureLayout();
  ScrollTrigger.refresh();
});
