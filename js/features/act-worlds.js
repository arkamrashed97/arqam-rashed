import { state } from '../core/state.js';
import { clamp, lerp } from '../core/utils.js';
import { haptic } from '../core/env.js';
import { sound } from '../audio/index.js';
import { CONFIG } from '../config.js';

/**
 * Interactive SVG worlds for Acts I–V:
 *  - Act I (Core):         Animated SVG spaceships, thruster trails, twinkling stars & pointer constellation beams
 *  - Act II (Work):        Origami paper airplanes gliding on wind ribbons & spinning kinetic pinwheels
 *  - Act III (System):     Autonomous quantum hex-drones, orbital satellites & rotating circuit sigils
 *  - Act IV (Signal):      Floating origami lotus boats & expanding liquid silk water ripples
 *  - Act V (Inquiry):      Playable Fishing Rod & Swimming Fish Mini-Game (6 fish species, combos, bait, SFX)
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

const FISH_SPECIES = [
  {
    id: 'tilapia',
    nameEn: 'NILE TILAPIA',
    nameAr: 'بلطي نيلي فضي',
    pts: 10,
    speed: 58,
    scale: 0.92,
    body: '#2DD4BF',
    belly: '#99F6E4',
    fin: '#0D9488',
    stripe: '#115E59'
  },
  {
    id: 'clown',
    nameEn: 'CORAL CLOWNFISH',
    nameAr: 'سمكة المهرج المرجانية',
    pts: 20,
    speed: 72,
    scale: 0.88,
    body: '#FB923C',
    belly: '#FFFFFF',
    fin: '#EA580C',
    stripe: '#FFFFFF'
  },
  {
    id: 'tang',
    nameEn: 'ROYAL BLUE TANG',
    nameAr: 'تانج ملكي أزرق',
    pts: 35,
    speed: 84,
    scale: 0.98,
    body: '#38BDF8',
    belly: '#0284C7',
    fin: '#FACC15',
    stripe: '#0369A1'
  },
  {
    id: 'koi',
    nameEn: 'IMPERIAL GOLDEN KOI',
    nameAr: 'كوي ذهبي إمبراطوري',
    pts: 50,
    speed: 92,
    scale: 1.12,
    body: '#FBBF24',
    belly: '#FEF08A',
    fin: '#EF4444',
    stripe: '#DC2626'
  },
  {
    id: 'angler',
    nameEn: 'NEON ABYSS ANGLER',
    nameAr: 'سمكة الأعماق المضيئة',
    pts: 80,
    speed: 105,
    scale: 1.06,
    body: '#C084FC',
    belly: '#E879F9',
    fin: '#00F0FF',
    stripe: '#7E22CE',
    lantern: true
  },
  {
    id: 'pharaoh',
    nameEn: 'LUXOR PHARAOH GOLD',
    nameAr: 'سمكة الفرعون الذهبية',
    pts: 150,
    speed: 124,
    scale: 1.24,
    body: '#FDE047',
    belly: '#FFFBEB',
    fin: '#F59E0B',
    stripe: '#D97706',
    crown: true
  }
];

const worlds = {
  initialized: false,
  act1: null,
  act2: null,
  act3: null,
  act4: null,
  act5: null
};

function createSvg(className) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', `act-world ${className}`);
  svg.setAttribute('viewBox', '0 0 1440 900');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  return svg;
}

/* ============================================================================
 * ACT I: Spaceships & Stars SVG Animation
 * ========================================================================== */
function buildAct1World() {
  const sec = document.getElementById('act-1');
  if (!sec) return null;
  const svg = createSvg('act-world--1');

  let starsMarkup = '';
  const stars = [];
  for (let i = 0; i < 24; i++) {
    const x = 60 + ((i * 197) % 1320);
    const y = 70 + ((i * 131) % 760);
    const r = 4 + (i % 4) * 2.2;
    const color = i % 3 === 0 ? '#D4FF00' : i % 3 === 1 ? '#E8FF80' : '#A3E635';
    stars.push({ x, y, r, phase: i * 0.7 });
    starsMarkup += `
      <g class="act1-star" data-idx="${i}" transform="translate(${x} ${y})">
        <path d="M0 ${-r * 2.1} L${r * 0.48} ${-r * 0.48} L${r * 2.1} 0 L${r * 0.48} ${r * 0.48} L0 ${r * 2.1} L${-r * 0.48} ${r * 0.48} L${-r * 2.1} 0 L${-r * 0.48} ${-r * 0.48} Z" fill="${color}" opacity="0.72"/>
        <circle cx="0" cy="0" r="${r * 0.45}" fill="#FFFFFF"/>
      </g>`;
  }

  const ships = [
    { x: 240, y: 210, vx: 68, vy: 18, angle: 12, scale: 1.0, type: 'cruiser' },
    { x: 1180, y: 280, vx: -76, vy: 22, angle: 165, scale: 0.9, type: 'saucer' },
    { x: 320, y: 690, vx: 84, vy: -24, angle: -15, scale: 0.85, type: 'interceptor' },
    { x: 1090, y: 640, vx: -64, vy: -19, angle: -162, scale: 0.95, type: 'cruiser' }
  ];

  const shipShapes = {
    cruiser: `
      <path class="thruster" d="M-24 0 L-46 -6 L-38 0 L-46 6 Z" fill="#D4FF00" opacity="0.9"/>
      <path d="M26 0 L-16 -14 L-10 -4 L-22 -4 L-22 4 L-10 4 L-16 14 Z" fill="#11160B" stroke="#D4FF00" stroke-width="1.8" stroke-linejoin="round"/>
      <ellipse cx="4" cy="0" rx="7" ry="3.2" fill="#E8FF80"/>
    `,
    saucer: `
      <ellipse cx="-24" cy="0" rx="12" ry="3.5" fill="#D4FF00" opacity="0.75"/>
      <ellipse cx="0" cy="2" rx="22" ry="7.5" fill="#11160B" stroke="#D4FF00" stroke-width="1.8"/>
      <path d="M-11 0 C -8 -10, 8 -10, 11 0 Z" fill="#B8FF00" opacity="0.85"/>
      <circle cx="-12" cy="2" r="1.8" fill="#FFFFFF"/><circle cx="0" cy="3" r="1.8" fill="#FFFFFF"/><circle cx="12" cy="2" r="1.8" fill="#FFFFFF"/>
    `,
    interceptor: `
      <path class="thruster" d="M-20 -4 L-40 -7 L-32 -4 Z M-20 4 L-40 7 L-32 4 Z" fill="#B8FF00"/>
      <path d="M28 0 L-18 -16 L-12 0 L-18 16 Z" fill="#0D1308" stroke="#E2FF4D" stroke-width="1.7" stroke-linejoin="round"/>
      <path d="M12 0 L-8 -5 L-5 0 L-8 5 Z" fill="#D4FF00"/>
    `
  };

  let shipsMarkup = '';
  ships.forEach((s, idx) => {
    shipsMarkup += `<g class="act1-ship" data-ship="${idx}" transform="translate(${s.x} ${s.y}) rotate(${s.angle}) scale(${s.scale})">${shipShapes[s.type]}</g>`;
  });

  svg.innerHTML = `
    <g id="act1-constellation" stroke="#D4FF00" stroke-width="1" stroke-dasharray="4 4" opacity="0.45"></g>
    <g id="act1-stars">${starsMarkup}</g>
    <g id="act1-ships">${shipsMarkup}</g>
  `;
  sec.insertBefore(svg, sec.firstChild);

  return {
    sec,
    svg,
    stars,
    starEls: Array.from(svg.querySelectorAll('.act1-star')),
    ships,
    shipEls: Array.from(svg.querySelectorAll('.act1-ship')),
    constellationEl: svg.querySelector('#act1-constellation')
  };
}

