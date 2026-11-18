import { finePointerQuery, haptic, mobileQuery, prefersReduced } from './env.js';
import { langText } from './lang.js';
import { scrollEngine, scrollToTarget } from './scroll.js';
import { refs, state } from './state.js';
import { clamp } from './utils.js';

/* Project media hover state */
refs.projectEls.forEach((el, index) => {
  el.addEventListener('pointerenter', () => { state.hoverProject = index; });
  el.addEventListener('pointerleave', () => {
    if (state.hoverProject === index) state.hoverProject = -1;
  });
});

/* Cluster selection */
export const CLUSTER_KEYS = [
  { label: 'cluster0Label', status: 'clusterStatus0' },
  { label: 'cluster1Label', status: 'clusterStatus1' },
  { label: 'cluster2Label', status: 'clusterStatus2' },
  { label: 'cluster3Label', status: 'clusterStatus3' }
];

export function setCluster(index) {
  const idx = clamp(Number(index) || 0, 0, CLUSTER_KEYS.length - 1);
  state.activeCluster = idx;
  refs.clusterBtns.forEach((btn, i) => {
    btn.setAttribute('aria-pressed', String(i === idx));
  });
  refs.clusterLabel.textContent = langText(CLUSTER_KEYS[idx].label);
  refs.clusterStatus.textContent = langText(CLUSTER_KEYS[idx].status);
}

refs.clusterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    haptic(8);
    setCluster(btn.dataset.cluster);
  });
});

/* Email copy and physical burst */
export function burstFrom(x, y) {
  if (!state.motion) return;
  state.burst = 1;
  if (typeof window.gsap === 'undefined') return;
  const amount = 22;
  for (let i = 0; i < amount; i++) {
    const bit = document.createElement('span');
    const size = 3 + Math.random() * 7;
    bit.className = 'burst-bit';
    bit.style.cssText = 'position:fixed;left:0;top:0;z-index:210;pointer-events:none;' +
      'width:' + size + 'px;height:' + size + 'px;background:var(--ink);display:block;';
    document.body.appendChild(bit);
    const angle = Math.random() * Math.PI * 2;
    const distance = 45 + Math.random() * 150;
    window.gsap.fromTo(bit,
      { x: x, y: y, scale: 1, rotation: 0, opacity: 1 },
      {
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance * 0.72 + 55,
        scale: 0.15,
        rotation: (Math.random() - 0.5) * 620,
        opacity: 0,
        duration: 0.8 + Math.random() * 0.65,
        ease: 'power3.out',
        onComplete: () => bit.remove()
      }
    );
  }
}

export function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
  ta.remove();
  return ok;
}

export let copyFeedback = 'copy';

export function renderCopyLabel() {
  if (!refs.copyAction) return;
  refs.copyAction.textContent = langText(copyFeedback);
}

export async function copyEmail() {
  const text = refs.emailCopy.dataset.copy;
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch (err) {
    ok = legacyCopy(text);
  }
  copyFeedback = ok ? 'copied' : 'select';
  refs.emailCopy.classList.toggle('is-copied', ok);
  renderCopyLabel();
  const r = refs.emailCopy.getBoundingClientRect();
  const isRtl = document.documentElement.dir === 'rtl';
  if (ok) burstFrom(isRtl ? r.left + 20 : r.left + r.width - 20, r.top + r.height / 2);
  window.setTimeout(() => {
    copyFeedback = 'copy';
    refs.emailCopy.classList.remove('is-copied');
    renderCopyLabel();
  }, 2600);
}

refs.emailCopy.addEventListener('click', (e) => { haptic(12); copyEmail(e); });

/* Live domain probe */
export let domainStatus = { css: 'checking', key: 'domainChecking' };

export function renderDomain() {
  refs.domainBtn.dataset.state = domainStatus.css;
  refs.domainText.textContent = langText(domainStatus.key);
}

export function setDomain(cssState, key) {
  domainStatus = { css: cssState, key };
  renderDomain();
}

