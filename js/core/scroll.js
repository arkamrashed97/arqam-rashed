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
  } else {
    let lastY = window.scrollY;
    let lastT = performance.now();
    window.addEventListener('scroll', () => {
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