function updateAct1World(w, dt, t) {
  if (!w) return;
  const rect = w.sec.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;

  const px = ((state.pointerX - rect.left) / Math.max(1, rect.width)) * 1440;
  const py = ((state.pointerY - rect.top) / Math.max(1, rect.height)) * 900;

  let lines = '';
  w.stars.forEach((st, i) => {
    const dx = px - st.x;
    const dy = py - st.y;
    const dist = Math.hypot(dx, dy);
    const pulse = 0.72 + Math.sin(t * 2.8 + st.phase) * 0.28 + (dist < 220 ? (1 - dist / 220) * 0.75 : 0);
    const rot = Math.sin(t * 0.9 + st.phase) * 18;
    w.starEls[i].setAttribute('transform', `translate(${st.x} ${st.y}) scale(${pulse.toFixed(2)}) rotate(${rot.toFixed(1)})`);
    if (dist < 210 && state.pointerMoved) {
      lines += `<line x1="${st.x}" y1="${st.y}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" opacity="${(1 - dist / 210).toFixed(2)}"/>`;
    }
  });
  w.constellationEl.innerHTML = lines;

  w.ships.forEach((s, i) => {
    const dx = px - s.x;
    const dy = py - s.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 240 && dist > 8 && state.pointerMoved) {
      // Gentle orbital bank around pointer
      s.vx += (-dy / dist) * 95 * dt + (dx / dist) * 28 * dt;
      s.vy += (dx / dist) * 95 * dt + (dy / dist) * 28 * dt;
    }
    const spd = Math.hypot(s.vx, s.vy);
    if (spd > 145) {
      s.vx = (s.vx / spd) * 145;
      s.vy = (s.vy / spd) * 145;
    } else if (spd < 55) {
      s.vx = (s.vx / Math.max(1, spd)) * 65;
      s.vy = (s.vy / Math.max(1, spd)) * 65;
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.x > 1500) s.x = -60;
    if (s.x < -60) s.x = 1500;
    if (s.y > 940) s.y = -40;
    if (s.y < -40) s.y = 940;
    s.angle = Math.atan2(s.vy, s.vx) * (180 / Math.PI);
    const thrustScale = s.scale * (1 + Math.sin(t * 16 + i) * 0.04);
    w.shipEls[i].setAttribute(
      'transform',
      `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.angle.toFixed(1)}) scale(${thrustScale.toFixed(2)})`
    );
  });
}

/* ============================================================================
 * ACT II: Origami Paper Airplanes & Kinetic Gadgetry SVG Animation
 * ========================================================================== */
function buildAct2World() {
  const sec = document.getElementById('work');
  if (!sec) return null;
  const svg = createSvg('act-world--2');

  const planes = [
    { x: 180, y: 170, vx: 82, vy: 12, phase: 0, scale: 1.05, color: '#FF9500' },
    { x: 640, y: 130, vx: 74, vy: -14, phase: 1.4, scale: 0.88, color: '#FFD000' },
    { x: 1120, y: 210, vx: -78, vy: 16, phase: 2.6, scale: 0.96, color: '#FF6B00' },
    { x: 310, y: 760, vx: 88, vy: -18, phase: 3.8, scale: 0.92, color: '#FFB800' },
    { x: 980, y: 740, vx: -84, vy: -12, phase: 5.0, scale: 1.0, color: '#FFA726' }
  ];

  let planesMarkup = '';
  planes.forEach((p, idx) => {
    planesMarkup += `
      <g class="act2-plane" data-plane="${idx}">
        <path d="M-54 2 Q -26 10 -12 0" stroke="${p.color}" stroke-width="1.5" stroke-dasharray="4 4" fill="none" opacity="0.65"/>
        <path d="M28 0 L-18 -15 L-8 -2 L-20 0 L-8 2 L-18 15 Z" fill="${p.color}" fill-opacity="0.22" stroke="${p.color}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M28 0 L-8 -2 L-14 7 Z" fill="${p.color}" fill-opacity="0.48"/>
      </g>`;
  });

  const pinwheels = [
    { x: 120, y: 440, r: 26 },
    { x: 1320, y: 420, r: 30 },
    { x: 740, y: 820, r: 22 }
  ];
  let wheelsMarkup = '';
  pinwheels.forEach((pw) => {
    wheelsMarkup += `
      <g class="act2-wheel" data-x="${pw.x}" data-y="${pw.y}" transform="translate(${pw.x} ${pw.y})">
        <circle cx="0" cy="0" r="${pw.r}" stroke="#FF9500" stroke-width="1" stroke-dasharray="3 5" fill="none" opacity="0.45"/>
        <path d="M0 0 L0 ${-pw.r} L${pw.r * 0.45} ${-pw.r * 0.45} Z M0 0 L${pw.r} 0 L${pw.r * 0.45} ${pw.r * 0.45} Z M0 0 L0 ${pw.r} L${-pw.r * 0.45} ${pw.r * 0.45} Z M0 0 L${-pw.r} 0 L${-pw.r * 0.45} ${-pw.r * 0.45} Z" fill="#FFB800" fill-opacity="0.28" stroke="#FF9500" stroke-width="1.2"/>
        <circle cx="0" cy="0" r="3" fill="#FFD000"/>
      </g>`;
  });

  svg.innerHTML = `<g>${wheelsMarkup}</g><g>${planesMarkup}</g>`;
  sec.insertBefore(svg, sec.firstChild);

  return {
    sec,
    svg,
    planes,
    planeEls: Array.from(svg.querySelectorAll('.act2-plane')),
    wheelEls: Array.from(svg.querySelectorAll('.act2-wheel'))
  };
}

