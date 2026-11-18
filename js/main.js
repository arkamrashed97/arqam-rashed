import { CONFIG } from './config.js';
import { finishBoot, prepareIntro, startBoot } from './core/boot.js';
import { initCursor } from './core/cursor.js';
import { mobileQuery, reducedQuery } from './core/env.js';
import { whenLanguageReady } from './core/lang.js';
import { setSceneUpdater, setWorldsUpdater, startLoop } from './core/loop.js';
import { initScroll, measureLayout } from './core/scroll.js';
import { refs, state } from './core/state.js';
import { assetPath } from './core/utils.js';
import { applyMotion, initMotionPreference, probeDomain, renderCopyLabel, setCluster } from './core/widgets.js';
import { initLanguage } from './i18n/i18n.js';
import { armAutoStart, initSoundUI } from './audio/index.js';
import { initGate } from './features/gate.js';
import { initModal } from './features/modal.js';
import { initProjectGalleries } from './features/project-gallery.js';
import { initContact } from './features/contact.js';
import { initInquiry } from './features/inquiry.js';

let fallbackResizeBound = false;
function bindFallbackResize() {
  if (fallbackResizeBound) return;
  fallbackResizeBound = true;
  let raf = 0;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      measureLayout();
      if (!mobileQuery.matches && typeof window.ScrollTrigger !== 'undefined') {
        window.ScrollTrigger.refresh();
      }
    });
  };
  window.addEventListener('resize', schedule, { passive: true });
  if ('ResizeObserver' in window) {
    let lastH = document.documentElement.scrollHeight;
    const ro = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (h !== lastH) {
        lastH = h;
        schedule();
      }
    });
    ro.observe(document.documentElement);
  }
}

function renderStaticFallback() {
  document.body.classList.add('no-gl', 'static-work');
  if (refs.gpuMode) refs.gpuMode.textContent = 'STATIC / MONOLITH FALLBACK';
  if (refs.gpuReadout) refs.gpuReadout.textContent = 'CSS';
  state.gl = false;
  bindFallbackResize();
  measureLayout();
}

function probeWebGLContext() {
  const canvas = document.getElementById('gl');
  if (!canvas) return null;
  try {
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      failIfMajorPerformanceCaveat: true
    });
    if (!gl) return null;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      const renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '');
      if (/swiftshader|llvmpipe|softpipe|software/i.test(renderer)) return null;
    }
    return gl;
  } catch (err) {
    return null;
  }
}

/**
 * Portfolio application bootstrap.
 *
 * 1. Cursor, language, gate, sound UI, modal, contact, and inquiry form attach immediately
 *    without blocking on WebGL or unused scripts.
 * 2. Hero renders immediately at 0ms; WebGL + optional features load asynchronously once ready.
 */
async function init() {
  initCursor();
  const pendingGate = initLanguage();
  initSoundUI();
  armAutoStart();
  initGate(pendingGate);
  initProjectGalleries();
  initModal();
  initContact();
  initInquiry();

  if (CONFIG.enableFishingGame) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = assetPath('css/fishing.css');
    document.head.appendChild(link);
    import('./features/act-worlds.js')
      .then(({ initActWorlds, updateActWorlds }) => {
        initActWorlds();
        setWorldsUpdater(updateActWorlds);
      })
      .catch(() => {});
  }

  await whenLanguageReady();
  initMotionPreference();
  initScroll();
  startBoot();
  prepareIntro();
  setCluster(0);
  renderCopyLabel();
  startLoop();
  finishBoot();
  window.setTimeout(probeDomain, 2600);

  const glContext = probeWebGLContext();
  if (!glContext) {
    renderStaticFallback();
  } else {
    const bootGL = () => {
      import('./gl/bootstrap.js')
        .then(({ bootWebGLScene }) => {
          if (!bootWebGLScene(glContext, setSceneUpdater)) {
            renderStaticFallback();
          }
        })
        .catch(() => renderStaticFallback());
    };
    if (document.readyState === 'complete') {
      window.setTimeout(bootGL, 160);
    } else {
      window.addEventListener('load', () => window.setTimeout(bootGL, 160), { once: true });
    }
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      measureLayout();
      if (!mobileQuery.matches && typeof window.ScrollTrigger !== 'undefined') {
        window.ScrollTrigger.refresh();
      }
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
  finishBoot(true);
});
