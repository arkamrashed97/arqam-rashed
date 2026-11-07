import { finePointerQuery } from './env.js';
import { refs, state } from './state.js';
import { clamp, damp } from './utils.js';
import { cursorLabel } from '../i18n/i18n.js';

/**
 * Custom per-act morphing SVG cursor + universal mouse & touch physics tracker.
 *
 * Act 0 (Core):      All-Green Orbital Arrow + 4-point star sparkle (matches reference image)
 * Act 1 (Work):      Amber-Gold Origami Glider Arrow + aerodynamic wind ring
 * Act 2 (System):    Quantum Cyan Crystal Prism Arrow + hexagonal telemetry orbit
 * Act 3 (Signal):    Violet-Aqua Water-Silk Droplet Arrow + liquid ripple rings
 * Act 4 (Inquiry):   Emerald & Gold Fishing Rod Tip + swaying line, bobber & hook
 */

const ACT_CURSOR_COLORS = [
  '#D4FF00', // Act I: Acid Lime Green
  '#FF9500', // Act II: Kinetic Amber Gold
  '#00F0FF', // Act III: Quantum Cyan
  '#C084FC', // Act IV: Water-Silk Violet-Aqua
  '#10B981'  // Act V: Emerald Fishing Lagoon
];

export const cursorState = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  ringX: window.innerWidth / 2,
  ringY: window.innerHeight / 2,
  dotX: window.innerWidth / 2,
  dotY: window.innerHeight / 2,
  vx: 0,
  vy: 0,
  hookSwing: 0,
  hookSwingVel: 0,
  act: 0,
  visible: false,
  primed: false,
  externalLoop: false,
  hookGroup: null,
  linePath: null
};

