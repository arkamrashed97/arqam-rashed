import { finishBoot, prepareIntro, startBoot } from './core/boot.js';
import { initCursor } from './core/cursor.js';
import { prefersReduced, reducedQuery } from './core/env.js';
import { whenLanguageReady } from './core/lang.js';
import { startLoop } from './core/loop.js';
import { initScroll, measureLayout } from './core/scroll.js';
import { applyMotion, initMotionPreference, probeDomain, renderCopyLabel, setCluster } from './core/widgets.js';
import { buildActOne } from './gl/act1.js';
import { buildActTwo } from './gl/act2.js';
import { buildActThree } from './gl/act3.js';
import { buildActFour } from './gl/act4.js';
import { initGL, renderStaticFallback, setupResize } from './gl/renderer.js';
import { sceneState } from './gl/scene-state.js';
import { loadProjectTextures } from './gl/textures.js';
import { initLanguage } from './i18n/i18n.js';
import { armAutoStart, initSoundUI } from './audio/index.js';
import { initGate } from './features/gate.js';
import { initModal } from './features/modal.js';
import { initContact } from './features/contact.js';
import { initInquiry } from './features/inquiry.js';
import { initActWorlds } from './features/act-worlds.js';

/**
 * Portfolio application bootstrap.
 *
 * 1. Cursor, language, gate, sound UI, modal, contact, and inquiry form attach immediately
 *    so the language onboarding screen (#lang-gate) has a working custom cursor and audio unlock
 *    on the very first user interaction.
 * 2. Scroll, WebGL scene construction, and texture loading proceed without blocking the UI.
 */
async function init() {
  initCursor();
  const pendingGate = initLanguage();
  initSoundUI();
  armAutoStart();
  initGate(pendingGate);
  initModal();
  initContact();
  initInquiry();
  initActWorlds();

  await whenLanguageReady();
  initMotionPreference();
  initScroll();
  startBoot();
  prepareIntro();
  setCluster(0);
  renderCopyLabel();
  window.setTimeout(probeDomain, 2600);

  if (initGL()) {
    buildActOne();
    buildActTwo();
    buildActThree();
    buildActFour();
    setupResize();
    startLoop();

    try {
      sceneState.renderer.compile(sceneState.scene, sceneState.camera);
    } catch (err) {
      console.warn('Shader precompile skipped', err);
    }

    window.setTimeout(() => finishBoot(), 7000);
    loadProjectTextures().finally(() => finishBoot());
  } else {
    renderStaticFallback();
    startLoop();
    window.setTimeout(() => finishBoot(), prefersReduced ? 300 : 1600);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      measureLayout();
      ScrollTrigger.refresh();
    }).catch(() => {});
  }

  reducedQuery.addEventListener('change', (event) => {
    applyMotion(!event.matches, false);
  });
}

init().catch((err) => {
  console.error('Portfolio init failed', err);
  renderStaticFallback();
  try {
    startLoop();
  } catch (loopError) {
    console.error(loopError);
  }
  finishBoot();
});
