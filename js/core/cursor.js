import { finePointerQuery } from './env.js';
import { refs, state } from './state.js';
import { damp } from './utils.js';
import { cursorLabel } from '../i18n/i18n.js';

/**
 * Custom cursor ring + dot, magnetic elements, and context labels.
 *
 * Runs from the very start of page load (including on the #lang-gate onboarding overlay).
 * Uses a self-driving rAF loop until the main ticker takes over so the cursor is never stuck
 * while WebGL/fonts are still initializing.
 */
export const cursorState = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  ringX: window.innerWidth / 2,
  ringY: window.innerHeight / 2,
  dotX: window.innerWidth / 2,
  dotY: window.innerHeight / 2,
  visible: false,
  primed: false,
  externalLoop: false
};

function applyTransform() {
  if (!refs.cursor || !refs.cursorDot) return;
  refs.cursor.style.transform =
    'translate3d(' + cursorState.ringX.toFixed(2) + 'px,' + cursorState.ringY.toFixed(2) + 'px,0)';
  refs.cursorDot.style.transform =
    'translate3d(' + cursorState.dotX.toFixed(2) + 'px,' + cursorState.dotY.toFixed(2) + 'px,0)';
}

function stepCursor(dt) {
  if (!refs.cursor || !finePointerQuery.matches) return;
  cursorState.ringX = damp(cursorState.ringX, cursorState.x, 16, dt);
  cursorState.ringY = damp(cursorState.ringY, cursorState.y, 16, dt);
  cursorState.dotX = damp(cursorState.dotX, cursorState.x, 34, dt);
  cursorState.dotY = damp(cursorState.dotY, cursorState.y, 34, dt);
  applyTransform();
}

export function initCursor() {
  if (!finePointerQuery.matches) return;

  // Prime initial position and visibility so desktop users on #lang-gate see the cursor immediately
  document.body.classList.add('has-cursor');
  cursorState.visible = true;
  applyTransform();

  let lastT = performance.now();
  function preLoop(now) {
    if (cursorState.externalLoop) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
    lastT = now;
    stepCursor(dt);
    requestAnimationFrame(preLoop);
  }
  requestAnimationFrame(preLoop);

  window.addEventListener('pointermove', (e) => {
    state.pointerX = e.clientX;
    state.pointerY = e.clientY;
    state.pointerNX = (e.clientX / window.innerWidth) * 2 - 1;
    state.pointerNY = -((e.clientY / window.innerHeight) * 2 - 1);
    state.pointerMoved = true;
    cursorState.x = e.clientX;
    cursorState.y = e.clientY;
    if (!cursorState.primed) {
      cursorState.primed = true;
      cursorState.ringX = e.clientX;
      cursorState.ringY = e.clientY;
      cursorState.dotX = e.clientX;
      cursorState.dotY = e.clientY;
      applyTransform();
    }
    if (!cursorState.visible) {
      cursorState.visible = true;
      document.body.classList.add('has-cursor');
    }
    if (!(e.target instanceof Element)) return;
    const mag = e.target.closest('[data-magnetic]');
    if (mag) {
      const r = mag.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(mag, { x: dx * 0.09, y: dy * 0.14, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    }
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    if (!(e.target instanceof Element)) return;
    const target = e.target.closest('a, button, select, [data-cursor], [data-lang-choice]');
    if (!target) return;
    if (e.relatedTarget instanceof Node && target.contains(e.relatedTarget)) return;
    const href = target.getAttribute('href') || '';
    const fallback = target.hasAttribute('data-download')
      ? 'DOWNLOAD'
      : target.tagName === 'A'
        ? (href.charAt(0) === '#' ? 'JUMP' : 'OPEN')
        : 'SELECT';
    refs.cursorLabel.textContent = target.dataset.cursor || cursorLabel(fallback);
    document.body.classList.add('cursor-hover');
  });

  document.addEventListener('pointerout', (e) => {
    if (!(e.target instanceof Element)) return;
    const target = e.target.closest('a, button, select, [data-cursor], [data-lang-choice]');
    if (!target) return;
    if (e.relatedTarget instanceof Node && target.contains(e.relatedTarget)) return;
    document.body.classList.remove('cursor-hover');
    const mag = e.target.closest('[data-magnetic]');
    if (mag) gsap.to(mag, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
  });

  document.addEventListener('mouseleave', () => {
    document.body.classList.remove('cursor-hover', 'has-cursor');
    cursorState.visible = false;
  });
}

export function updateCursor(dt) {
  cursorState.externalLoop = true;
  stepCursor(dt);
}
