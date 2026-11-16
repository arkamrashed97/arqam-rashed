import { prefersReduced } from './env.js';
import { measureLayout } from './scroll.js';
import { refs, state } from './state.js';
import { clamp } from './utils.js';

/* Preloader */
export const bootValue = { v: 0 };
export let bootFinished = false;
export let bootFinishScheduled = false;
export let bootTimerId = 0;
export let bootStartedAt = performance.now();

export function paintBoot(v) {
  if (!refs.boot || refs.boot.hidden) return;
  const n = clamp(Math.round(v), 0, 100);
  if (refs.bootPct) refs.bootPct.textContent = String(n).padStart(3, '0');
  if (refs.bootBar) refs.bootBar.style.transform = 'scaleX(' + (n / 100) + ')';
  refs.bootLines.forEach((line, i) => {
    line.style.transition = 'opacity .25s ease';
    line.style.opacity = n >= 18 + i * 16 ? '1' : '.25';
  });
}

export function startBoot() {
  bootStartedAt = performance.now();
  if (!refs.boot || refs.boot.hidden) return;
  paintBoot(0);
  gsap.to(bootValue, {
    v: 88,
    duration: prefersReduced ? 0.4 : 1.2,
    ease: 'power2.out',
    onUpdate: () => paintBoot(bootValue.v)
  });
}

export function finishBoot(forceImmediate = false) {
  if (bootFinished) return;
  if (bootFinishScheduled && !forceImmediate) return;
  if (bootTimerId) {
    window.clearTimeout(bootTimerId);
    bootTimerId = 0;
    bootFinishScheduled = false;
  }
  const minimum = 0;
  const wait = Math.max(0, minimum - (performance.now() - bootStartedAt));
  if (wait > 30) {
    bootFinishScheduled = true;
    bootTimerId = window.setTimeout(() => {
      bootFinishScheduled = false;
      bootTimerId = 0;
      finishBoot();
    }, wait);
    return;
  }
  bootFinished = true;
  state.booted = true;
  window.__ARQAM_READY = true;
  if (window.__ARQAM_FALLBACK_TIMER) clearTimeout(window.__ARQAM_FALLBACK_TIMER);

  if (state.gl) refs.body.classList.add('gl-ready');

  const done = () => {
    state.ready = true;
    refs.body.classList.remove('is-booting');
    if (refs.boot) {
      refs.boot.hidden = true;
      refs.boot.setAttribute('aria-hidden', 'true');
      refs.boot.style.display = 'none';
    }
    runIntro();
    measureLayout();
    if (typeof window.ScrollTrigger !== 'undefined') window.ScrollTrigger.refresh();
  };

  window.__ARQAM_FINISH_BOOT = finishBoot;
  window.__ARQAM_RUN_INTRO = runIntro;

  if (!state.motion || forceImmediate || !refs.boot || refs.boot.hidden) {
    paintBoot(100);
    if (refs.boot) {
      refs.boot.hidden = true;
      refs.boot.setAttribute('aria-hidden', 'true');
      refs.boot.style.display = 'none';
    }
    done();
    return;
  }

  paintBoot(100);
  gsap.timeline()
    .to(bootValue, { v: 100, duration: 0.14, ease: 'power2.out', onUpdate: () => paintBoot(bootValue.v) })
    .to(refs.boot, { autoAlpha: 0, duration: 0.2, ease: 'power2.inOut' })
    .set(refs.boot, { display: 'none' })
    .add(done);
}

/* Intro typography */
export function splitName(el) {
  if (!el) return [];
  // In Arabic cursive script, do not split into individual char spans as it breaks letter shaping and connections
  if (document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl' || /[\u0600-\u06FF]/.test(el.textContent)) {
    return [el];
  }
  const text = el.textContent.trim();
  el.textContent = '';
  const chars = [];
  Array.from(text).forEach((ch) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    el.appendChild(span);
    chars.push(span);
  });
  return chars;
}

export const nameChars = [];
export function prepareIntro() {
  refs.skewTargets.forEach((el) => el.classList.add('skew'));
}

export function runIntro() {
  // Hero renders immediately in its final layout at 0ms for instant LCP & Speed Index
}