function buildCursorSvg() {
  return `
  <svg class="cursor__svg" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <filter id="cur-glow-0" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="3.5" flood-color="#80FF00" flood-opacity="0.85"/>
      </filter>
      <filter id="cur-glow-1" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="3.5" flood-color="#FF8800" flood-opacity="0.85"/>
      </filter>
      <filter id="cur-glow-2" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="3.5" flood-color="#00F0FF" flood-opacity="0.85"/>
      </filter>
      <filter id="cur-glow-3" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="3.5" flood-color="#C084FC" flood-opacity="0.85"/>
      </filter>
      <filter id="cur-glow-4" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="3.2" flood-color="#10B981" flood-opacity="0.85"/>
      </filter>

      <linearGradient id="cur-fill-0" x1="20" y1="12" x2="64" y2="74" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#EEFF66"/>
        <stop offset="48%" stop-color="#9EFF00"/>
        <stop offset="100%" stop-color="#38B000"/>
      </linearGradient>
      <linearGradient id="cur-ring-0" x1="8" y1="58" x2="86" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#D4FF00"/>
        <stop offset="50%" stop-color="#F6FF99"/>
        <stop offset="100%" stop-color="#6BFF00"/>
      </linearGradient>

      <linearGradient id="cur-fill-1" x1="20" y1="12" x2="66" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FFE875"/>
        <stop offset="50%" stop-color="#FF8800"/>
        <stop offset="100%" stop-color="#C83E00"/>
      </linearGradient>

      <linearGradient id="cur-fill-2" x1="20" y1="12" x2="66" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#CFFAFE"/>
        <stop offset="50%" stop-color="#00F0FF"/>
        <stop offset="100%" stop-color="#0369A1"/>
      </linearGradient>

      <linearGradient id="cur-fill-3" x1="20" y1="12" x2="66" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#F5D0FE"/>
        <stop offset="52%" stop-color="#C084FC"/>
        <stop offset="100%" stop-color="#38BDF8"/>
      </linearGradient>
    </defs>

    <!-- ACT I: All-Green Orbital Pointer + 4-Point Star (Matches Uploaded Image) -->
    <g class="cursor__variant cursor__variant--0" filter="url(#cur-glow-0)">
      <!-- Back half of orbital swoosh ring -->
      <path class="cursor__orbit" d="M15 58 C 4 49, 24 32, 54 27 C 79 23, 91 31, 74 43" stroke="#52CC00" stroke-width="4.5" stroke-linecap="round" opacity="0.65"/>
      <!-- Main rounded arrow body (All Green with dark outer contour & neon inner rim) -->
      <path d="M23 13 L29 66 L41 53 L52 74 L63 68 L52 47 L69 43 Z" fill="url(#cur-fill-0)" stroke="#071A00" stroke-width="5.5" stroke-linejoin="round"/>
      <path d="M23 13 L29 66 L41 53 L52 74 L63 68 L52 47 L69 43 Z" fill="none" stroke="#F4FF9E" stroke-width="2.2" stroke-linejoin="round"/>
      <!-- Front glowing orbital swoosh crossing over the arrow -->
      <path class="cursor__orbit" d="M13 54 C 7 63, 35 55, 62 42 C 83 32, 88 24, 68 25" stroke="url(#cur-ring-0)" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M15 55 C 12 61, 36 53, 62 41 C 80 33, 84 26, 70 26" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity="0.85"/>
      <!-- 4-point green star sparkle -->
      <g class="cursor__sparkle">
        <path d="M59 11 L61.8 20.2 L71 23 L61.8 25.8 L59 35 L56.2 25.8 L47 23 L56.2 20.2 Z" fill="#B8FF00" stroke="#071A00" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="59" cy="23" r="2.6" fill="#FFFFFF"/>
      </g>
    </g>

    <!-- ACT II: Amber-Gold Origami Paper Glider Pointer -->
    <g class="cursor__variant cursor__variant--1" filter="url(#cur-glow-1)">
      <path class="cursor__orbit" d="M14 56 C 10 64, 38 54, 66 39 C 84 29, 86 21, 66 23" stroke="#FFB800" stroke-width="3.6" stroke-dasharray="6 4" stroke-linecap="round"/>
      <path d="M22 13 L30 67 L42 50 L62 63 L48 44 L71 38 Z" fill="url(#cur-fill-1)" stroke="#1F0A00" stroke-width="5" stroke-linejoin="round"/>
      <path d="M22 13 L42 50 L48 44 Z" fill="#FFF0A8" opacity="0.72"/>
      <path d="M22 13 L30 67 L42 50 L62 63 L48 44 L71 38 Z" fill="none" stroke="#FFE885" stroke-width="2" stroke-linejoin="round"/>
      <g class="cursor__sparkle">
        <path d="M60 12 L62.5 19.5 L70 22 L62.5 24.5 L60 32 L57.5 24.5 L50 22 L57.5 19.5 Z" fill="#FFD000" stroke="#1F0A00" stroke-width="1.6"/>
      </g>
    </g>

    <!-- ACT III: Quantum Cyan Crystal Prism Pointer -->
    <g class="cursor__variant cursor__variant--2" filter="url(#cur-glow-2)">
      <ellipse class="cursor__orbit" cx="44" cy="43" rx="34" ry="13" transform="rotate(-24 44 43)" stroke="#00F0FF" stroke-width="2.6" stroke-dasharray="10 5"/>
      <path d="M23 13 L27 65 L41 53 L53 73 L63 67 L51 47 L69 42 Z" fill="url(#cur-fill-2)" stroke="#021824" stroke-width="5" stroke-linejoin="round"/>
      <path d="M23 13 L41 53 L69 42 Z" fill="#E0F2FE" opacity="0.45"/>
      <path d="M23 13 L27 65 L41 53 L53 73 L63 67 L51 47 L69 42 Z" fill="none" stroke="#A5F3FC" stroke-width="2" stroke-linejoin="round"/>
      <g class="cursor__sparkle">
        <path d="M60 12 L62.5 19.5 L70 22 L62.5 24.5 L60 32 L57.5 24.5 L50 22 L57.5 19.5 Z" fill="#00F0FF" stroke="#021824" stroke-width="1.6"/>
        <circle cx="60" cy="22" r="2.4" fill="#FFFFFF"/>
      </g>
    </g>

    <!-- ACT IV: Violet-Aqua Water-Silk Droplet Pointer -->
    <g class="cursor__variant cursor__variant--3" filter="url(#cur-glow-3)">
      <ellipse class="cursor__orbit" cx="45" cy="45" rx="34" ry="14" transform="rotate(-22 45 45)" stroke="#38BDF8" stroke-width="3" opacity="0.85"/>
      <ellipse cx="45" cy="45" rx="24" ry="9" transform="rotate(-22 45 45)" stroke="#F0ABFC" stroke-width="1.6" opacity="0.7"/>
      <path d="M23 13 C 25 34, 27 52, 29 65 L 41 53 L 52 73 L 62 67 L 51 47 L 68 42 C 52 33, 36 23, 23 13 Z" fill="url(#cur-fill-3)" stroke="#17072B" stroke-width="5" stroke-linejoin="round"/>
      <path d="M23 13 C 25 34, 27 52, 29 65 L 41 53 L 52 73 L 62 67 L 51 47 L 68 42 Z" fill="none" stroke="#F5D0FE" stroke-width="2" stroke-linejoin="round"/>
      <g class="cursor__sparkle">
        <path d="M60 12 L62.5 19.5 L70 22 L62.5 24.5 L60 32 L57.5 24.5 L50 22 L57.5 19.5 Z" fill="#E879F9" stroke="#17072B" stroke-width="1.6"/>
      </g>
    </g>

    <!-- ACT V: Emerald & Gold Fishing Rod + Swaying Hook & Bobber -->
    <g class="cursor__variant cursor__variant--4" filter="url(#cur-glow-4)">
      <!-- Curved carbon-gold fishing rod blank -->
      <path d="M78 74 Q 54 42 23 14" stroke="#041E16" stroke-width="7.5" stroke-linecap="round"/>
      <path d="M78 74 Q 54 42 23 14" stroke="#10B981" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M78 74 Q 65 57 56 46" stroke="#F59E0B" stroke-width="5.2" stroke-linecap="round"/>
      <!-- Golden rod line guides -->
      <circle cx="46" cy="34" r="2.6" fill="#FBBF24" stroke="#041E16" stroke-width="1.2"/>
      <circle cx="34" cy="23" r="2.2" fill="#FBBF24" stroke="#041E16" stroke-width="1.2"/>
      <circle cx="23" cy="14" r="2.8" fill="#FDE68A" stroke="#041E16" stroke-width="1.4"/>
      <!-- Dynamic swaying fishing line, bobber & silver J-hook -->
      <g id="cursor-hook-rig">
        <path id="cursor-fishing-line" d="M23 14 Q 18 38 23 58" stroke="#A7F3D0" stroke-width="1.6" stroke-dasharray="3 2" fill="none"/>
        <!-- Bobber float -->
        <ellipse cx="23" cy="44" rx="4.5" ry="6" fill="#EF4444" stroke="#041E16" stroke-width="1.5"/>
        <path d="M18.8 44 A 4.5 5.5 0 0 0 27.2 44 Z" fill="#FFFFFF"/>
        <line x1="23" y1="36" x2="23" y2="39" stroke="#FBBF24" stroke-width="2" stroke-linecap="round"/>
        <!-- Gleaming silver J-Hook -->
        <path d="M23 56 L23 68 C 23 74, 15 74, 15 68 C 15 65, 17 64, 18.5 65.5" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    </g>
  </svg>`;
}

