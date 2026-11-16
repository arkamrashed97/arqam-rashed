import { prefersReduced } from '../core/env.js';
import { finishBoot } from '../core/boot.js';
import { setPaletteSync } from '../core/palette.js';
import { sceneState } from './scene-state.js';
import { syncScenePalette } from './palette-sync.js';
import { initGL, renderGLFrame, setDynamicResolution, setupResize } from './renderer.js';
import { buildActOne } from './act1.js';
import { buildActTwo } from './act2.js';
import { buildActThree } from './act3.js';
import { buildActFour } from './act4.js';
import { observeProjectTextures } from './textures.js';
import { updateScene } from './update.js';

/**
 * Lazy-loaded WebGL runtime bundle.
 * Dynamically imported only when WebGL2/WebGL context creation succeeds cleanly,
 * keeping initial paint unblocked and avoiding dead Three.js payload on no-GL devices.
 */
export function bootWebGLScene(existingContext, setSceneUpdater) {
  if (!initGL(existingContext)) return false;
  setPaletteSync(syncScenePalette);
  setSceneUpdater(updateScene, renderGLFrame, setDynamicResolution);
  buildActOne();
  setupResize();
  window.setTimeout(() => finishBoot(), prefersReduced ? 40 : 80);

  const runIdle = (fn, delay) => {
    window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => fn(), { timeout: 900 });
      } else {
        fn();
      }
    }, delay);
  };

  runIdle(() => {
    if (!sceneState.planeGroup) {
      buildActTwo();
      observeProjectTextures();
    }
  }, 90);

  runIdle(() => {
    if (!sceneState.pointsGroup) buildActThree();
  }, 220);

  runIdle(() => {
    if (!sceneState.ringGroup) buildActFour();
  }, 360);

  return true;
}
