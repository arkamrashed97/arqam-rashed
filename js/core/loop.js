import { updateCursor } from './cursor.js';
import { updateHUD } from './hud.js';
import { updatePalette } from './palette.js';
import { computeActMix } from './scroll.js';
import { state } from './state.js';
import { clamp, damp } from './utils.js';
import { sound } from '../audio/index.js';
import { updateHeroPortrait } from './widgets.js';

let loopStarted = false;
let tickerActive = false;
let idleClockTimer = 0;
let idleUntil = 0;
let avgDt = 0.0167;
let sceneUpdater = null;
let worldsUpdater = null;
let glResizer = null;
let glRenderFn = null;
let lowPowerPost = false;
export let lastFrame = performance.now();

function attachTicker() {
  if (tickerActive) return;
  tickerActive = true;
  lastFrame = performance.now();
  gsap.ticker.add(tick);
}

function detachTicker() {
  if (!tickerActive) return;
  tickerActive = false;
  gsap.ticker.remove(tick);
}

export function wakeLoop(ms = 450) {
  idleUntil = Math.max(idleUntil, performance.now() + ms);
  if (loopStarted) attachTicker();
}

export function setSceneUpdater(fn, renderFn = null, resizer = null) {
  sceneUpdater = fn;
  glRenderFn = renderFn;
  glResizer = resizer;
  if (sceneUpdater && loopStarted) attachTicker();
}

export function setWorldsUpdater(fn) {
  worldsUpdater = fn;
  if (worldsUpdater && loopStarted) attachTicker();
}

export function tick() {
  const now = performance.now();
  const rawDt = (now - lastFrame) / 1000;
  lastFrame = now;
  if (document.hidden) return;

  const dt = clamp(rawDt, 0.001, 0.05);
  const langPending = document.documentElement.classList.contains('lang-pending');

  // While onboarding gate (#lang-gate) covers the viewport without active pointer movement, sleep
  if (langPending) {
    updateCursor(dt);
    if (now > idleUntil) detachTicker();
    return;
  }

  avgDt = avgDt * 0.92 + dt * 0.08;

  if (state.motion) state.time += dt;

  const velocityTarget = state.motion ? clamp(state.velocity * 0.02, -1.6, 1.6) : 0;
  state.velocitySmooth = damp(state.velocitySmooth, velocityTarget, 10, dt);
  state.velocity *= Math.pow(0.02, dt);
  if (Math.abs(state.velocity) < 0.005) state.velocity = 0;
  state.burst = Math.max(0, state.burst - dt * 1.6);

  state.actMix = computeActMix();
  updatePalette(now);

  sound.setActFromMix(state.actMix, { announce: state.ready });
  sound.setEnergy(state.velocitySmooth);

  if (sceneUpdater) sceneUpdater(dt);
  if (worldsUpdater) worldsUpdater(dt);
  updateHeroPortrait();
  updateCursor(dt);
  updateHUD(now);

  // Adaptive resolution + post-processing governor keeps transitions smooth on all GPUs
  if (glResizer) {
    if (avgDt > 0.021 && !lowPowerPost) {
      lowPowerPost = true;
      glResizer(0.76);
    } else if (avgDt < 0.0168 && lowPowerPost) {
      lowPowerPost = false;
      glResizer(1);
    }
  }

  if (glRenderFn) glRenderFn(lowPowerPost);

  // On CSS static fallback (no WebGL / no mini-game), sleep between scroll/pointer activity
  if (!sceneUpdater && !worldsUpdater) {
    const activeMotion = Math.abs(state.velocitySmooth) > 0.002 || Math.abs(state.velocity) > 0.01 || state.burst > 0.002 || now < idleUntil;
    if (!activeMotion) {
      detachTicker();
    }
  }
}

export function startLoop() {
  if (loopStarted) return;
  loopStarted = true;
  if (!idleClockTimer) {
    idleClockTimer = window.setInterval(() => {
      if (!document.hidden && !tickerActive && !document.documentElement.classList.contains('lang-pending')) {
        updateHUD(performance.now());
      }
    }, 1000);
  }
  wakeLoop(250);
  tick();
}