function spawnTouchBurst(x, y, actIndex) {
  if (document.body.classList.contains('is-booting')) return;
  const color = ACT_CURSOR_COLORS[actIndex] || '#D4FF00';
  const ring = document.createElement('div');
  ring.className = 'touch-ripple';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ring.style.setProperty('--ripple-color', color);
  document.body.appendChild(ring);
  window.setTimeout(() => ring.remove(), 680);
}

function syncActAttr() {
  if (!refs.cursor) return;
  const act = clamp(Math.round(state.actMix || 0), 0, 4);
  if (act !== cursorState.act || !refs.cursor.hasAttribute('data-cursor-act')) {
    cursorState.act = act;
    refs.cursor.setAttribute('data-cursor-act', String(act));
    refs.cursor.style.setProperty('--cursor-accent', ACT_CURSOR_COLORS[act]);
  }
}

function applyTransform() {
  if (!refs.cursor || !refs.cursorDot) return;
  refs.cursor.style.transform =
    'translate3d(' + cursorState.ringX.toFixed(2) + 'px,' + cursorState.ringY.toFixed(2) + 'px,0)';
  refs.cursorDot.style.transform =
    'translate3d(' + cursorState.dotX.toFixed(2) + 'px,' + cursorState.dotY.toFixed(2) + 'px,0)';
}