function updateAct2World(w, dt, t) {
  if (!w) return;
  const rect = w.sec.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;

  const px = ((state.pointerX - rect.left) / Math.max(1, rect.width)) * 1440;
  const py = ((state.pointerY - rect.top) / Math.max(1, rect.height)) * 900;

  w.planes.forEach((p, i) => {
    const waveY = Math.sin(t * 1.9 + p.phase) * 28;
    const dx = px - p.x;
    const dy = py - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 220 && state.pointerMoved) {
      // Wind draft boost when pointer sweeps near paper airplane
      p.vx += (p.vx >= 0 ? 1 : -1) * 65 * dt;
      p.vy += ((p.y - py) / Math.max(20, dist)) * 55 * dt;
    }
    p.vx = clamp(p.vx, -135, 135);
    p.vy = clamp(p.vy, -48, 48);
    p.x += p.vx * dt;
    p.y += (p.vy + waveY * 0.45) * dt;
    if (p.x > 1500) p.x = -60;
    if (p.x < -60) p.x = 1500;
    if (p.y > 880) p.y = 60;
    if (p.y < 60) p.y = 880;
    const angle = Math.atan2(p.vy + waveY * 0.45, p.vx) * (180 / Math.PI);
    w.planeEls[i].setAttribute(
      'transform',
      `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${p.scale})`
    );
  });

  const spin = (t * 48 + state.scroll * 0.18) % 360;
  w.wheelEls.forEach((el, idx) => {
    const x = el.getAttribute('data-x');
    const y = el.getAttribute('data-y');
    const dir = idx % 2 === 0 ? 1 : -1;
    el.setAttribute('transform', `translate(${x} ${y}) rotate(${(spin * dir).toFixed(1)})`);
  });
}

/* ============================================================================
 * ACT III: Quantum Hex-Drones & Circuit Sigils SVG Animation
 * ========================================================================== */
function buildAct3World() {
  const sec = document.getElementById('architecture');
  if (!sec) return null;
  const svg = createSvg('act-world--3');

  const drones = [
    { x: 220, y: 220, r: 65, speed: 0.7, phase: 0 },
    { x: 1220, y: 250, r: 75, speed: -0.6, phase: 1.8 },
    { x: 260, y: 710, r: 60, speed: 0.8, phase: 3.1 },
    { x: 1180, y: 690, r: 70, speed: -0.65, phase: 4.5 }
  ];

  let dronesMarkup = '';
  drones.forEach((_, idx) => {
    dronesMarkup += `
      <g class="act3-drone" data-drone="${idx}">
        <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="rgba(0,240,255,0.08)" stroke="#00F0FF" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="11" stroke="#67E8F9" stroke-width="1" stroke-dasharray="3 3" fill="none"/>
        <circle cx="0" cy="0" r="3.5" fill="#00F0FF"/>
        <line x1="0" y1="0" x2="28" y2="0" stroke="#00F0FF" stroke-width="1.4"/>
      </g>`;
  });

  svg.innerHTML = `
    <g id="act3-beams" stroke="#00F0FF" stroke-width="1" stroke-dasharray="5 5" opacity="0.38"></g>
    <g>${dronesMarkup}</g>
  `;
  sec.insertBefore(svg, sec.firstChild);

  return {
    sec,
    svg,
    drones,
    droneEls: Array.from(svg.querySelectorAll('.act3-drone')),
    beamsEl: svg.querySelector('#act3-beams')
  };
}

function updateAct3World(w, dt, t) {
  if (!w) return;
  const rect = w.sec.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;

  const px = ((state.pointerX - rect.left) / Math.max(1, rect.width)) * 1440;
  const py = ((state.pointerY - rect.top) / Math.max(1, rect.height)) * 900;

  let beams = '';
  w.drones.forEach((d, i) => {
    const cx = d.x + Math.cos(t * d.speed + d.phase) * d.r;
    const cy = d.y + Math.sin(t * d.speed * 1.3 + d.phase) * (d.r * 0.65);
    const angle = Math.atan2(py - cy, px - cx) * (180 / Math.PI);
    w.droneEls[i].setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angle.toFixed(1)})`);
    const dist = Math.hypot(px - cx, py - cy);
    if (dist < 380 && state.pointerMoved) {
      beams += `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}"/>`;
    }
  });
  w.beamsEl.innerHTML = beams;
}

/* ============================================================================
 * ACT IV: Water-Silk Lotus Boats & Liquid Ripples SVG Animation
 * ========================================================================== */
