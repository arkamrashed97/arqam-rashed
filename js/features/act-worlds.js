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
    nameEn: 'SILVER NILE PERCH',
    nameAr: 'قشر بياض نيلي فضي',
    pts: 15,
    speed: 64,
    scale: 0.88,
    minY: 105,
    maxY: 175,
    body: '#38BDF8',
    belly: '#E0F2FE',
    fin: '#0284C7',
    stripe: '#0369A1'
  },
  {
    id: 'barracuda',
    nameEn: 'STEALTH BARRACUDA',
    nameAr: 'باراكودا فولاذية',
    pts: 25,
    speed: 82,
    scale: 0.94,
    minY: 115,
    maxY: 205,
    body: '#94A3B8',
    belly: '#F1F5F9',
    fin: '#10B981',
    stripe: '#334155'
  },
  {
    id: 'tang',
    nameEn: 'COBALT VECTOR FIN',
    nameAr: 'سمكة الكوبالت المضيئة',
    pts: 40,
    speed: 90,
    scale: 0.98,
    minY: 160,
    maxY: 255,
    body: '#0EA5E9',
    belly: '#7DD3FC',
    fin: '#F59E0B',
    stripe: '#075985'
  },
  {
    id: 'koi',
    nameEn: 'IMPERIAL BRONZE KOI',
    nameAr: 'كوي برونزي ملكي',
    pts: 60,
    speed: 98,
    scale: 1.08,
    minY: 185,
    maxY: 280,
    body: '#F59E0B',
    belly: '#FEF3C7',
    fin: '#D97706',
    stripe: '#78350F'
  },
  {
    id: 'angler',
    nameEn: 'CYBER ABYSS ANGLER',
    nameAr: 'صياد الأعماق السيبراني',
    pts: 95,
    speed: 112,
    scale: 1.06,
    minY: 235,
    maxY: 325,
    body: '#06B6D4',
    belly: '#67E8F9',
    fin: '#00E5FF',
    stripe: '#164E63',
    lantern: true
  },
  {
    id: 'pharaoh',
    nameEn: 'SOVEREIGN GOLD LEVIATHAN',
    nameAr: 'سمكة الذهب السيادية',
    pts: 160,
    speed: 128,
    scale: 1.18,
    minY: 255,
    maxY: 335,
    body: '#EAB308',
    belly: '#FEF9C3',
    fin: '#D4FF00',
    stripe: '#854D0E',
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
      <path class="thruster" d="M-24 0 L-46 -5 L-38 0 L-46 5 Z" fill="#D4FF00" opacity="0.9"/>
      <path d="M28 0 L-16 -13 L-10 -4 L-22 -4 L-22 4 L-10 4 L-16 13 Z" fill="#0B0E11" stroke="#D4FF00" stroke-width="1.5" stroke-linejoin="miter"/>
      <polygon points="8,0 -4,-3 -4,3" fill="#E8FF80"/>
    `,
    saucer: `
      <path class="thruster" d="M-22 -5 L-42 -8 L-34 -5 Z M-22 5 L-42 8 L-34 5 Z" fill="#D4FF00" opacity="0.85"/>
      <path d="M30 0 L6 -12 L-20 -9 L-14 0 L-20 9 L6 12 Z" fill="#0B0E11" stroke="#D4FF00" stroke-width="1.5" stroke-linejoin="miter"/>
      <line x1="-12" y1="0" x2="20" y2="0" stroke="#E8FF80" stroke-width="1.2"/>
    `,
    interceptor: `
      <path class="thruster" d="M-20 -4 L-40 -7 L-32 -4 Z M-20 4 L-40 7 L-32 4 Z" fill="#B8FF00"/>
      <path d="M28 0 L-18 -15 L-12 0 L-18 15 Z" fill="#0B0E11" stroke="#E2FF4D" stroke-width="1.5" stroke-linejoin="miter"/>
      <path d="M12 0 L-8 -4 L-5 0 L-8 4 Z" fill="#D4FF00"/>
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
        <ellipse cx="0" cy="9" rx="28" ry="5" stroke="#38BDF8" stroke-width="1" fill="none" opacity="0.4"/>
        <path d="M-26 4 L26 4 L16 11 L-16 11 Z" fill="rgba(15,23,42,0.85)" stroke="#38BDF8" stroke-width="1.4" stroke-linejoin="miter"/>
        <path d="M0 4 L0 -15 L14 2 Z" fill="rgba(56,189,248,0.22)" stroke="#38BDF8" stroke-width="1.2" stroke-linejoin="miter"/>
        <path d="M-2 4 L-2 -10 L-12 2 Z" fill="rgba(148,163,184,0.25)" stroke="#94A3B8" stroke-width="1.1" stroke-linejoin="miter"/>
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
 * ACT V: Tactical Cyber-Lagoon Fishing Arena (4-Stage Realistic Mechanics)
 *   Stage 1 (Cast / Lure): Position hook at depth (Shallow / Mid / Abyss)
 *   Stage 2 (Approach / Nibble): Nearby fish approaches in front of its nose and tests the lure
 *   Stage 3 (Strike Window / Bite!): Bobber plunges, rod bends under load, strike ring flashes (1.45s window)
 *   Stage 4 (Reel In vs. Escape): Click/Tap during the strike window to hook & reel in; too early or too late = fish escapes!
 * ========================================================================== */
function buildFishSvgMarkup(sp) {
  const crown = sp.crown
    ? `<polygon points="-2,-13 2,-21 6,-14 11,-21 13,-12" fill="#D4FF00" stroke="#042F2E" stroke-width="1"/>`
    : '';
  const lantern = sp.lantern
    ? `<path d="M16 -7 L26 -17 L31 -9" stroke="#00E5FF" stroke-width="1.4" fill="none"/><polygon points="31,-13 34,-9 31,-5 28,-9" fill="#00E5FF"/>`
    : '';
  return `
    <g class="fish-inner">
      <!-- Sharp articulated tail fin -->
      <polygon class="fish-tail" points="-21,0 -37,-12 -31,0 -37,12" fill="${sp.fin}" stroke="#042F2E" stroke-width="1.3" stroke-linejoin="miter"/>
      <!-- Angular dorsal & ventral fins -->
      <polygon points="-9,-10 1,-19 11,-9" fill="${sp.fin}"/>
      <polygon points="-6,9 2,17 9,8" fill="${sp.fin}"/>
      <!-- Streamlined armored fish body -->
      <path d="M-23 0 L-12 -11 L11 -11 L25 0 L11 11 L-12 11 Z" fill="${sp.body}" stroke="#042F2E" stroke-width="1.5" stroke-linejoin="miter"/>
      <path d="M-14 4 L10 4 L21 0 L10 9 L-12 9 Z" fill="${sp.belly}" opacity="0.65"/>
      <!-- Technical gill & armor stripes -->
      <path d="M-6 -9 L-3 0 L-6 9 M3 -9 L6 0 L3 9" stroke="${sp.stripe}" stroke-width="2" fill="none" opacity="0.8"/>
      <!-- Precision eye -->
      <polygon points="12,-4 16,-4 17,-1.5 13,-1.5" fill="#F8FAFC"/>
      <rect x="14" y="-3.5" width="2" height="2" fill="#020617"/>
      ${crown}
      ${lantern}
    </g>`;
}

function buildAct5FishingWorld() {
  const sec = document.getElementById('inquiry');
  if (!sec) return null;

  let bestScore = 0;
  let savedPlayerName = '';
  try {
    bestScore = parseInt(localStorage.getItem('arqam-fish-best') || '0', 10) || 0;
    savedPlayerName = localStorage.getItem('arqam-fish-player') || '';
  } catch (err) {
    bestScore = 0;
  }

  // Create dedicated self-contained Tactical Fishing Arena (HUD + Lagoon Tank) above .inquiry-container
  const arena = document.createElement('div');
  arena.className = 'fishing-arena';
  arena.id = 'fishing-arena';

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
        <span class="fishing-catch-pill" id="fish-status-pill">POSITION HOOK NEAR FISH → WAIT FOR BITE → CLICK TO REEL! 🎣</span>
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

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'fishing-pond');
  svg.setAttribute('id', 'fishing-pond');
  svg.setAttribute('viewBox', '0 0 1000 350');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');

  // Spawn 11 swimming fish distributed across their natural depth lanes
  const fishes = [];
  let fishesMarkup = '';
  for (let i = 0; i < 11; i++) {
    const sp = FISH_SPECIES[i % FISH_SPECIES.length];
    const dir = i % 2 === 0 ? 1 : -1;
    const x = 80 + ((i * 93) % 840);
    const y = sp.minY + ((i * 37) % Math.max(20, sp.maxY - sp.minY));
    fishes.push({
      idx: i,
      sp,
      x,
      y,
      vx: dir * sp.speed * (0.88 + (i % 3) * 0.08),
      vy: 0,
      dir,
      phase: i * 0.95,
      state: 'swim', // 'swim' | 'nibble' | 'bite' | 'caught' | 'escape'
      timer: 0,
      nibbleCount: 0,
      targetNibbles: 1 + (i % 2),
      catchProgress: 0
    });
    fishesMarkup += `<g class="pond-fish" data-fish="${i}" transform="translate(${x} ${y}) scale(${dir * sp.scale} ${sp.scale})">${buildFishSvgMarkup(sp)}</g>`;
  }

  svg.innerHTML = `
    <defs>
      <radialGradient id="lagoon-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#10B981" stop-opacity="0.26"/>
        <stop offset="100%" stop-color="#10B981" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- Upper Dock / Air Zone (y = 0..72) & Water Surface Line (y = 72) -->
    <line x1="0" y1="72" x2="1000" y2="72" stroke="#10B981" stroke-width="1.5" stroke-opacity="0.65"/>
    <path id="pond-surface-wave" d="M0 72 Q 250 68 500 72 T 1000 72" stroke="#34D399" stroke-width="1.2" fill="none" opacity="0.5"/>

    <!-- Depth Sonar Grid Lines & Labels -->
    <g stroke="rgba(16,185,129,0.14)" stroke-width="1" stroke-dasharray="4 6">
      <line x1="0" y1="155" x2="1000" y2="155"/>
      <line x1="0" y1="245" x2="1000" y2="245"/>
    </g>
    <g fill="rgba(167,243,208,0.38)" font-family="IBM Plex Mono, monospace" font-size="9" letter-spacing="1.5">
      <text x="14" y="64">SURFACE DOCK // CARBON RIG 01</text>
      <text x="14" y="90">05M SHALLOW</text>
      <text x="14" y="170">15M MID-WATER</text>
      <text x="14" y="260">30M ABYSSAL ZONE (HIGH PTS)</text>
    </g>

    <g id="pond-ripples"></g>
    <g id="pond-fishes">${fishesMarkup}</g>

    <!-- Dock-mounted Tactical Carbon Rod, Surface Bobber, Monofilament Line & Submerged Hook -->
    <g id="pond-rig">
      <circle id="pond-lure-aura" cx="520" cy="195" r="46" fill="url(#lagoon-glow)"/>
      <!-- Strike tension ring around hook (visible when a fish is biting!) -->
      <circle id="pond-strike-ring" cx="520" cy="195" r="24" stroke="#FBBF24" stroke-width="2.2" stroke-dasharray="6 3" fill="rgba(251,191,36,0.12)" opacity="0"/>
      <!-- Fishing line from rod tip (rodTipX, rodTipY) through surface bobber down to submerged hook -->
      <path id="pond-line" d="M520 38 L520 72 L520 195" stroke="#A7F3D0" stroke-width="1.5" fill="none" opacity="0.88"/>
      <!-- Dock-mounted carbon-steel rod above water surface -->
      <g id="pond-rod" transform="translate(520 38)">
        <path id="pond-rod-shaft" d="M88 -34 Q 42 -18 0 0" stroke="#051814" stroke-width="7" stroke-linecap="square" fill="none"/>
        <path id="pond-rod-core" d="M88 -34 Q 42 -18 0 0" stroke="#10B981" stroke-width="3.2" stroke-linecap="square" fill="none"/>
        <path d="M88 -34 L60 -23" stroke="#94A3B8" stroke-width="4.5" stroke-linecap="square"/>
        <rect x="-2.5" y="-2.5" width="5" height="5" fill="#051814" stroke="#10B981" stroke-width="1.2"/>
      </g>
      <!-- Surface Bobber floating at y = 72 -->
      <g id="pond-bobber" transform="translate(520 72)">
        <polygon points="0,-9 5,0 0,9 -5,0" fill="#091915" stroke="#10B981" stroke-width="1.5"/>
        <line x1="0" y1="-14" x2="0" y2="-9" stroke="#D4FF00" stroke-width="2"/>
      </g>
      <!-- Submerged Metallic Grapple Hook at (hookX, hookY) -->
      <g id="pond-hook" transform="translate(520 195)">
        <polygon points="0,-12 3,-7 0,-2 -3,-7" fill="#10B981"/>
        <path d="M0 -2 L0 10 L-8 10 L-8 4 L-4.5 6.5" stroke="#F8FAFC" stroke-width="2.1" stroke-linecap="square" stroke-linejoin="miter" fill="none"/>
      </g>
      <text id="pond-bite-alert" x="520" y="162" text-anchor="middle" fill="#FDE047" font-family="IBM Plex Mono, monospace" font-size="11.5" font-weight="700" letter-spacing="1" opacity="0">⚡ STRIKE! CLICK / TAP NOW! ⚡</text>
    </g>
  `;

  arena.appendChild(hud);
  arena.appendChild(svg);

  const inquiryContainer = sec.querySelector('.inquiry-container');
  if (inquiryContainer) {
    sec.insertBefore(arena, inquiryContainer);
  } else {
    sec.appendChild(arena);
  }

  const w = {
    sec,
    arena,
    svg,
    hud,
    fishes,
    fishEls: Array.from(svg.querySelectorAll('.pond-fish')),
    tailEls: Array.from(svg.querySelectorAll('.fish-tail')),
    ripplesEl: svg.querySelector('#pond-ripples'),
    surfaceWaveEl: svg.querySelector('#pond-surface-wave'),
    rodEl: svg.querySelector('#pond-rod'),
    rodShaftEl: svg.querySelector('#pond-rod-shaft'),
    rodCoreEl: svg.querySelector('#pond-rod-core'),
    lineEl: svg.querySelector('#pond-line'),
    bobberEl: svg.querySelector('#pond-bobber'),
    hookEl: svg.querySelector('#pond-hook'),
    auraEl: svg.querySelector('#pond-lure-aura'),
    strikeRingEl: svg.querySelector('#pond-strike-ring'),
    biteAlertEl: svg.querySelector('#pond-bite-alert'),
    scoreEl: document.getElementById('fish-score'),
    caughtEl: document.getElementById('fish-caught'),
    comboEl: document.getElementById('fish-combo'),
    bestEl: document.getElementById('fish-best'),
    statusPill: document.getElementById('fish-status-pill'),
    rodX: 520,
    rodY: 38,
    hookX: 520,
    hookY: 195,
    targetX: 520,
    targetY: 195,
    score: 0,
    caught: 0,
    combo: 1,
    best: bestScore,
    lastCatchTime: 0,
    baitBoostTimer: 0,
    ripples: []
  };

  function setStatus(enText, arText, isBite = false) {
    if (!w.statusPill) return;
    const ar = document.documentElement.lang === 'ar';
    w.statusPill.textContent = ar ? arText : enText;
    w.statusPill.classList.toggle('is-bite', Boolean(isBite));
  }

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
    if (w.caught === 0) {
      setStatus(
        'POSITION HOOK NEAR FISH → WAIT FOR BITE → CLICK TO REEL! 🎣',
        'قرّب الخطاف للسمكة ← انتظر الغمزة ← اضغط فوراً لسحبها! 🎣',
        false
      );
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
      setStatus('ENTER YOUR NAME FIRST TO SAVE SCORE! ✍️', 'اكتب اسمك أولاً لحفظ السكور! ✍️');
      return;
    }
    if (scoreToSave <= 0) {
      sound.play('form-error');
      setStatus('CATCH AT LEAST 1 FISH BEFORE SAVING! 🐟', 'اصطد سمكة واحدة على الأقل قبل حفظ السكور! 🐟');
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
        setStatus(
          `SCORE (${scoreToSave}) SAVED FOR "${playerName}" ON LEADERBOARD! 🏆`,
          `تم تسجيل سكورك (${scoreToSave}) باسم "${playerName}" في لوحة الشرف! 🏆`
        );
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      sound.play('form-error');
      setStatus('COULD NOT REACH SERVER, TRY AGAIN', 'تعذر الاتصال، حاول مرة أخرى');
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
    if (now - w.lastCatchTime < 9000) {
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
    setStatus(
      `REEL SUCCESS! CAUGHT ${fishName} (+${gained} PTS)! 🐟`,
      `صيد ناجح! تم سحب ${fishName} (+${gained} نقطة)! 🐟`,
      false
    );

    haptic(24);
    sound.play('reel-in');
    window.setTimeout(() => sound.play('fish-catch'), 110);

    w.ripples.push({ x: f.x, y: 72, age: 0, color: f.sp.body });
    const rect = w.svg.getBoundingClientRect();
    const sx = clientX || rect.left + (f.x / 1000) * rect.width;
    const sy = clientY || rect.top + (f.y / 350) * rect.height;
    spawnPopup(sx, sy, `+${gained} ${fishName}`, f.sp.body);
  }

  function escapeFish(f, reasonEn, reasonAr) {
    f.state = 'escape';
    f.timer = 1.3;
    f.dir = f.x < w.hookX ? -1 : 1;
    f.vx = f.dir * f.sp.speed * 2.7;
    f.vy = (Math.random() - 0.5) * 45;
    w.combo = 1;
    w.comboEl.textContent = 'x1';
    sound.play('water-plop');
    w.ripples.push({ x: w.hookX, y: w.hookY, age: 0, color: '#EF4444' });
    setStatus(reasonEn, reasonAr, false);
  }

  // Pointer move inside #fishing-pond smoothly steers the rod along the top dock and hook depth in the water
  svg.addEventListener('pointermove', (e) => {
    const rect = w.svg.getBoundingClientRect();
    const px = clamp(((e.clientX - rect.left) / Math.max(1, rect.width)) * 1000, 45, 955);
    const py = clamp(((e.clientY - rect.top) / Math.max(1, rect.height)) * 350, 92, 332);
    w.targetX = px;
    w.targetY = py;
  });

  // Clicking or tapping inside #fishing-pond:
  // - If a fish is currently BITING (state === 'bite'), strikes & reels it in!
  // - If a fish is only NIBBLING (state === 'nibble'), spooks the fish (pulled too early)!
  // - Otherwise casts the hook to the clicked spot in the water!
  svg.addEventListener('pointerdown', (e) => {
    const rect = w.svg.getBoundingClientRect();
    const px = clamp(((e.clientX - rect.left) / Math.max(1, rect.width)) * 1000, 45, 955);
    const py = clamp(((e.clientY - rect.top) / Math.max(1, rect.height)) * 350, 92, 332);

    const bitingFish = w.fishes.find((f) => f.state === 'bite');
    if (bitingFish) {
      catchFish(bitingFish, e.clientX, e.clientY);
      return;
    }

    const nibblingFish = w.fishes.find((f) => f.state === 'nibble');
    if (nibblingFish && Math.hypot(px - w.hookX, py - w.hookY) < 95) {
      escapeFish(
        nibblingFish,
        'TOO EARLY! WAIT UNTIL IT BITES THE HOOK! ⚠️',
        'سحبت الصنارة بدري! انتظر حتى تغمز السمكة بقوة! ⚠️'
      );
      return;
    }

    // Cast hook to new water coordinates
    w.targetX = px;
    w.targetY = py;
    w.hookX = px;
    w.hookY = py;
    w.ripples.push({ x: px, y: 72, age: 0, color: '#10B981' });
    w.ripples.push({ x: px, y: py, age: 0.08, color: '#34D399' });
    sound.play('cast-line');
    window.setTimeout(() => sound.play('water-plop'), 130);
  });

  // Also allow clicking the status pill when it flashes STRIKE! on mobile
  if (w.statusPill) {
    w.statusPill.addEventListener('click', (e) => {
      const bitingFish = w.fishes.find((f) => f.state === 'bite');
      if (bitingFish) {
        e.stopPropagation();
        catchFish(bitingFish, e.clientX, e.clientY);
      }
    });
  }

  const baitBtn = document.getElementById('fish-bait-btn');
  if (baitBtn) {
    baitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      haptic(14);
      sound.play('water-plop');
      w.baitBoostTimer = 7.0;
      for (let k = 0; k < 3; k++) {
        w.ripples.push({
          x: w.hookX + (Math.random() - 0.5) * 60,
          y: w.hookY + (Math.random() - 0.5) * 40,
          age: k * 0.12,
          color: '#FBBF24'
        });
      }
      setStatus(
        'BAIT ACTIVE! FISH ARE ATTRACTED — WAIT FOR THE BITE THEN CLICK! 🪱',
        'تم رمي الطُعم! السمك يقترب — انتظر الغمزة ثم اضغط لسحبها! 🪱',
        false
      );
    });
  }

  w.catchFish = catchFish;
  w.escapeFish = escapeFish;
  w.setStatus = setStatus;
  return w;
}