function stepCursor(dt) {
  syncActAttr();
  if (!refs.cursor || !cursorState.visible) return;
  const prevX = cursorState.ringX;
  cursorState.ringX = damp(cursorState.ringX, cursorState.x, 22, dt);
  cursorState.ringY = damp(cursorState.ringY, cursorState.y, 22, dt);
  cursorState.dotX = damp(cursorState.dotX, cursorState.x, 36, dt);
  cursorState.dotY = damp(cursorState.dotY, cursorState.y, 36, dt);

  // Pendulum physics for the Act V fishing hook rig
  const dx = cursorState.ringX - prevX;
  cursorState.hookSwingVel += (-dx * 0.85 - cursorState.hookSwing * 18) * dt;
  cursorState.hookSwingVel *= Math.pow(0.08, dt);
  cursorState.hookSwing = clamp(cursorState.hookSwing + cursorState.hookSwingVel * dt * 12, -32, 32);
  if (cursorState.hookGroup && cursorState.act === 4) {
    cursorState.hookGroup.setAttribute('transform', `rotate(${cursorState.hookSwing.toFixed(1)} 23 14)`);
  }

  applyTransform();
}

function updatePointerCoords(clientX, clientY) {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  state.pointerX = clientX;
  state.pointerY = clientY;
  state.pointerNX = (clientX / w) * 2 - 1;
  state.pointerNY = -((clientY / h) * 2 - 1);
  state.pointerMoved = true;
  cursorState.x = clientX;
  cursorState.y = clientY;
  if (!cursorState.primed) {
    cursorState.primed = true;
    cursorState.ringX = clientX;
    cursorState.ringY = clientY;
    cursorState.dotX = clientX;
    cursorState.dotY = clientY;
    applyTransform();
  }
}

export function initCursor() {
  // Inject the 5-act morphing SVG cursor inside #cursor while preserving #cursor-label
  if (refs.cursor && !refs.cursor.querySelector('.cursor__svg')) {
    refs.cursor.insertAdjacentHTML('afterbegin', buildCursorSvg());
    refs.cursor.setAttribute('data-cursor-act', '0');
    refs.cursor.style.setProperty('--cursor-accent', ACT_CURSOR_COLORS[0]);
    cursorState.hookGroup = refs.cursor.querySelector('#cursor-hook-rig');
    cursorState.linePath = refs.cursor.querySelector('#cursor-fishing-line');
  }

  if (finePointerQuery.matches) {
    document.body.classList.add('has-cursor');
    cursorState.visible = true;
    applyTransform();
  }

  let lastT = performance.now();
  function preLoop(now) {
    if (cursorState.externalLoop) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
    lastT = now;
    stepCursor(dt);
    requestAnimationFrame(preLoop);
  }
  requestAnimationFrame(preLoop);

  // Universal pointer tracking (works on desktop mouse, hybrid touch laptops, and mobile phones)
  window.addEventListener('pointermove', (e) => {
    updatePointerCoords(e.clientX, e.clientY);

    if (e.pointerType === 'mouse' || e.pointerType === 'pen' || finePointerQuery.matches) {
      if (!cursorState.visible) {
        cursorState.visible = true;
        document.body.classList.add('has-cursor');
      }
    }

    if (!(e.target instanceof Element)) return;
    const mag = e.target.closest('[data-magnetic]');
    if (mag && (e.pointerType === 'mouse' || finePointerQuery.matches)) {
      const r = mag.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(mag, { x: dx * 0.09, y: dy * 0.14, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    }
  }, { passive: true });

  // Ensure mobile touch gestures also drive 3D WebGL & SVG scene physics smoothly
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      const t = e.touches[0];
      updatePointerCoords(t.clientX, t.clientY);
      state.burst = Math.min(1.2, state.burst + 0.55);
      spawnTouchBurst(t.clientX, t.clientY, cursorState.act);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      const t = e.touches[0];
      updatePointerCoords(t.clientX, t.clientY);
    }
  }, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    updatePointerCoords(e.clientX, e.clientY);
    document.body.classList.add('cursor-down');
    state.burst = Math.min(1.2, state.burst + 0.45);
    if (e.pointerType !== 'touch') {
      spawnTouchBurst(e.clientX, e.clientY, cursorState.act);
    }
  }, { passive: true });

  window.addEventListener('pointerup', () => {
    document.body.classList.remove('cursor-down');
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
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
    document.body.classList.remove('cursor-hover', 'cursor-down', 'has-cursor');
    cursorState.visible = false;
  });
}

export function updateCursor(dt) {
  cursorState.externalLoop = true;
  stepCursor(dt);
}
