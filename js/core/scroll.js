import { finePointerQuery, prefersReduced } from './env.js';
import { layout, refs, state } from './state.js';
import { $, clamp, smoothstep } from './utils.js';

/** Holder so other modules can reach the Lenis instance (null on touch devices / reduced motion). */
export const scrollEngine = { lenis: null };

/**
 * Scroll engine.
 * Desktop pointers get Lenis smooth wheel scrolling. Touch devices keep native scrolling:
 * it is what the browser can composite off the main thread, so it stays fluid even while WebGL renders.
 */
export function initScroll() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (typeof Lenis !== 'undefined' && !prefersReduced && finePointerQuery.matches) {
    scrollEngine.lenis = new Lenis({
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
      ScrollTrigger.update();
    });
    gsap.ticker.add((time) => scrollEngine.lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(500, 33);
    window.__lenis = scrollEngine.lenis;
    if (document.documentElement.classList.contains('lang-pending')) {
      scrollEngine.lenis.stop();
    }
  } else {
    let lastY = window.scrollY;
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
      ScrollTrigger.update();
    }, { passive: true });
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
      ScrollTrigger.refresh();
    });
  });

  initHorizontal();
  ScrollTrigger.addEventListener('refresh', measureLayout);
  ScrollTrigger.addEventListener('refreshInit', () => {
    if (scrollEngine.lenis) scrollEngine.lenis.resize();
  });
  requestAnimationFrame(() => {
    measureLayout();
    ScrollTrigger.refresh();
  });
}

export function initHorizontal() {
  const mm = gsap.matchMedia();
  // Desktop
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

  // Mobile & Tablet
  mm.add('(max-width: 900px)', () => {
    const distance = () => Math.max(1, refs.track.scrollWidth - window.innerWidth + 1);
    const tween = gsap.to(refs.track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: refs.workPin,
        start: 'top top',
        end: () => '+=' + Math.max(window.innerHeight * 1.15, distance() * 1.1),
        pin: true,
        pinSpacing: true,
        scrub: 0.5,
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

  initMobileWorkTouch();
}

function initMobileWorkTouch() {
  const track = document.getElementById('work-track');
  if (!track) return;
  let startX = 0;
  let startY = 0;
  let isMoving = false;

  track.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 900) return;
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isMoving = true;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!isMoving || window.innerWidth > 900) return;
    if (e.touches.length !== 1) return;
    const curX = e.touches[0].clientX;
    const curY = e.touches[0].clientY;
    const dx = startX - curX;
    const dy = startY - curY;

    if (Math.abs(dx) > Math.abs(dy) * 1.15 && Math.abs(dx) > 6) {
      window.scrollBy({ top: dx * 1.15, behavior: 'auto' });
      startX = curX;
      startY = curY;
    }
  }, { passive: true });

  const end = () => { isMoving = false; };
  track.addEventListener('touchend', end, { passive: true });
  track.addEventListener('touchcancel', end, { passive: true });
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