function updateAct5FishingWorld(w, dt, t) {
  if (!w) return;
  const rect = w.svg.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;

  if (w.baitBoostTimer > 0) w.baitBoostTimer = Math.max(0, w.baitBoostTimer - dt);

  // Smoothly move dock-mounted rod horizontally (rodY stays anchored at y = 38 above water!)
  w.rodX = lerp(w.rodX, w.targetX, Math.min(1, dt * 14));
  w.hookX = lerp(w.hookX, w.targetX, Math.min(1, dt * 7.5));
  w.hookY = lerp(w.hookY, w.targetY, Math.min(1, dt * 7.5));

  // Animate surface wave
  const waveY = 72 + Math.sin(t * 2.2) * 2.5;
  if (w.surfaceWaveEl) {
    w.surfaceWaveEl.setAttribute('d', `M0 72 Q 250 ${waveY.toFixed(1)} 500 72 T 1000 72`);
  }

  // Check if any fish is currently engaged ('nibble' or 'bite')
  let activeFish = w.fishes.find((f) => f.state === 'nibble' || f.state === 'bite');

  w.fishes.forEach((f, i) => {
    const tailSpeed = f.state === 'bite' ? 22 : f.state === 'escape' ? 20 : f.state === 'nibble' ? 13 : 8;
    const tailAngle = Math.sin(t * tailSpeed + f.phase) * 15;
    w.tailEls[i].setAttribute('transform', `rotate(${tailAngle.toFixed(1)} -21 0)`);

    // 1. CAUGHT: Reel fish up to the rod tip at (rodX, 55)
    if (f.state === 'caught') {
      f.catchProgress += dt * 2.4;
      f.x = lerp(f.x, w.rodX, Math.min(1, dt * 14));
      f.y = lerp(f.y, 58, Math.min(1, dt * 14));
      const shrink = Math.max(0.05, 1 - f.catchProgress);
      w.fishEls[i].setAttribute(
        'transform',
        `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(-70) scale(${(f.sp.scale * shrink).toFixed(2)})`
      );
      if (f.catchProgress >= 1) {
        f.state = 'swim';
        f.catchProgress = 0;
        f.dir = Math.random() > 0.5 ? 1 : -1;
        f.x = f.dir > 0 ? -60 : 1060;
        f.y = f.sp.minY + Math.random() * (f.sp.maxY - f.sp.minY);
        f.vx = f.dir * f.sp.speed;
        f.vy = 0;
      }
      return;
    }

    // 2. ESCAPE: Fish darts away rapidly after a missed strike or early pull
    if (f.state === 'escape') {
      f.timer -= dt;
      f.x += f.vx * dt;
      f.y = clamp(f.y + f.vy * dt, 92, 334);
      if (f.timer <= 0 || f.x < -80 || f.x > 1080) {
        f.state = 'swim';
        if (f.x < -80) { f.x = -50; f.dir = 1; }
        if (f.x > 1080) { f.x = 1050; f.dir = -1; }
        f.vx = f.dir * f.sp.speed;
      }
      const tilt = clamp(f.vy * 0.18, -18, 18);
      w.fishEls[i].setAttribute(
        'transform',
        `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${tilt.toFixed(1)}) scale(${(f.dir * f.sp.scale).toFixed(2)} ${f.sp.scale.toFixed(2)})`
      );
      return;
    }

    const dx = w.hookX - f.x;
    const dy = w.hookY - f.y;
    const dist = Math.hypot(dx, dy);

    // 3. BITE (STRIKE WINDOW!): Fish is on the hook! Player has 1.45s to Click/Tap!
    if (f.state === 'bite') {
      f.timer += dt;
      // If player drags hook too far away without clicking, fish breaks off
      if (dist > 145) {
        w.escapeFish(f, 'LINE SNAPPED! KEEP HOOK STEADY & CLICK! ⚡', 'انقطع الخيط! اضغط على السمكة وقت الغمزة! ⚡');
        activeFish = null;
        return;
      }
      // Fish tugs aggressively on the hook
      f.x = lerp(f.x, w.hookX - f.dir * 18, Math.min(1, dt * 15));
      f.y = lerp(f.y, w.hookY + Math.sin(t * 26) * 5, Math.min(1, dt * 15));
      if (f.timer > 1.45) {
        w.escapeFish(
          f,
          '💨 FISH ESCAPED! CLICK / TAP FASTER WHEN IT BITES!',
          '💨 فلتت السمكة! اضغط أسرع أول ما تغمز الصنارة!'
        );
        activeFish = null;
        return;
      }
      w.fishEls[i].setAttribute(
        'transform',
        `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${(f.dir * -12).toFixed(1)}) scale(${(f.dir * f.sp.scale).toFixed(2)} ${f.sp.scale.toFixed(2)})`
      );
      return;
    }

    // 4. NIBBLE: Fish approaches hook and tests the bait before biting
    if (f.state === 'nibble') {
      if (dist > 165) {
        f.state = 'swim';
        activeFish = null;
      } else {
        f.timer += dt;
        const targetStandOff = 22 + Math.sin(f.timer * 9) * 7;
        f.dir = dx >= 0 ? 1 : -1;
        f.x = lerp(f.x, w.hookX - f.dir * targetStandOff, Math.min(1, dt * 6));
        f.y = lerp(f.y, w.hookY + Math.cos(f.timer * 7) * 4, Math.min(1, dt * 6));

        // Transition from nibble to full BITE strike after ~0.85s!
        if (f.timer >= 0.85) {
          f.state = 'bite';
          f.timer = 0;
          haptic(20);
          sound.play('fish-bite');
          w.ripples.push({ x: w.hookX, y: w.hookY, age: 0, color: '#FBBF24' });
          w.ripples.push({ x: w.hookX, y: 72, age: 0, color: '#FDE047' });
          w.setStatus(
            '⚡ BITE! CLICK OR TAP NOW TO REEL IT IN! ⚡',
            '⚡ غمزت الصنارة! اضغط الآن فوراً لسحب السمكة! ⚡',
            true
          );
        }
        w.fishEls[i].setAttribute(
          'transform',
          `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(0) scale(${(f.dir * f.sp.scale).toFixed(2)} ${f.sp.scale.toFixed(2)})`
        );
        return;
      }
    }

    // 5. SWIM: Normal patrol in its depth lane; check if hook is in front of its vision cone
    const inFront = (f.dir > 0 && dx > -15) || (f.dir < 0 && dx < 15) || w.baitBoostTimer > 0;
    const detectRadius = w.baitBoostTimer > 0 ? 220 : 115;
    if (!activeFish && inFront && dist < detectRadius && Math.abs(dy) < 65) {
      f.state = 'nibble';
      f.timer = 0;
      activeFish = f;
      w.setStatus(
        'A FISH IS TESTING YOUR BAIT... WAIT FOR THE BITE! 👀',
        'سمكة تقترب وتختبر الطُعم... انتظر الغمزة القوية! 👀',
        false
      );
    }

    f.vx = lerp(f.vx, f.dir * f.sp.speed, dt * 2);
    const laneCenter = (f.sp.minY + f.sp.maxY) * 0.5;
    f.vy = Math.sin(t * 1.5 + f.phase) * 14 + (laneCenter - f.y) * 0.35;
    f.x += f.vx * dt;
    f.y = clamp(f.y + f.vy * dt, f.sp.minY, f.sp.maxY);
    if (f.x > 1050) { f.dir = -1; f.vx = -f.sp.speed; }
    if (f.x < -50) { f.dir = 1; f.vx = f.sp.speed; }

    const tilt = clamp(f.vy * 0.2, -14, 14);
    w.fishEls[i].setAttribute(
      'transform',
      `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${tilt.toFixed(1)}) scale(${(f.dir * f.sp.scale).toFixed(2)} ${f.sp.scale.toFixed(2)})`
    );
  });

  // Render physical rod bend, surface bobber dip, and strike tension ring
  const isBiting = Boolean(activeFish && activeFish.state === 'bite');
  const isNibbling = Boolean(activeFish && activeFish.state === 'nibble');
  const rodBendY = isBiting ? 14 + Math.sin(t * 28) * 4 : isNibbling ? 4 + Math.sin(t * 12) * 2 : 0;
  const rodTipX = w.rodX;
  const rodTipY = w.rodY + rodBendY;

  if (w.rodEl) {
    w.rodEl.setAttribute('transform', `translate(${w.rodX.toFixed(1)} ${w.rodY.toFixed(1)})`);
    const shaftD = `M88 -34 Q 42 ${(-18 + rodBendY * 0.5).toFixed(1)} 0 ${rodBendY.toFixed(1)}`;
    if (w.rodShaftEl) w.rodShaftEl.setAttribute('d', shaftD);
    if (w.rodCoreEl) w.rodCoreEl.setAttribute('d', shaftD);
  }

  const bobberY = 72 + (isBiting ? 12 + Math.sin(t * 28) * 4 : isNibbling ? 3 + Math.sin(t * 12) * 2.5 : Math.sin(t * 2.5) * 1.8);
  const bobberX = lerp(w.hookX, rodTipX, 0.22);

  w.bobberEl.setAttribute('transform', `translate(${bobberX.toFixed(1)} ${bobberY.toFixed(1)})`);
  w.hookEl.setAttribute('transform', `translate(${w.hookX.toFixed(1)} ${w.hookY.toFixed(1)})`);
  w.lineEl.setAttribute(
    'd',
    `M${rodTipX.toFixed(1)} ${rodTipY.toFixed(1)} L${bobberX.toFixed(1)} ${bobberY.toFixed(1)} Q ${(bobberX + (w.hookX - bobberX) * 0.5).toFixed(1)} ${((bobberY + w.hookY) * 0.5 + 12).toFixed(1)} ${w.hookX.toFixed(1)} ${(w.hookY - 10).toFixed(1)}`
  );

  w.auraEl.setAttribute('cx', w.hookX.toFixed(1));
  w.auraEl.setAttribute('cy', w.hookY.toFixed(1));
  w.auraEl.setAttribute('r', w.baitBoostTimer > 0 ? '88' : '46');

  if (w.strikeRingEl) {
    w.strikeRingEl.setAttribute('cx', w.hookX.toFixed(1));
    w.strikeRingEl.setAttribute('cy', w.hookY.toFixed(1));
    const ringRadius = isBiting ? 22 + Math.sin(t * 24) * 5 : 16;
    w.strikeRingEl.setAttribute('r', ringRadius.toFixed(1));
    w.strikeRingEl.setAttribute('opacity', isBiting ? '1' : isNibbling ? '0.35' : '0');
  }

  w.biteAlertEl.setAttribute('x', clamp(w.hookX, 140, 860).toFixed(1));
  w.biteAlertEl.setAttribute('y', Math.max(96, w.hookY - 26).toFixed(1));
  w.biteAlertEl.setAttribute('opacity', isBiting ? '1' : '0');

  // Render water ripples
  let rippleMarkup = '';
  for (let i = w.ripples.length - 1; i >= 0; i--) {
    const r = w.ripples[i];
    r.age += dt;
    if (r.age > 1.1) {
      w.ripples.splice(i, 1);
      continue;
    }
    const p = r.age / 1.1;
    const rad = 6 + p * 46;
    const op = (1 - p) * 0.65;
    rippleMarkup += `<ellipse cx="${r.x.toFixed(1)}" cy="${r.y.toFixed(1)}" rx="${rad.toFixed(1)}" ry="${(rad * 0.42).toFixed(1)}" stroke="${r.color}" stroke-width="1.6" fill="none" opacity="${op.toFixed(2)}"/>`;
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
