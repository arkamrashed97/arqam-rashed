import { finePointerQuery, mobileQuery, prefersReduced } from './env.js';
import { wakeLoop } from './loop.js';
import { layout, refs, state } from './state.js';
import { $, assetPath, clamp, smoothstep } from './utils.js';

/** Holder so other modules can reach the Lenis instance (null on touch devices / reduced motion). */
export const scrollEngine = { lenis: null };

const loadedScripts = new Map();
let desktopInitialized = false;

function loadScriptOnce(relSrc) {
  const url = assetPath(relSrc);
  if (loadedScripts.has(url)) return loadedScripts.get(url);
  const promise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(s);
  });
  loadedScripts.set(url, promise);
  return promise;
}

function attachPassiveScroll(withTriggerUpdate) {
  let lastY = state.scroll || 0;
  let lastT = performance.now();
  window.addEventListener('scroll', () => {
    if (document.documentElement.classList.contains('lang-pending')) {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
      return;
    }
    const now = performance.now();
    const dt = Math.max(8, now - lastT);
    const y = window.scrollY;
    state.scroll = y;
    state.velocity = ((y - lastY) / dt) * 16.667;
    lastY = y;
    lastT = now;
    wakeLoop(500);
    if (withTriggerUpdate && typeof window.ScrollTrigger !== 'undefined') {
      window.ScrollTrigger.update();
    }
  }, { passive: true });
}

function wireDesktopScroll() {
  if (desktopInitialized) return;
  desktopInitialized = true;

  if (typeof window.ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.config({ ignoreMobileResize: true });
    window.ScrollTrigger.addEventListener('refresh', measureLayout);
    window.ScrollTrigger.addEventListener('refreshInit', () => {
      if (scrollEngine.lenis) scrollEngine.lenis.resize();
    });
    initHorizontal();
  }

  if (typeof window.Lenis !== 'undefined' && !prefersReduced && finePointerQuery.matches) {
    scrollEngine.lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      syncTouch: false,
      smoothTouch: false
    });
    scrollEngine.lenis.on('scroll', (e) => {
      state.scroll = e.scroll;
      state.velocity = e.velocity;
      wakeLoop(500);
      if (typeof window.ScrollTrigger !== 'undefined') window.ScrollTrigger.update();
    });
    gsap.ticker.add((time) => scrollEngine.lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(500, 33);
    window.__lenis = scrollEngine.lenis;
    if (document.documentElement.classList.contains('lang-pending')) {
      scrollEngine.lenis.stop();
    }
  } else {
    attachPassiveScroll(true);
  }

  requestAnimationFrame(() => {
    measureLayout();
    if (typeof window.ScrollTrigger !== 'undefined') window.ScrollTrigger.refresh();
  });
}

async function setupDesktopScroll() {
  if (desktopInitialized || mobileQuery.matches) return;
  const tasks = [];
  if (typeof window.ScrollTrigger === 'undefined') {
    tasks.push(loadScriptOnce('assets/vendor/ScrollTrigger.min.js').catch(() => {}));
  }
  if (!prefersReduced && finePointerQuery.matches && typeof window.Lenis === 'undefined') {
    tasks.push(loadScriptOnce('assets/vendor/lenis.min.js').catch(() => {}));
  }
  if (tasks.length) await Promise.all(tasks);
  wireDesktopScroll();
}

/**
 * Scroll engine.
 * Desktop viewports (>900px) load ScrollTrigger & Lenis smoothly.
 * Mobile viewports keep native composited touch scrolling with zero ScrollTrigger/Lenis overhead.
 */
export function initScroll() {
  if (mobileQuery.matches) {
    attachPassiveScroll(false);
    requestAnimationFrame(() => measureLayout());
    mobileQuery.addEventListener('change', (e) => {
      if (!e.matches) setupDesktopScroll();
    });
  } else {
    setupDesktopScroll();
  }

  window.addEventListener('arqam:gate-closed', () => {
    window.scrollTo(0, 0);
    state.scroll = 0;
    state.velocity = 0;
    if (scrollEngine.lenis) {
      scrollEngine.lenis.scrollTo(0, { immediate: true });
      scrollEngine.lenis.start();
    }
    requestAnimationFrame(() => {
      measureLayout();
      if (!mobileQuery.matches && typeof window.ScrollTrigger !== 'undefined') {
        window.ScrollTrigger.refresh();
      }
    });
  });
}

export function initHorizontal() {
  const mm = gsap.matchMedia();
  // Desktop horizontal showcase; mobile flows vertically so every screenshot stays full & scrollable
  mm.add('(min-width: 901px)', () => {
    const distance = () => Math.max(1, refs.track.scrollWidth - window.innerWidth + 1);
    const tween = gsap.to(refs.track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: refs.workPin,
        start: 'top top',
        end: () => '+=' + Math.max(window.innerHeight * 0.9, distance()),
        pin: true,
        scrub: 0.75,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
      gsap.set(refs.track, { x: 0 });
    };
  });
}

export function measureLayout() {
  layout.act2 = $('#work').offsetTop;
  layout.act3 = Math.round($('#architecture').getBoundingClientRect().top + window.scrollY);
  layout.act4 = Math.round($('#contact').getBoundingClientRect().top + window.scrollY);
  const inq = $('#inquiry');
  if (inq) layout.act5 = Math.round(inq.getBoundingClientRect().top + window.scrollY);
  layout.max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  state.scrollMax = layout.max;
}

export function computeActMix() {
  const y = state.scroll;
  const vh = window.innerHeight;
  const m1 = smoothstep(layout.act2 - vh * 0.92, layout.act2 - vh * 0.18, y);
  const m2 = smoothstep(layout.act3 - vh * 0.9, layout.act3 - vh * 0.16, y);
  const m3 = smoothstep(layout.act4 - vh * 0.9, layout.act4 - vh * 0.16, y);
  const m4 = layout.act5 ? smoothstep(layout.act5 - vh * 0.9, layout.act5 - vh * 0.16, y) : 0;
  state.m1 = m1;
  state.m2 = m2;
  state.m3 = m3;
  state.m4 = m4;
  return clamp(m1 + m2 + m3 + m4, 0, 4);
}

export function scrollToTarget(target) {
  if (!target) return;
  if (scrollEngine.lenis) {
    scrollEngine.lenis.scrollTo(target, { offset: 0, duration: 1.2 });
  } else {
    const y = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
  }
}
