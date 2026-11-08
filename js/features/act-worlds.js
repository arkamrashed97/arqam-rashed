import { state } from '../core/state.js';
import { clamp, lerp } from '../core/utils.js';
import { haptic } from '../core/env.js';
import { sound } from '../audio/index.js';
import { CONFIG } from '../config.js';

/**
 * Act V Tactical Cyber-Lagoon Fishing Arena:
 *  - High-intelligence fish AI (spook detection, lure twitching, boredom, fake-out nibbles)
 *  - Dynamic Strike Reflex Window (0.62s to 0.95s based on fish intelligence)
 *  - Interactive Reel Fight & Line Tension mechanic for mid & high-tier species
 *  - Bait cooldown timer (15s)
 *  - Acts I–IV flying SVGs removed for pure 3D WebGL immersion
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

const FISH_SPECIES = [
  {
    id: 'tilapia',
    nameEn: 'SILVER NILE PERCH',
    nameAr: 'قشر بياض نيلي فضي',
    pts: 15,
    speed: 68,
    scale: 0.88,
    minY: 105,
    maxY: 175,
    caution: 0.25,
    strikeWindow: 0.95,
    targetNibbles: 1,
    fightDuration: 0,
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
    speed: 84,
    scale: 0.94,
    minY: 115,
    maxY: 205,
    caution: 0.40,
    strikeWindow: 0.88,
    targetNibbles: 1,
    fightDuration: 0,
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
    speed: 92,
    scale: 0.98,
    minY: 160,
    maxY: 255,
    caution: 0.55,
    strikeWindow: 0.80,
    targetNibbles: 2,
    fightDuration: 2.0,
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
    speed: 102,
    scale: 1.08,
    minY: 185,
    maxY: 280,
    caution: 0.70,
    strikeWindow: 0.74,
    targetNibbles: 2,
    fightDuration: 2.6,
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
    speed: 116,
    scale: 1.06,
    minY: 235,
    maxY: 325,
    caution: 0.82,
    strikeWindow: 0.68,
    targetNibbles: 3,
    fightDuration: 3.2,
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
    speed: 132,
    scale: 1.18,
    minY: 255,
    maxY: 335,
    caution: 0.92,
    strikeWindow: 0.62,
    targetNibbles: 3,
    fightDuration: 3.8,
    body: '#EAB308',
    belly: '#FEF9C3',
    fin: '#D4FF00',
    stripe: '#854D0E',
    crown: true
  }
];

const worlds = {
  initialized: false,
  act5: null
};

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
      <!-- Spook badge -->
      <g class="fish-spook-badge" opacity="0" transform="translate(0 -22)">
        <circle cx="0" cy="0" r="8" fill="#EF4444"/>
        <text x="0" y="3.5" text-anchor="middle" fill="#FFFFFF" font-family="IBM Plex Mono, monospace" font-size="10" font-weight="700">!</text>
      </g>
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
        <span class="fishing-catch-pill" id="fish-status-pill">TWITCH HOOK GENTLY TO ATTRACT FISH → STRIKE ON BITE! 🎣</span>
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

  // Spawn 11 swimming fish distributed across depth lanes
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
      state: 'swim', // 'swim' | 'curious' | 'nibble' | 'bite' | 'fight' | 'caught' | 'spooked'
      timer: 0,
      nibbleCount: 0,
      targetNibbles: sp.targetNibbles,
      catchProgress: 0,
      reelProgress: 0,
      tension: 0.2,
      fightDuration: sp.fightDuration
    });
    fishesMarkup += `<g class="pond-fish" data-fish="${i}" transform="translate(${x} ${y}) scale(${dir * sp.scale} ${sp.scale})">${buildFishSvgMarkup(sp)}</g>`;
  }

  svg.innerHTML = `
    <defs>
      <radialGradient id="lagoon-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#10B981" stop-opacity="0.26"/>
        <stop offset="100%" stop-color="#10B981" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="fight-tension-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#10B981"/>
        <stop offset="60%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#EF4444"/>
      </linearGradient>
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
      <text x="14" y="90">05M SHALLOW (PERCH / BARRACUDA)</text>
      <text x="14" y="170">15M MID-WATER (COBALT VECTOR / KOI)</text>
      <text x="14" y="260">30M ABYSSAL ZONE (ANGLER / LEVIATHAN)</text>
    </g>

    <g id="pond-ripples"></g>
    <g id="pond-fishes">${fishesMarkup}</g>

    <!-- Dock-mounted Tactical Carbon Rod, Surface Bobber, Monofilament Line & Submerged Hook -->
    <g id="pond-rig">
      <circle id="pond-lure-aura" cx="520" cy="195" r="46" fill="url(#lagoon-glow)"/>
      <!-- Strike tension ring around hook (visible when a fish is biting!) -->
      <circle id="pond-strike-ring" cx="520" cy="195" r="24" stroke="#FBBF24" stroke-width="2.2" stroke-dasharray="6 3" fill="rgba(251,191,36,0.12)" opacity="0"/>
      <!-- Fishing line from rod tip through surface bobber down to submerged hook -->
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

      <!-- Dynamic Interactive Reel / Tension HUD for Fighting Fish -->
      <g id="pond-fight-hud" transform="translate(520 150)" opacity="0">
        <rect x="-70" y="-18" width="140" height="34" rx="4" fill="rgba(3,15,12,0.92)" stroke="#10B981" stroke-width="1.2"/>
        <text id="pond-fight-title" x="0" y="-6" text-anchor="middle" fill="#A7F3D0" font-family="IBM Plex Mono, monospace" font-size="8.5" font-weight="700" letter-spacing="1">REEL FIGHT // KEEP ROD CLOSE</text>
        <!-- Reel Progress Bar (Green) -->
        <rect x="-62" y="0" width="124" height="4" rx="1.5" fill="rgba(255,255,255,0.1)"/>
        <rect id="pond-fight-reel-fill" x="-62" y="0" width="20" height="4" rx="1.5" fill="#10B981"/>
        <!-- Line Tension Bar (Yellow/Red) -->
        <rect x="-62" y="7" width="124" height="3" rx="1" fill="rgba(255,255,255,0.08)"/>
        <rect id="pond-fight-tension-fill" x="-62" y="7" width="30" height="3" rx="1" fill="url(#fight-tension-grad)"/>
      </g>
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
    spookBadges: Array.from(svg.querySelectorAll('.fish-spook-badge')),
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
    fightHudEl: svg.querySelector('#pond-fight-hud'),
    fightTitleEl: svg.querySelector('#pond-fight-title'),
    fightReelFillEl: svg.querySelector('#pond-fight-reel-fill'),
    fightTensionFillEl: svg.querySelector('#pond-fight-tension-fill'),
    scoreEl: document.getElementById('fish-score'),
    caughtEl: document.getElementById('fish-caught'),
    comboEl: document.getElementById('fish-combo'),
    bestEl: document.getElementById('fish-best'),
    statusPill: document.getElementById('fish-status-pill'),
    baitBtn: document.getElementById('fish-bait-btn'),
    rodX: 520,
    rodY: 38,
    hookX: 520,
    hookY: 195,
    prevHookX: 520,
    prevHookY: 195,
    targetX: 520,
    targetY: 195,
    score: 0,
    caught: 0,
    combo: 1,
    best: bestScore,
    lastCatchTime: 0,
    lastHookMoveTime: 0,
    baitBoostTimer: 0,
    baitCooldownTimer: 0,
    ripples: []
  };

  function setStatus(enText, arText, statusClass = '') {
    if (!w.statusPill) return;
    const ar = document.documentElement.lang === 'ar';
    w.statusPill.textContent = ar ? arText : enText;
    w.statusPill.classList.toggle('is-bite', statusClass === 'bite');
    w.statusPill.classList.toggle('is-spook', statusClass === 'spook');
    w.statusPill.classList.toggle('is-fight', statusClass === 'fight');
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
    if (baitBtn && w.baitCooldownTimer <= 0) {
      baitBtn.textContent = ar ? 'رمي طُعم للسمك 🪱' : 'DROP BAIT 🪱';
    }
    if (nameInput) nameInput.placeholder = ar ? 'اكتب اسمك فقط لحفظ السكور...' : 'Your name to save score...';
    if (saveBtn) saveBtn.textContent = ar ? 'حفظ السكور 🏆' : 'SAVE SCORE 🏆';
    if (boardTitle) boardTitle.textContent = ar ? '🏆 لوحة المتصدرين:' : '🏆 TOP ANGLERS:';
    if (w.caught === 0) {
      setStatus(
        'TWITCH HOOK GENTLY TO ATTRACT FISH → STRIKE ON BITE! 🎣',
        'حرّك الصنارة بهدوء لجذب السمك ← اغمز واضغط فوراً! 🎣',
        ''
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
      setStatus('ENTER YOUR NAME FIRST TO SAVE SCORE! ✍️', 'اكتب اسمك أولاً لحفظ السكور! ✍️', 'spook');
      return;
    }
    if (scoreToSave <= 0) {
      sound.play('form-error');
      setStatus('CATCH AT LEAST 1 FISH BEFORE SAVING! 🐟', 'اصطد سمكة واحدة على الأقل قبل حفظ السكور! 🐟', 'spook');
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
          `تم تسجيل سكورك (${scoreToSave}) باسم "${playerName}" في لوحة الشرف! 🏆`,
          'fight'
        );
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      sound.play('form-error');
      setStatus('COULD NOT REACH SERVER, TRY AGAIN', 'تعذر الاتصال، حاول مرة أخرى', 'spook');
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

  // Lazy-fetch leaderboard only when Act V (#inquiry) approaches viewport
  if ('IntersectionObserver' in window) {
    const lbObserver = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          lbObserver.disconnect();
          fetchLeaderboard();
          return;
        }
      }
    }, { rootMargin: '700px 0px' });
    lbObserver.observe(sec);
  } else {
    window.setTimeout(fetchLeaderboard, 2500);
  }

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
      ''
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

  function spookFish(f, reasonEn, reasonAr) {
    f.state = 'spooked';
    f.timer = 1.4;
    f.dir = f.x < w.hookX ? -1 : 1;
    f.vx = f.dir * f.sp.speed * 2.8;
    f.vy = (Math.random() - 0.5) * 55;
    w.combo = 1;
    w.comboEl.textContent = 'x1';
    sound.play('water-plop');
    w.ripples.push({ x: f.x, y: f.y, age: 0, color: '#EF4444' });
    setStatus(reasonEn, reasonAr, 'spook');

    // Spook other nearby fish within 75px radius
    w.fishes.forEach((other) => {
      if (other !== f && (other.state === 'swim' || other.state === 'curious' || other.state === 'nibble')) {
        const d = Math.hypot(other.x - f.x, other.y - f.y);
        if (d < 75) {
          other.state = 'spooked';
          other.timer = 1.2;
          other.dir = other.x < f.x ? -1 : 1;
          other.vx = other.dir * other.sp.speed * 2.5;
        }
      }
    });
  }

  // Pointer move inside #fishing-pond steers hook and tracks motion speed
  svg.addEventListener('pointermove', (e) => {
    const rect = w.svg.getBoundingClientRect();
    const px = clamp(((e.clientX - rect.left) / Math.max(1, rect.width)) * 1000, 45, 955);
    const py = clamp(((e.clientY - rect.top) / Math.max(1, rect.height)) * 350, 92, 332);
    w.targetX = px;
    w.targetY = py;
  });

  // Clicking or tapping inside #fishing-pond:
  // - If fish is in 'bite', strikes it!
  // - If fish is only in 'nibble', spooks the fish (pulled too early)!
  // - If fish is in 'fight', helps reel it in faster!
  // - Otherwise casts the hook to the clicked spot!
  svg.addEventListener('pointerdown', (e) => {
    const rect = w.svg.getBoundingClientRect();
    const px = clamp(((e.clientX - rect.left) / Math.max(1, rect.width)) * 1000, 45, 955);
    const py = clamp(((e.clientY - rect.top) / Math.max(1, rect.height)) * 350, 92, 332);

    const fightingFish = w.fishes.find((f) => f.state === 'fight');
    if (fightingFish) {
      // Pump the reel
      fightingFish.reelProgress += 0.08;
      fightingFish.tension = Math.min(0.95, fightingFish.tension + 0.05);
      haptic(12);
      sound.play('reel-in', { rate: 1.15 });
      return;
    }

    const bitingFish = w.fishes.find((f) => f.state === 'bite');
    if (bitingFish) {
      if (bitingFish.fightDuration > 0) {
        bitingFish.state = 'fight';
        bitingFish.timer = 0;
        bitingFish.reelProgress = 0.15;
        bitingFish.tension = 0.25;
        haptic(22);
        sound.play('fish-bite');
        setStatus(
          '🎣 FISH HOOKED! KEEP YOUR ROD ON IT TO REEL IT IN! 🎣',
          '🎣 علقت السمكة! تحكم بالصنارة وخلك قريب منها لسحبها! 🎣',
          'fight'
        );
      } else {
        catchFish(bitingFish, e.clientX, e.clientY);
      }
      return;
    }

    const nibblingFish = w.fishes.find((f) => f.state === 'nibble');
    if (nibblingFish && Math.hypot(px - w.hookX, py - w.hookY) < 110) {
      spookFish(
        nibblingFish,
        'TOO EARLY! YOU JERKED BEFORE IT COMMITTED! ⚠️',
        'سحبت الصنارة بدري قبل ما تغمز السمكة بقوة! ⚠️'
      );
      return;
    }

    // Cast hook to clicked spot in water
    const castDist = Math.hypot(px - w.hookX, py - w.hookY);
    w.targetX = px;
    w.targetY = py;
    w.hookX = px;
    w.hookY = py;
    w.lastHookMoveTime = performance.now() * 0.001;

    // Check if cast violently right on top of a swimming fish (spook!)
    w.fishes.forEach((f) => {
      if ((f.state === 'swim' || f.state === 'curious') && Math.hypot(px - f.x, py - f.y) < 32 && castDist > 120) {
        spookFish(f, 'CAST TOO CLOSE! HOOK SPLASHED RIGHT ON THE FISH! ❗', 'رميت الصنارة فوق السمكة مباشرة ففزعت! ❗');
      }
    });

    w.ripples.push({ x: px, y: 72, age: 0, color: '#10B981' });
    w.ripples.push({ x: px, y: py, age: 0.08, color: '#34D399' });
    sound.play('cast-line');
    window.setTimeout(() => sound.play('water-plop'), 120);
  });

  if (w.statusPill) {
    w.statusPill.addEventListener('click', (e) => {
      const bitingFish = w.fishes.find((f) => f.state === 'bite');
      if (bitingFish) {
        e.stopPropagation();
        if (bitingFish.fightDuration > 0) {
          bitingFish.state = 'fight';
          bitingFish.timer = 0;
          bitingFish.reelProgress = 0.15;
          bitingFish.tension = 0.25;
          haptic(22);
          sound.play('fish-bite');
        } else {
          catchFish(bitingFish, e.clientX, e.clientY);
        }
      }
    });
  }

  const baitBtn = document.getElementById('fish-bait-btn');
  if (baitBtn) {
    baitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (w.baitCooldownTimer > 0) return;
      haptic(14);
      sound.play('water-plop');
      w.baitBoostTimer = 6.0;
      w.baitCooldownTimer = 15.0;
      for (let k = 0; k < 3; k++) {
        w.ripples.push({
          x: w.hookX + (Math.random() - 0.5) * 60,
          y: w.hookY + (Math.random() - 0.5) * 40,
          age: k * 0.12,
          color: '#FBBF24'
        });
      }
      setStatus(
        'BAIT DISPENSED! FISH ARE DRAWN IN — WATCH FOR NIBBLES! 🪱',
        'تم نشر الطُعم! السمك ينجذب بقوة — راقب الصنارة! 🪱',
        ''
      );
    });
  }

  w.catchFish = catchFish;
  w.spookFish = spookFish;
  w.setStatus = setStatus;
  w.inView = false;
  w.lastRippleMarkup = '';
  return w;
}

function updateAct5FishingWorld(w, dt, t) {
  if (!w || !w.inView) return;
  const rect = w.svg.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;

  // Track bait timers & live cooldown countdown on button
  if (w.baitBoostTimer > 0) w.baitBoostTimer = Math.max(0, w.baitBoostTimer - dt);
  if (w.baitCooldownTimer > 0) {
    w.baitCooldownTimer = Math.max(0, w.baitCooldownTimer - dt);
    if (w.baitBtn) {
      w.baitBtn.disabled = true;
      const ar = document.documentElement.lang === 'ar';
      const secLeft = Math.ceil(w.baitCooldownTimer);
      w.baitBtn.textContent = ar ? `انتظر (${secLeft}ث)` : `COOLDOWN (${secLeft}s)`;
    }
  } else if (w.baitBtn && w.baitBtn.disabled) {
    w.baitBtn.disabled = false;
    const ar = document.documentElement.lang === 'ar';
    w.baitBtn.textContent = ar ? 'رمي طُعم للسمك 🪱' : 'DROP BAIT 🪱';
  }

  // Calculate hook velocity and check for jerky sudden movements
  const dxHook = w.hookX - w.prevHookX;
  const dyHook = w.hookY - w.prevHookY;
  const hookDist = Math.hypot(dxHook, dyHook);
  const hookSpeed = dt > 0 ? hookDist / dt : 0;
  if (hookSpeed > 20) w.lastHookMoveTime = t;
  w.prevHookX = w.hookX;
  w.prevHookY = w.hookY;

  // Smooth hook & rod interpolation
  w.rodX = lerp(w.rodX, w.targetX, Math.min(1, dt * 14));
  w.hookX = lerp(w.hookX, w.targetX, Math.min(1, dt * 7.5));
  w.hookY = lerp(w.hookY, w.targetY, Math.min(1, dt * 7.5));

  // Animate surface wave
  const waveY = 72 + Math.sin(t * 2.2) * 2.5;
  if (w.surfaceWaveEl) {
    w.surfaceWaveEl.setAttribute('d', `M0 72 Q 250 ${waveY.toFixed(1)} 500 72 T 1000 72`);
  }

  let activeFish = w.fishes.find((f) => f.state === 'curious' || f.state === 'nibble' || f.state === 'bite' || f.state === 'fight');

  w.fishes.forEach((f, i) => {
    const tailSpeed = f.state === 'fight' ? 26 : f.state === 'bite' ? 22 : f.state === 'spooked' ? 24 : f.state === 'nibble' ? 14 : 8;
    const tailAngle = Math.sin(t * tailSpeed + f.phase) * 16;
    w.tailEls[i].setAttribute('transform', `rotate(${tailAngle.toFixed(1)} -21 0)`);

    // Spook badge visibility
    if (w.spookBadges[i]) {
      w.spookBadges[i].setAttribute('opacity', f.state === 'spooked' ? '1' : '0');
    }

    // 1. CAUGHT: Reel fish up to dock tip
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

    // 2. SPOOKED: Fast dart away with red ripple
    if (f.state === 'spooked') {
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

    // Spook check during swimming/curious if player moves hook violently nearby
    if ((f.state === 'swim' || f.state === 'curious') && dist < 125 && hookSpeed > 210) {
      w.spookFish(f, 'SPOOKED! HOOK MOVED TOO FAST NEAR THE FISH! ❗', 'فزعت السمكة! حركت الصنارة بسرعة مبالغ فيها! ❗');
      return;
    }

    // 3. FIGHT: Interactive line tension / reel minigame
    if (f.state === 'fight') {
      f.timer += dt;
      // Fish thrashes and pulls away
      const thrashX = Math.sin(t * 12 + f.phase) * (f.sp.speed * 1.3);
      f.x += (thrashX + (f.x > w.hookX ? 35 : -35)) * dt;
      f.y = clamp(f.y + Math.cos(t * 16) * 45 * dt, 95, 330);

      // Keeping hook close to fish reels it in; letting hook pull away snaps line!
      if (dist < 135) {
        f.reelProgress += dt / f.fightDuration;
        f.tension = Math.max(0.08, f.tension - dt * 0.35);
      } else {
        f.tension += dt * 0.75;
      }

      if (f.tension >= 1.0) {
        w.spookFish(f, '💥 LINE SNAPPED! TENSION HIT 100%! KEEP ROD CLOSER!', '💥 انقطع الخيط! زاد الشد عن الحد، خلك قريب من السمكة!');
        activeFish = null;
        return;
      }

      if (f.reelProgress >= 1.0) {
        w.catchFish(f);
        activeFish = null;
        return;
      }

      w.fishEls[i].setAttribute(
        'transform',
        `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${(Math.sin(t * 22) * 16).toFixed(1)}) scale(${(f.dir * f.sp.scale).toFixed(2)} ${f.sp.scale.toFixed(2)})`
      );
      return;
    }

    // 4. BITE: Tactical strike reflex window
    if (f.state === 'bite') {
      f.timer += dt;
      if (dist > 145) {
        w.spookFish(f, 'PULLED AWAY TOO HARD! FISH LET GO! ⚡', 'سحبت بعيد زيادة وفلتت السمكة! ⚡');
        activeFish = null;
        return;
      }
      f.x = lerp(f.x, w.hookX - f.dir * 18, Math.min(1, dt * 15));
      f.y = lerp(f.y, w.hookY + Math.sin(t * 26) * 5, Math.min(1, dt * 15));

      if (f.timer > f.sp.strikeWindow) {
        w.spookFish(
          f,
          '💨 MISSED STRIKE! CLICK FASTER NEXT TIME! ⚡',
          '💨 فلتت السمكة! اضغط أسرع في نافذة الغمزة! ⚡'
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

    // 5. NIBBLE: Testing bait with fake-outs before real bite
    if (f.state === 'nibble') {
      if (dist > 160) {
        f.state = 'swim';
        activeFish = null;
      } else {
        f.timer += dt;
        const targetStandOff = 20 + Math.sin(f.timer * 10) * 8;
        f.dir = dx >= 0 ? 1 : -1;
        f.x = lerp(f.x, w.hookX - f.dir * targetStandOff, Math.min(1, dt * 6));
        f.y = lerp(f.y, w.hookY + Math.cos(f.timer * 7) * 4, Math.min(1, dt * 6));

        // After tentative test period, commit or do another nibble
        if (f.timer >= 0.75) {
          f.nibbleCount++;
          if (f.nibbleCount >= f.targetNibbles) {
            f.state = 'bite';
            f.timer = 0;
            haptic(20);
            sound.play('fish-bite');
            w.ripples.push({ x: w.hookX, y: w.hookY, age: 0, color: '#FBBF24' });
            w.ripples.push({ x: w.hookX, y: 72, age: 0, color: '#FDE047' });
            w.setStatus(
              '⚡ STRIKE! CLICK OR TAP NOW TO HOOK! ⚡',
              '⚡ غمزت بقوة! اضغط الآن فوراً لتعليق السمكة! ⚡',
              'bite'
            );
          } else {
            f.timer = 0;
            sound.play('water-plop', { rate: 1.25, gain: 0.35 });
            w.setStatus(
              `👀 NIBBLE (${f.nibbleCount}/${f.targetNibbles})... WAIT FOR THE REAL STRIKE!`,
              `👀 نقرة خفيفة (${f.nibbleCount}/${f.targetNibbles})... لا تسحب حتى تغمز بقوة!`,
              ''
            );
          }
        }
        w.fishEls[i].setAttribute(
          'transform',
          `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(0) scale(${(f.dir * f.sp.scale).toFixed(2)} ${f.sp.scale.toFixed(2)})`
        );
        return;
      }
    }

    // 6. CURIOUS: Attracted by gentle twitching lure or bait boost
    if (f.state === 'curious') {
      // Boredom check: if lure sits motionless for > 4.5s, fish gets bored and leaves
      if (t - w.lastHookMoveTime > 4.5 && w.baitBoostTimer <= 0) {
        f.state = 'swim';
        activeFish = null;
        w.setStatus(
          'FISH LOST INTEREST IN STATIC LURE — TWITCH YOUR ROD! 🎣',
          'ملت السمكة من الصنارة الثابتة — حرّكها بخفة لتشجيعها! 🎣',
          ''
        );
      } else if (dist < 32) {
        f.state = 'nibble';
        f.timer = 0;
        f.nibbleCount = 0;
      } else {
        f.dir = dx >= 0 ? 1 : -1;
        f.x = lerp(f.x, w.hookX, Math.min(1, dt * 2.5));
        f.y = lerp(f.y, w.hookY, Math.min(1, dt * 2.5));
      }
      w.fishEls[i].setAttribute(
        'transform',
        `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(0) scale(${(f.dir * f.sp.scale).toFixed(2)} ${f.sp.scale.toFixed(2)})`
      );
      return;
    }

    // 7. SWIM: Standard lane patrol
    const inFront = (f.dir > 0 && dx > -20) || (f.dir < 0 && dx < 20) || w.baitBoostTimer > 0;
    const isTwitching = (hookSpeed > 18 && hookSpeed < 130) || w.baitBoostTimer > 0;
    const detectRadius = w.baitBoostTimer > 0 ? 230 : (120 - f.sp.caution * 30);

    if (!activeFish && inFront && isTwitching && dist < detectRadius && Math.abs(dy) < 60) {
      f.state = 'curious';
      f.timer = 0;
      activeFish = f;
      w.setStatus(
        'A FISH NOTICED YOUR LURE... KEEP IT STEADY! 👀',
        'سمكة انتبهت لحركة الطُعم... انتظر اقترابها! 👀',
        ''
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

  // Physical rod bend and line visuals
  const isFighting = Boolean(activeFish && activeFish.state === 'fight');
  const isBiting = Boolean(activeFish && activeFish.state === 'bite');
  const isNibbling = Boolean(activeFish && activeFish.state === 'nibble');
  const rodBendY = isFighting
    ? 22 + Math.sin(t * 30) * 8
    : isBiting
    ? 14 + Math.sin(t * 28) * 4
    : isNibbling
    ? 4 + Math.sin(t * 12) * 2
    : 0;
  const rodTipX = w.rodX;
  const rodTipY = w.rodY + rodBendY;

  if (w.rodEl) {
    w.rodEl.setAttribute('transform', `translate(${w.rodX.toFixed(1)} ${w.rodY.toFixed(1)})`);
    const shaftD = `M88 -34 Q 42 ${(-18 + rodBendY * 0.5).toFixed(1)} 0 ${rodBendY.toFixed(1)}`;
    if (w.rodShaftEl) w.rodShaftEl.setAttribute('d', shaftD);
    if (w.rodCoreEl) w.rodCoreEl.setAttribute('d', shaftD);
  }

  const bobberY = 72 + (isFighting ? 16 + Math.sin(t * 30) * 6 : isBiting ? 12 + Math.sin(t * 28) * 4 : isNibbling ? 3 + Math.sin(t * 12) * 2.5 : Math.sin(t * 2.5) * 1.8);
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

  // Fight HUD updates
  if (w.fightHudEl) {
    if (isFighting && activeFish) {
      w.fightHudEl.setAttribute('opacity', '1');
      w.fightHudEl.setAttribute('transform', `translate(${clamp(w.hookX, 85, 915).toFixed(1)} ${Math.max(90, w.hookY - 42).toFixed(1)})`);
      const reelPct = clamp(activeFish.reelProgress, 0, 1);
      const tensionPct = clamp(activeFish.tension, 0, 1);
      if (w.fightReelFillEl) w.fightReelFillEl.setAttribute('width', (reelPct * 124).toFixed(1));
      if (w.fightTensionFillEl) w.fightTensionFillEl.setAttribute('width', (tensionPct * 124).toFixed(1));
    } else {
      w.fightHudEl.setAttribute('opacity', '0');
    }
  }

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
  if (rippleMarkup !== w.lastRippleMarkup) {
    w.ripplesEl.innerHTML = rippleMarkup;
    w.lastRippleMarkup = rippleMarkup;
  }
}

export function initActWorlds() {
  if (worlds.initialized) return;
  worlds.initialized = true;
  worlds.act5 = buildAct5FishingWorld();

  if ('IntersectionObserver' in window && worlds.act5) {
    const visObserver = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].target === worlds.act5.sec) {
          worlds.act5.inView = entries[i].isIntersecting;
        }
      }
    }, { rootMargin: '250px 0px' });
    visObserver.observe(worlds.act5.sec);
  } else if (worlds.act5) {
    worlds.act5.inView = true;
  }
}

export function updateActWorlds(dt) {
  if (!worlds.initialized || !worlds.act5) return;
  updateAct5FishingWorld(worlds.act5, dt, state.time);
}
