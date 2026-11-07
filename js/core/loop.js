import { updateCursor } from './cursor.js';
import { mobileQuery } from './env.js';
import { updateHUD } from './hud.js';
import { updatePalette } from './palette.js';
import { computeActMix } from './scroll.js';
import { state } from './state.js';
import { clamp, damp } from './utils.js';
import { setDynamicResolution } from '../gl/renderer.js';
import { sceneState } from '../gl/scene-state.js';
import { updateScene } from '../gl/update.js';
import { sound } from '../audio/index.js';

let loopStarted = false;
let avgDt = 0.0167;
let lowPowerPost = false;
export let lastFrame = performance.now();

export function tick() {
  const now = performance.now();
  const rawDt = (now - lastFrame) / 1000;
  lastFrame = now;
  if (document.hidden) return;

  const dt = clamp(rawDt, 0.001, 0.05);
  avgDt = avgDt * 0.92 + dt * 0.08;

  state.scroll = window.scrollY;
  if (state.motion) state.time += dt;

  const velocityTarget = state.motion ? clamp(state.velocity * 0.02, -1.6, 1.6) : 0;
  state.velocitySmooth = damp(state.velocitySmooth, velocityTarget, 10, dt);
  state.burst = Math.max(0, state.burst - dt * 1.6);

  state.actMix = computeActMix();
  updatePalette(now);

  const activeAct = clamp(Math.round(state.actMix), 0, 4);
  sound.setAct(activeAct);
  sound.setEnergy(state.velocitySmooth);

  updateScene(dt);
  updateCursor(dt);
  updateHUD(now);

  // Adaptive resolution + post-processing governor keeps transitions smooth on all GPUs
  if (avgDt > 0.024 && !lowPowerPost) {
    lowPowerPost = true;
    setDynamicResolution(0.8);
  } else if (avgDt < 0.0175 && lowPowerPost) {
    lowPowerPost = false;
    setDynamicResolution(1);
  }

  if (sceneState.renderer && !sceneState.glContextLost) {
    const fastScroll = Math.abs(state.velocitySmooth) > 0.35;
    if (mobileQuery.matches || lowPowerPost || fastScroll || !sceneState.composer) {
      sceneState.renderer.render(sceneState.scene, sceneState.camera);
    } else {
      sceneState.composer.render();
    }
  }
}

export function startLoop() {
  if (loopStarted) return;
  loopStarted = true;
  lastFrame = performance.now();
  gsap.ticker.add(tick);
}