function buildAct4World() {
  const sec = document.getElementById('contact');
  if (!sec) return null;
  const svg = createSvg('act-world--4');

  const boats = [
    { baseX: 240, baseY: 230, phase: 0.4, scale: 1.0 },
    { baseX: 1180, baseY: 280, phase: 1.9, scale: 0.92 },
    { baseX: 300, baseY: 720, phase: 3.3, scale: 0.88 },
    { baseX: 1120, baseY: 680, phase: 4.8, scale: 1.05 }
  ];

  let boatsMarkup = '';
  boats.forEach((_, idx) => {
    boatsMarkup += `
      <g class="act4-boat" data-boat="${idx}">
        <ellipse cx="0" cy="9" rx="28" ry="6" stroke="#38BDF8" stroke-width="1.2" fill="none" opacity="0.45"/>
        <path d="M-24 4 L24 4 L15 12 L-15 12 Z" fill="rgba(192,132,252,0.28)" stroke="#E879F9" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M0 4 L0 -14 L13 2 Z" fill="rgba(56,189,248,0.32)" stroke="#38BDF8" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M0 4 L0 -10 L-10 2 Z" fill="rgba(240,171,252,0.35)" stroke="#F0ABFC" stroke-width="1.2" stroke-linejoin="round"/>
      </g>`;
  });

  svg.innerHTML = `
    <g id="act4-ripples"></g>
    <g>${boatsMarkup}</g>
  `;
  sec.insertBefore(svg, sec.firstChild);

  return {
    sec,
    svg,
    boats,
    boatEls: Array.from(svg.querySelectorAll('.act4-boat')),
    ripplesEl: svg.querySelector('#act4-ripples'),
    ripples: [],
    lastRippleT: 0
  };
}