export function probeDomain() {
  setDomain('checking', 'domainChecking');
  const host = window.location.hostname;
  if (host === 'arqamrashed.com' || host.endsWith('.arqamrashed.com')) {
    setDomain('live', 'domainOrigin');
    return;
  }
  let settled = false;
  const finish = (cssState, key) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    setDomain(cssState, key);
  };
  const img = new Image();
  const timer = window.setTimeout(() => finish('error', 'domainTimeout'), 6500);
  img.onload = () => finish('live', 'domainLive');
  img.onerror = () => finish('error', 'domainPending');
  img.src = 'https://arqamrashed.com/favicon.svg?probe=' + Date.now();
}

refs.domainBtn.addEventListener('click', probeDomain);

/* Motion preference and control */
export function applyMotion(on, announce) {
  state.motion = Boolean(on);
  refs.motionToggle.setAttribute('aria-pressed', String(state.motion));
  refs.motionToggle.setAttribute('data-sfx', state.motion ? 'toggle-off' : 'toggle-on');
  refs.motionLabel.textContent = langText(state.motion ? 'motionOn' : 'motionOff');
  document.body.classList.toggle('motion-off', !state.motion);
  if (!state.motion) state.velocitySmooth = 0;
  if (announce) {
    try {
      localStorage.setItem('arqam-motion', state.motion ? 'on' : 'off');
    } catch (err) { /* storage is optional */ }
  }
}

refs.motionToggle.addEventListener('click', () => { haptic(10); applyMotion(!state.motion, true); });

export function initMotionPreference() {
  let stored = null;
  try { stored = localStorage.getItem('arqam-motion'); } catch (err) { stored = null; }
  if (prefersReduced) applyMotion(false, false);
  else if (stored === 'off') applyMotion(false, false);
  else applyMotion(true, false);
}

let lastPortraitKey = '';
let portraitMotionCleared = false;

export function updateHeroPortrait() {
  const portrait = refs.heroPortrait;
  const frame = refs.heroPortraitFrame;
  if (!portrait || !frame) return;
  if (!state.motion) {
    if (!portraitMotionCleared) {
      portraitMotionCleared = true;
      lastPortraitKey = '';
      frame.style.removeProperty('--tilt-x');
      frame.style.removeProperty('--tilt-y');
      frame.style.removeProperty('--spot-x');
      frame.style.removeProperty('--spot-y');
      frame.style.removeProperty('--parallax-y');
      portrait.style.opacity = '';
    }
    return;
  }
  portraitMotionCleared = false;
  const canTilt = finePointerQuery.matches && !mobileQuery.matches && state.pointerMoved;
  const nx = canTilt ? clamp(state.pointerNX, -1, 1) : 0;
  const ny = canTilt ? clamp(state.pointerNY, -1, 1) : 0;
  const parallax = mobileQuery.matches ? 0 : clamp(-state.scroll * 0.12, -72, 0);
  const fade = state.ready ? clamp(1 - (state.m1 || 0) * 1.12, 0, 1) : 1;

  const ty = (nx * 7.5).toFixed(2);
  const tx = (-ny * 6.5).toFixed(2);
  const sx = (50 + nx * 24).toFixed(1);
  const sy = (42 + ny * 20).toFixed(1);
  const py = parallax.toFixed(1);
  const op = fade.toFixed(3);
  const key = `${ty}|${tx}|${sx}|${sy}|${py}|${op}`;
  if (key === lastPortraitKey) return;
  lastPortraitKey = key;

  frame.style.setProperty('--tilt-y', `${ty}deg`);
  frame.style.setProperty('--tilt-x', `${tx}deg`);
  frame.style.setProperty('--spot-x', `${sx}%`);
  frame.style.setProperty('--spot-y', `${sy}%`);
  frame.style.setProperty('--parallax-y', `${py}px`);
  if (state.ready) {
    portrait.style.opacity = op;
  }
}

/* Anchor navigation */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute('href');
  e.preventDefault();
  if (href === '#top' || href === '#') {
    if (scrollEngine.lenis) scrollEngine.lenis.scrollTo(0, { duration: 1.1 });
    else window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    return;
  }
  const target = document.querySelector(href);
  if (target) {
    scrollToTarget(target);
    if (link.classList.contains('skip')) target.focus({ preventScroll: true });
  }
});
