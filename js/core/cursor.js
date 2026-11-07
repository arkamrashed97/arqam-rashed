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
  '#D4FF00', // Act I: Stealth Carbon + Acid Lime Laser Edge
  '#F59E0B', // Act II: Brushed Tungsten + Molten Bronze-Gold
  '#00E5FF', // Act III: Gunmetal Chrome + Cyber Ice-Cyan
  '#38BDF8', // Act IV: Deep Titanium + Electric Cobalt-Steel
  '#10B981'  // Act V: Carbon-Steel + Anodized Emerald
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
  <svg class="cursor__svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <filter id="cur-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#000000" flood-opacity="0.85"/>
      </filter>
      <linearGradient id="blade-carbon" x1="6" y1="6" x2="34" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#1E242B"/>
        <stop offset="55%" stop-color="#0B0E12"/>
        <stop offset="100%" stop-color="#050608"/>
      </linearGradient>
      <linearGradient id="blade-tungsten" x1="6" y1="6" x2="34" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#292524"/>
        <stop offset="60%" stop-color="#0F0E0D"/>
        <stop offset="100%" stop-color="#070606"/>
      </linearGradient>
    </defs>

    <!-- ACT I: Stealth Carbon Monolith Blade + Acid-Lime Laser Bevel -->
    <g class="cursor__variant cursor__variant--0" filter="url(#cur-shadow)">
      <!-- Micro target crosshair at exact tip (6,6) -->
      <path d="M2 6 H4.5 M7.5 6 H10 M6 2 V4.5 M6 7.5 V10" stroke="#D4FF00" stroke-width="1" opacity="0.8"/>
      <!-- Angular stealth arrowhead -->
      <path d="M6 6 L13 36 L19.5 26.5 L26.5 39 L30.5 36.5 L23.5 24 L35 21 Z" fill="url(#blade-carbon)" stroke="#D4FF00" stroke-width="1.35" stroke-linejoin="miter" stroke-miterlimit="6"/>
      <!-- Inner metallic spine facet -->
      <path d="M7.8 8.2 L32 20.5 L21.5 22.8 Z" fill="#D4FF00" fill-opacity="0.18"/>
      <line x1="6" y1="6" x2="21.5" y2="25" stroke="#D4FF00" stroke-width="0.9" opacity="0.65"/>
      <!-- Sharp technical telemetry bracket -->
      <path class="cursor__orbit" d="M31 9 L36 9 L36 14" stroke="#D4FF00" stroke-width="1.2"/>
    </g>

    <!-- ACT II: Supersonic Tungsten Delta-Dart + Molten Bronze-Gold Bevel -->
    <g class="cursor__variant cursor__variant--1" filter="url(#cur-shadow)">
      <path d="M2 6 H4.5 M6 2 V4.5" stroke="#F59E0B" stroke-width="1.1"/>
      <!-- Supersonic swept delta wing blade -->
      <path d="M6 6 L12 37 L18.5 25.5 L23 30 L27 23 L37 19.5 Z" fill="url(#blade-tungsten)" stroke="#F59E0B" stroke-width="1.35" stroke-linejoin="miter" stroke-miterlimit="6"/>
      <!-- Starboard metallic bevel -->
      <path d="M6 6 L37 19.5 L21 21.5 Z" fill="#F59E0B" fill-opacity="0.22"/>
      <line x1="6" y1="6" x2="18.5" y2="25.5" stroke="#FDE68A" stroke-width="0.9" opacity="0.7"/>
      <!-- Angular Mach-cone ticks -->
      <path class="cursor__orbit" d="M29 8 L35 10.5 M31 12.5 L35 14" stroke="#F59E0B" stroke-width="1.2"/>
    </g>

    <!-- ACT III: Gunmetal Split-Caliper Vector + Cyber Ice-Cyan Reticle -->
    <g class="cursor__variant cursor__variant--2" filter="url(#cur-shadow)">
      <!-- Rotating micro-hex lock-on reticle around tip -->
      <polygon class="cursor__reticle" points="6,1.5 9.9,3.7 9.9,8.3 6,10.5 2.1,8.3 2.1,3.7" stroke="#00E5FF" stroke-width="0.9" fill="none" opacity="0.75"/>
      <!-- Split-blade cybernetic pointer -->
      <path d="M6 6 L12.5 36 L18 27 L15 16 L24.5 19.5 L35 20 Z" fill="url(#blade-carbon)" stroke="#00E5FF" stroke-width="1.35" stroke-linejoin="miter" stroke-miterlimit="6"/>
      <path d="M20.5 23 L26.5 37 L30.5 35 L24.5 21 Z" fill="#0B131A" stroke="#00E5FF" stroke-width="1.2" stroke-linejoin="miter"/>
      <circle cx="6" cy="6" r="1.3" fill="#FFFFFF"/>
    </g>

    <!-- ACT IV: Deep Titanium Spearhead + Electric Steel-Blue Rangefinder -->
    <g class="cursor__variant cursor__variant--3" filter="url(#cur-shadow)">
      <!-- Sharp architectural spearhead -->
      <path d="M6 6 L13.5 36.5 L20 26 L27 36.5 L30.5 34 L23.5 23.5 L35.5 19.5 Z" fill="url(#blade-carbon)" stroke="#38BDF8" stroke-width="1.35" stroke-linejoin="miter" stroke-miterlimit="6"/>
      <path d="M6 6 L35.5 19.5 L21.5 22.5 Z" fill="#38BDF8" fill-opacity="0.22"/>
      <line x1="6" y1="6" x2="20" y2="26" stroke="#E0F2FE" stroke-width="0.9" opacity="0.75"/>
      <!-- Precision rangefinder corner arc -->
      <path class="cursor__orbit" d="M26 7 A 14 14 0 0 1 37 16" stroke="#38BDF8" stroke-width="1.2" stroke-dasharray="3 2"/>
    </g>

    <!-- ACT V: Tactical Carbon Rod Tip + Metallic Grapple Hook -->
    <g class="cursor__variant cursor__variant--4" filter="url(#cur-shadow)">
      <!-- Carbon-steel angled rod tip -->
      <path d="M38 34 L16 14 L6 6" stroke="#091310" stroke-width="4" stroke-linecap="square"/>
      <path d="M38 34 L16 14 L6 6" stroke="#10B981" stroke-width="1.8" stroke-linecap="square"/>
      <path d="M38 34 L27 24" stroke="#94A3B8" stroke-width="2.6" stroke-linecap="square"/>
      <!-- Precision line guide rings -->
      <rect x="15" y="13" width="3" height="3" transform="rotate(42 16.5 14.5)" fill="#091310" stroke="#10B981" stroke-width="1"/>
      <circle cx="6" cy="6" r="2" fill="#091310" stroke="#10B981" stroke-width="1.2"/>
      <!-- Swaying tactical line & angular metallic grapple hook -->
      <g id="cursor-hook-rig">
        <path id="cursor-fishing-line" d="M6 6 L6 26" stroke="#10B981" stroke-width="1.1" stroke-dasharray="2 1.5"/>
        <polygon points="6,16 8.5,19.5 6,23 3.5,19.5" fill="#091310" stroke="#10B981" stroke-width="1.1"/>
        <path d="M6 23 L6 33 L1.5 33 L1.5 28.5 L3.8 30.2" stroke="#E2E8F0" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" fill="none"/>
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
    cursorState.hookGroup.setAttribute('transform', `rotate(${cursorState.hookSwing.toFixed(1)} 6 6)`);
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