function updateAct4World(w, dt, t) {
  if (!w) return;
  const rect = w.sec.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;

  const px = ((state.pointerX - rect.left) / Math.max(1, rect.width)) * 1440;
  const py = ((state.pointerY - rect.top) / Math.max(1, rect.height)) * 900;

  if (state.pointerMoved && t - w.lastRippleT > 0.22 && py > 0 && py < 900) {
    w.lastRippleT = t;
    w.ripples.push({ x: px, y: py, age: 0 });
    if (w.ripples.length > 7) w.ripples.shift();
  }

  let rippleSvg = '';
  for (let i = w.ripples.length - 1; i >= 0; i--) {
    const rp = w.ripples[i];
    rp.age += dt;
    if (rp.age > 1.6) {
      w.ripples.splice(i, 1);
      continue;
    }
    const p = rp.age / 1.6;
    const rx = 12 + p * 86;
    const ry = rx * 0.48;
    const op = (1 - p) * 0.55;
    rippleSvg += `<ellipse cx="${rp.x.toFixed(1)}" cy="${rp.y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" stroke="#38BDF8" stroke-width="1.5" fill="none" opacity="${op.toFixed(2)}"/>`;
  }
  w.ripplesEl.innerHTML = rippleSvg;

  w.boats.forEach((b, i) => {
    const x = b.baseX + Math.sin(t * 0.75 + b.phase) * 28;
    const y = b.baseY + Math.cos(t * 1.4 + b.phase) * 11;
    const tilt = Math.sin(t * 1.8 + b.phase) * 6;
    w.boatEls[i].setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${tilt.toFixed(1)}) scale(${b.scale})`);
  });
}

/* ============================================================================
 * ACT V: Interactive Fishing Rod & Swimming Fish Mini-Game
 * ========================================================================== */
function buildFishSvgMarkup(sp) {
  const crown = sp.crown
    ? `<path d="M-4 -14 L0 -22 L5 -15 L10 -22 L12 -13 Z" fill="#FDE047" stroke="#78350F" stroke-width="1"/>`
    : '';
  const lantern = sp.lantern
    ? `<path d="M16 -8 Q 28 -22 32 -10" stroke="#00F0FF" stroke-width="1.5" fill="none"/><circle cx="32" cy="-10" r="3.5" fill="#00F0FF"/>`
    : '';
  return `
    <g class="fish-inner">
      <!-- Articulated wagging tail -->
      <path class="fish-tail" d="M-22 0 L-38 -13 L-33 0 L-38 13 Z" fill="${sp.fin}" stroke="#042F2E" stroke-width="1.4" stroke-linejoin="round"/>
      <!-- Dorsal & ventral fins -->
      <path d="M-8 -11 Q 0 -21 10 -10 Z" fill="${sp.fin}"/>
      <path d="M-6 10 Q 2 18 8 9 Z" fill="${sp.fin}"/>
      <!-- Main fish body -->
      <ellipse cx="0" cy="0" rx="24" ry="12.5" fill="${sp.body}" stroke="#042F2E" stroke-width="1.6"/>
      <path d="M-16 4 Q 0 13 18 3 Q 4 11 -16 4 Z" fill="${sp.belly}" opacity="0.75"/>
      <!-- Decorative stripes -->
      <path d="M-6 -11 Q -2 0 -6 11 M4 -11 Q 8 0 4 11" stroke="${sp.stripe}" stroke-width="2.6" stroke-linecap="round" fill="none" opacity="0.75"/>
      <!-- Eye & mouth -->
      <circle cx="14" cy="-3.5" r="3.2" fill="#FFFFFF"/>
      <circle cx="15" cy="-3.5" r="1.6" fill="#020617"/>
      <path d="M21 2 Q 17 4 15 1.5" stroke="#042F2E" stroke-width="1.3" stroke-linecap="round" fill="none"/>
      ${crown}
      ${lantern}
    </g>`;
}

function buildAct5FishingWorld() {
  const sec = document.getElementById('inquiry');
  if (!sec) return null;

  // Read persisted high score & player name
  let bestScore = 0;
  let savedPlayerName = '';
  try {
    bestScore = parseInt(localStorage.getItem('arqam-fish-best') || '0', 10) || 0;
    savedPlayerName = localStorage.getItem('arqam-fish-player') || '';
  } catch (err) {
    bestScore = 0;
  }

  // 1. Insert the Bilingual Fishing Scoreboard HUD bar + Supabase Leaderboard above the inquiry container
  const hud = document.createElement('div');
  hud.className = 'fishing-hud';
  hud.id = 'fishing-hud';
  hud.innerHTML = `
    <div class="fishing-hud__row">
      <div class="fishing-hud__stats">
        <div class="fishing-stat">
          <span id="fish-lbl-score">LAGOON SCORE</span>
          <b id="fish-score">0</b>
        </div>
        <div class="fishing-stat">
          <span id="fish-lbl-caught">CAUGHT</span>
          <b id="fish-caught">0</b>
        </div>
        <div class="fishing-stat fishing-stat--combo">
          <span id="fish-lbl-combo">COMBO</span>
          <b id="fish-combo">x1</b>
        </div>
        <div class="fishing-stat">
          <span id="fish-lbl-best">BEST</span>
          <b id="fish-best">${bestScore}</b>
        </div>
      </div>
      <div class="fishing-hud__actions">
        <span class="fishing-catch-pill" id="fish-status-pill">MOVE ROD NEAR FISH OR CLICK WATER TO CAST 🎣</span>
        <button type="button" class="fishing-bait-btn" id="fish-bait-btn" data-cursor="BAIT" data-sfx="none">DROP BAIT 🪱</button>
      </div>
    </div>
    <div class="fishing-save-row">
      <input type="text" class="fishing-name-input" id="fish-name-input" maxlength="22" placeholder="Your name to save score..." aria-label="Player name">
      <button type="button" class="fishing-save-btn" id="fish-save-btn" data-cursor="SAVE" data-sfx="none">SAVE SCORE 🏆</button>
    </div>
    <div class="fishing-board" id="fishing-board">
      <span class="fishing-board__title" id="fish-board-title">🏆 TOP ANGLERS:</span>
      <ul class="fishing-board__list" id="fish-board-list">
        <li class="fishing-board__item">LOADING...</li>
      </ul>
    </div>
  `;

  const inquiryContainer = sec.querySelector('.inquiry-container');
  if (inquiryContainer) {
    sec.insertBefore(hud, inquiryContainer);
  } else {
    sec.appendChild(hud);
  }

  // 2. Create the Interactive Lagoon SVG Stage
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'fishing-pond');
  svg.setAttribute('id', 'fishing-pond');
  svg.setAttribute('viewBox', '0 0 1440 900');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');

  // Spawn 11 swimming fish across the 6 species
  const fishes = [];
  let fishesMarkup = '';
  for (let i = 0; i < 11; i++) {
    const sp = FISH_SPECIES[i % FISH_SPECIES.length];
    const dir = i % 2 === 0 ? 1 : -1;
    const x = 110 + ((i * 137) % 1220);
    const y = 95 + ((i * 79) % 720);
    fishes.push({
      idx: i,
      sp,
      x,
      y,
      vx: dir * sp.speed * (0.85 + (i % 3) * 0.12),
      vy: (i % 2 === 0 ? 1 : -1) * 14,
      dir,
      phase: i * 0.9,
      state: 'swim', // 'swim' | 'bite' | 'caught'
      biteTimer: 0,
      catchProgress: 0
    });
    fishesMarkup += `<g class="pond-fish" data-fish="${i}" transform="translate(${x} ${y}) scale(${dir * sp.scale} ${sp.scale})">${buildFishSvgMarkup(sp)}</g>`;
  }

  svg.innerHTML = `
    <defs>
      <radialGradient id="lagoon-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#10B981" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="#10B981" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <!-- Ambient underwater swaying kelp & bubbles -->
    <g id="pond-ripples"></g>
    <g id="pond-bubbles"></g>
    <g id="pond-fishes">${fishesMarkup}</g>
    <!-- Live fishing rod, line, bobber & silver hook inside the lagoon (visible on mobile & desktop) -->
    <g id="pond-rig">
      <circle id="pond-lure-aura" cx="1180" cy="360" r="56" fill="url(#lagoon-glow)"/>
      <g id="pond-rod" transform="translate(1180 160)">
        <path d="M95 -85 Q 48 -42 0 0" stroke="#041E16" stroke-width="9" stroke-linecap="round" fill="none"/>
        <path d="M95 -85 Q 48 -42 0 0" stroke="#10B981" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M95 -85 Q 72 -64 54 -48" stroke="#F59E0B" stroke-width="6.5" stroke-linecap="round" fill="none"/>
        <circle cx="38" cy="-33" r="3" fill="#FBBF24" stroke="#041E16" stroke-width="1.2"/>
        <circle cx="18" cy="-16" r="2.6" fill="#FBBF24" stroke="#041E16" stroke-width="1.2"/>
        <circle cx="0" cy="0" r="3.4" fill="#FDE68A" stroke="#041E16" stroke-width="1.4"/>
      </g>
      <path id="pond-line" d="M1180 160 Q 1160 260 1180 360" stroke="#A7F3D0" stroke-width="1.8" stroke-dasharray="5 3" fill="none" opacity="0.82"/>
      <g id="pond-bobber" transform="translate(1180 325)">
        <ellipse cx="0" cy="0" rx="6.5" ry="8.5" fill="#EF4444" stroke="#042F2E" stroke-width="1.8"/>
        <path d="M-6.2 0 A 6.5 8 0 0 0 6.2 0 Z" fill="#FFFFFF"/>
        <line x1="0" y1="-12" x2="0" y2="-7" stroke="#FBBF24" stroke-width="2.2" stroke-linecap="round"/>
      </g>
      <g id="pond-hook" transform="translate(1180 360)">
        <path d="M0 -32 L0 0 C 0 11, -12 11, -12 2 C -12 -3, -8 -4, -6 -1" stroke="#F8FAFC" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <circle cx="0" cy="-32" r="2.5" fill="#FBBF24"/>
      </g>
      <text id="pond-bite-alert" x="1180" y="305" text-anchor="middle" fill="#FDE047" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="700" opacity="0">! BITE / غمزت !</text>
    </g>
  `;
  sec.insertBefore(svg, sec.firstChild);

  const w = {
    sec,
    svg,
    hud,
    fishes,
    fishEls: Array.from(svg.querySelectorAll('.pond-fish')),
    tailEls: Array.from(svg.querySelectorAll('.fish-tail')),
    ripplesEl: svg.querySelector('#pond-ripples'),
    bubblesEl: svg.querySelector('#pond-bubbles'),
    rodEl: svg.querySelector('#pond-rod'),
    lineEl: svg.querySelector('#pond-line'),
    bobberEl: svg.querySelector('#pond-bobber'),
    hookEl: svg.querySelector('#pond-hook'),
    auraEl: svg.querySelector('#pond-lure-aura'),
    biteAlertEl: svg.querySelector('#pond-bite-alert'),
    scoreEl: document.getElementById('fish-score'),
    caughtEl: document.getElementById('fish-caught'),
    comboEl: document.getElementById('fish-combo'),
    bestEl: document.getElementById('fish-best'),
    statusPill: document.getElementById('fish-status-pill'),
    rodX: 1180,
    rodY: 160,
    hookX: 1180,
    hookY: 360,
    score: 0,
    caught: 0,
    combo: 1,
    best: bestScore,
    lastCatchTime: 0,
    baitBoostTimer: 0,
    ripples: [],
    bubbles: []
  };

  function syncHudLanguage() {
    const ar = document.documentElement.lang === 'ar';
    const lblScore = document.getElementById('fish-lbl-score');
    const lblCaught = document.getElementById('fish-lbl-caught');
    const lblCombo = document.getElementById('fish-lbl-combo');
    const lblBest = document.getElementById('fish-lbl-best');
    const baitBtn = document.getElementById('fish-bait-btn');
    const nameInput = document.getElementById('fish-name-input');
    const saveBtn = document.getElementById('fish-save-btn');
    const boardTitle = document.getElementById('fish-board-title');
    if (lblScore) lblScore.textContent = ar ? 'نقاط الصيد' : 'LAGOON SCORE';
    if (lblCaught) lblCaught.textContent = ar ? 'السمك المصطاد' : 'CAUGHT';
    if (lblCombo) lblCombo.textContent = ar ? 'المضاعف' : 'COMBO';
    if (lblBest) lblBest.textContent = ar ? 'أعلى سكور' : 'BEST';
    if (baitBtn) baitBtn.textContent = ar ? 'رمي طُعم للسمك 🪱' : 'DROP BAIT 🪱';
    if (nameInput) nameInput.placeholder = ar ? 'اكتب اسمك فقط لحفظ السكور...' : 'Your name to save score...';
    if (saveBtn) saveBtn.textContent = ar ? 'حفظ السكور 🏆' : 'SAVE SCORE 🏆';
    if (boardTitle) boardTitle.textContent = ar ? '🏆 لوحة المتصدرين:' : '🏆 TOP ANGLERS:';
    if (w.statusPill && w.caught === 0) {
      w.statusPill.textContent = ar
        ? 'حرّك الصنارة قرب السمك أو اضغط في الماء للصيد 🎣'
        : 'MOVE ROD NEAR FISH OR CLICK WATER TO CAST 🎣';
    }
  }
  syncHudLanguage();
  window.addEventListener('arqam:lang', syncHudLanguage);

  const nameInputEl = document.getElementById('fish-name-input');
  const saveBtnEl = document.getElementById('fish-save-btn');
  const boardListEl = document.getElementById('fish-board-list');
  if (nameInputEl && savedPlayerName) {
    nameInputEl.value = savedPlayerName;
  }

  function renderLeaderboard(scores) {
    if (!boardListEl) return;
    if (!Array.isArray(scores) || !scores.length) {
      boardListEl.innerHTML = '<li class="fishing-board__item">BE THE FIRST TO RECORD A SCORE!</li>';
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    boardListEl.innerHTML = scores.slice(0, 6).map((item, idx) => {
      const prefix = medals[idx] || `#${idx + 1}`;
      const safeName = String(item.name || 'ANGLER').replace(/[<>"'&]/g, '');
      const pts = parseInt(item.score, 10) || 0;
      return `<li class="fishing-board__item ${idx === 0 ? 'fishing-board__item--1' : ''}">${prefix} ${safeName} <b>${pts}</b></li>`;
    }).join('');
  }

  async function fetchLeaderboard() {
    try {
      const res = await fetch(CONFIG.leaderboardApiUrl, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.scores)) {
          renderLeaderboard(data.scores);
          return;
        }
      }
    } catch (err) { /* fallback to direct Supabase public storage */ }

    try {
      const res = await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/public/fishing-leaderboard/scores.json?t=${Date.now()}`);
      if (res.ok) {
        const list = await res.json();
        renderLeaderboard(list);
      }
    } catch (err) { /* ignore */ }
  }

  async function savePlayerScore() {
    if (!nameInputEl || !saveBtnEl) return;
    const ar = document.documentElement.lang === 'ar';
    const playerName = nameInputEl.value.trim();
    const scoreToSave = Math.max(w.score, w.best);

    if (!playerName) {
      sound.play('form-error');
      nameInputEl.focus();
      w.statusPill.textContent = ar ? 'اكتب اسمك أولاً لحفظ السكور! ✍️' : 'ENTER YOUR NAME FIRST TO SAVE SCORE! ✍️';
      return;
    }
    if (scoreToSave <= 0) {
      sound.play('form-error');
      w.statusPill.textContent = ar ? 'اصطد سمكة واحدة على الأقل قبل حفظ السكور! 🐟' : 'CATCH AT LEAST 1 FISH BEFORE SAVING! 🐟';
      return;
    }

    try { localStorage.setItem('arqam-fish-player', playerName); } catch (err) { /* ignore */ }
    saveBtnEl.disabled = true;
    saveBtnEl.textContent = ar ? 'جارٍ الحفظ...' : 'SAVING...';

    try {
      const res = await fetch(CONFIG.leaderboardApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName,
          score: scoreToSave,
          caught: Math.max(1, w.caught)
        })
      });
      const data = await res.json();
      if (res.ok && data && Array.isArray(data.scores)) {
        renderLeaderboard(data.scores);
        sound.play('form-success');
        w.statusPill.textContent = ar
          ? `تم تسجيل سكورك (${scoreToSave}) باسم "${playerName}" في لوحة الشرف! 🏆`
          : `SCORE (${scoreToSave}) SAVED FOR "${playerName}" ON LEADERBOARD! 🏆`;
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      sound.play('form-error');
      w.statusPill.textContent = ar ? 'تعذر الاتصال، حاول مرة أخرى' : 'COULD NOT REACH SERVER, TRY AGAIN';
    } finally {
      saveBtnEl.disabled = false;
      saveBtnEl.textContent = ar ? 'حفظ السكور 🏆' : 'SAVE SCORE 🏆';
    }
  }

  if (saveBtnEl) {
    saveBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      haptic(14);
      savePlayerScore();
    });
  }
  if (nameInputEl) {
    nameInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        savePlayerScore();
      }
    });
  }

  fetchLeaderboard();

  function spawnPopup(screenX, screenY, text, color) {
    const pop = document.createElement('div');
    pop.className = 'fish-popup';
    pop.style.left = `${screenX}px`;
    pop.style.top = `${screenY}px`;
    pop.style.setProperty('--fish-color', color);
    pop.textContent = text;
    document.body.appendChild(pop);
    window.setTimeout(() => pop.remove(), 1250);
  }

  function catchFish(f, clientX, clientY) {
    f.state = 'caught';
    f.catchProgress = 0;
    const now = performance.now();
    if (now - w.lastCatchTime < 6500) {
      w.combo = Math.min(5, w.combo + 1);
    } else {
      w.combo = 1;
    }
    w.lastCatchTime = now;

    const gained = f.sp.pts * w.combo;
    w.score += gained;
    w.caught += 1;
    if (w.score > w.best) {
      w.best = w.score;
      try { localStorage.setItem('arqam-fish-best', String(w.best)); } catch (err) { /* ignore */ }
    }

    w.scoreEl.textContent = String(w.score);
    w.caughtEl.textContent = String(w.caught);
    w.comboEl.textContent = `x${w.combo}`;
    w.bestEl.textContent = String(w.best);

    const ar = document.documentElement.lang === 'ar';
    const fishName = ar ? f.sp.nameAr : f.sp.nameEn;
    w.statusPill.textContent = ar
      ? `تم صيد ${fishName} (+${gained} نقطة)! 🐟`
      : `CAUGHT ${fishName} (+${gained} PTS)! 🐟`;

    haptic(22);
    sound.play('reel-in');
    window.setTimeout(() => sound.play('fish-catch'), 110);

    w.ripples.push({ x: f.x, y: f.y, age: 0, color: f.sp.body });
    const rect = w.sec.getBoundingClientRect();
    const sx = clientX || rect.left + (f.x / 1440) * rect.width;
    const sy = clientY || rect.top + (f.y / 900) * rect.height;
    spawnPopup(sx, sy, `+${gained} ${fishName}`, f.sp.body);
  }

  // Clicking or tapping in Act V (outside form controls) casts the hook or reels in biting fish!
  sec.addEventListener('pointerdown', (e) => {
    if (e.target instanceof Element && e.target.closest('input, select, textarea, button, a, label')) return;
    const rect = w.sec.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 1440;
    const py = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 900;
    w.rodX = px;
    w.rodY = Math.max(40, py - 95);
    w.hookX = px;
    w.hookY = py;
    w.ripples.push({ x: px, y: py, age: 0, color: '#10B981' });

    // Check if any fish is biting or directly under the cast point
    let caughtAny = false;
    for (let i = 0; i < w.fishes.length; i++) {
      const f = w.fishes[i];
      if (f.state === 'caught') continue;
      const d = Math.hypot(f.x - px, f.y - py);
      if (f.state === 'bite' || d < 78) {
        catchFish(f, e.clientX, e.clientY);
        caughtAny = true;
        break;
      }
    }
    if (!caughtAny) {
      sound.play('cast-line');
      window.setTimeout(() => sound.play('water-plop'), 140);
    }
  });

  const baitBtn = document.getElementById('fish-bait-btn');
  if (baitBtn) {
    baitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      haptic(14);
      sound.play('water-plop');
      w.baitBoostTimer = 6.0;
      for (let k = 0; k < 3; k++) {
        w.ripples.push({
          x: w.hookX + (Math.random() - 0.5) * 90,
          y: w.hookY + (Math.random() - 0.5) * 60,
          age: k * 0.12,
          color: '#FBBF24'
        });
      }
      const ar = document.documentElement.lang === 'ar';
      w.statusPill.textContent = ar
        ? 'تم رمي الطُعم! الأسماك تتجمع حول الصنارة الآن 🪱✨'
        : 'BAIT DROPPED! FISH SWARMING TOWARD YOUR HOOK 🪱✨';
    });
  }

  w.catchFish = catchFish;
  return w;
}

function updateAct5FishingWorld(w, dt, t) {
  if (!w) return;
  const rect = w.sec.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;

  if (w.baitBoostTimer > 0) w.baitBoostTimer = Math.max(0, w.baitBoostTimer - dt);

  if (state.pointerMoved && state.pointerY >= rect.top && state.pointerY <= rect.bottom) {
    const targetX = ((state.pointerX - rect.left) / Math.max(1, rect.width)) * 1440;
    const targetY = ((state.pointerY - rect.top) / Math.max(1, rect.height)) * 900;
    w.rodX = lerp(w.rodX, targetX, Math.min(1, dt * 16));
    w.rodY = lerp(w.rodY, Math.max(30, targetY - 75), Math.min(1, dt * 16));
    w.hookX = lerp(w.hookX, targetX, Math.min(1, dt * 9));
    w.hookY = lerp(w.hookY, targetY + 24, Math.min(1, dt * 9));
  }

  // Update fishing rod, line, bobber, and hook SVG transforms
  const midX = (w.rodX + w.hookX) * 0.5 + Math.sin(t * 2.5) * 14;
  const midY = (w.rodY + w.hookY) * 0.5 + 26;
  if (w.rodEl) {
    const rodTilt = clamp((w.hookX - w.rodX) * 0.12, -22, 22);
    w.rodEl.setAttribute('transform', `translate(${w.rodX.toFixed(1)} ${w.rodY.toFixed(1)}) rotate(${rodTilt.toFixed(1)})`);
  }
  w.lineEl.setAttribute('d', `M${w.rodX.toFixed(1)} ${w.rodY.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${w.hookX.toFixed(1)} ${w.hookY.toFixed(1)}`);

  let anyBiting = false;
  w.fishes.forEach((f, i) => {
    const tailAngle = Math.sin(t * (f.state === 'bite' ? 18 : 8.5) + f.phase) * 16;
    w.tailEls[i].setAttribute('transform', `rotate(${tailAngle.toFixed(1)} -22 0)`);

    if (f.state === 'caught') {
      f.catchProgress += dt * 2.2;
      f.x = lerp(f.x, w.rodX, Math.min(1, dt * 12));
      f.y = lerp(f.y, w.rodY, Math.min(1, dt * 12));
      const shrink = Math.max(0.05, 1 - f.catchProgress);
      w.fishEls[i].setAttribute(
        'transform',
        `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(-65) scale(${(f.sp.scale * shrink).toFixed(2)})`
      );
      if (f.catchProgress >= 1) {
        // Respawn a fresh fish entering from the left or right edge
        f.state = 'swim';
        f.catchProgress = 0;
        f.dir = Math.random() > 0.5 ? 1 : -1;
        f.x = f.dir > 0 ? -70 : 1510;
        f.y = 110 + Math.random() * 680;
        f.vx = f.dir * f.sp.speed;
      }
      return;
    }

    const dx = w.hookX - f.x;
    const dy = w.hookY - f.y;
    const dist = Math.hypot(dx, dy);
    const attractRadius = w.baitBoostTimer > 0 ? 480 : 210;

    if (dist < 38) {
      if (f.state !== 'bite') {
        f.state = 'bite';
        f.biteTimer = 0;
        sound.play('fish-bite');
        w.ripples.push({ x: w.hookX, y: w.hookY, age: 0, color: '#FDE047' });
      }
      anyBiting = true;
      f.biteTimer += dt;
      f.x = lerp(f.x, w.hookX - f.dir * 16, Math.min(1, dt * 14));
      f.y = lerp(f.y, w.hookY + Math.sin(t * 20) * 4, Math.min(1, dt * 14));
      // Auto-reel after 0.55s of holding the hook steadily on the biting fish!
      if (f.biteTimer > 0.55) {
        w.catchFish(f);
      }
    } else if (dist < attractRadius) {
      f.state = 'swim';
      const pull = w.baitBoostTimer > 0 ? 1.65 : 1.15;
      f.vx = lerp(f.vx, (dx / dist) * f.sp.speed * pull, dt * 3.5);
      f.vy = lerp(f.vy, (dy / dist) * f.sp.speed * pull, dt * 3.5);
      f.dir = f.vx >= 0 ? 1 : -1;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
    } else {
      f.state = 'swim';
      f.vx = lerp(f.vx, f.dir * f.sp.speed, dt * 1.5);
      f.vy = Math.sin(t * 1.6 + f.phase) * 18;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.x > 1520) { f.dir = -1; f.vx = -f.sp.speed; }
      if (f.x < -80) { f.dir = 1; f.vx = f.sp.speed; }
      f.y = clamp(f.y, 80, 830);
    }

    const tilt = clamp(f.vy * 0.22, -18, 18);
    w.fishEls[i].setAttribute(
      'transform',
      `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${tilt.toFixed(1)}) scale(${(f.dir * f.sp.scale).toFixed(2)} ${f.sp.scale.toFixed(2)})`
    );
  });

  const bobOffset = anyBiting ? Math.sin(t * 26) * 6 + 5 : Math.sin(t * 3.2) * 3;
  w.bobberEl.setAttribute('transform', `translate(${w.hookX.toFixed(1)} ${(w.hookY - 34 + bobOffset).toFixed(1)})`);
  w.hookEl.setAttribute('transform', `translate(${w.hookX.toFixed(1)} ${w.hookY.toFixed(1)})`);
  w.auraEl.setAttribute('cx', w.hookX.toFixed(1));
  w.auraEl.setAttribute('cy', w.hookY.toFixed(1));
  w.auraEl.setAttribute('r', w.baitBoostTimer > 0 ? '110' : '56');
  w.biteAlertEl.setAttribute('x', w.hookX.toFixed(1));
  w.biteAlertEl.setAttribute('y', (w.hookY - 52).toFixed(1));
  w.biteAlertEl.setAttribute('opacity', anyBiting ? '1' : '0');

  // Render water ripples
  let rippleMarkup = '';
  for (let i = w.ripples.length - 1; i >= 0; i--) {
    const r = w.ripples[i];
    r.age += dt;
    if (r.age > 1.2) {
      w.ripples.splice(i, 1);
      continue;
    }
    const p = r.age / 1.2;
    const rad = 8 + p * 68;
    const op = (1 - p) * 0.65;
    rippleMarkup += `<ellipse cx="${r.x.toFixed(1)}" cy="${r.y.toFixed(1)}" rx="${rad.toFixed(1)}" ry="${(rad * 0.55).toFixed(1)}" stroke="${r.color}" stroke-width="1.8" fill="none" opacity="${op.toFixed(2)}"/>`;
  }
  w.ripplesEl.innerHTML = rippleMarkup;
}

export function initActWorlds() {
  if (worlds.initialized) return;
  worlds.initialized = true;
  worlds.act1 = buildAct1World();
  worlds.act2 = buildAct2World();
  worlds.act3 = buildAct3World();
  worlds.act4 = buildAct4World();
  worlds.act5 = buildAct5FishingWorld();
}

export function updateActWorlds(dt) {
  if (!worlds.initialized) return;
  const t = state.time;
  updateAct1World(worlds.act1, dt, t);
  updateAct2World(worlds.act2, dt, t);
  updateAct3World(worlds.act3, dt, t);
  updateAct4World(worlds.act4, dt, t);
  updateAct5FishingWorld(worlds.act5, dt, t);
}
