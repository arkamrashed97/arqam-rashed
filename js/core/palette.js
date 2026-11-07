import { palette, paletteAt, paletteCss, rgbCss, rgbaCss } from './color.js';
import { mobileQuery } from './env.js';
import { refs, state } from './state.js';
import { clamp } from './utils.js';
import { syncScenePalette } from '../gl/palette-sync.js';

/**
 * Palette + scroll-reactive chrome.
 *
 * Performance notes (this runs every frame while scrolling between acts):
 *  - Changing a custom property on <html> invalidates style for the whole document, so the CSS
 *    variables are written at ~20 Hz (~11 Hz on phones) with a trailing write. The WebGL uniforms
 *    still follow every frame, so the scene colours stay perfectly smooth.
 *  - The velocity skew is applied directly to the four skew targets instead of a root variable,
 *    which used to restyle the entire page on every scroll frame.
 */
const CSS_INTERVAL_DESKTOP = 50;
const CSS_INTERVAL_MOBILE = 90;
const root = document.documentElement;

let lastPaletteKey = '';
let cssDirty = false;
let lastCssWrite = 0;
let lastSkew = 0;
let lastProgress = -1;

function writeCssVars() {
  root.style.setProperty('--bg', paletteCss.bg);
  root.style.setProperty('--ink', paletteCss.ink);
  root.style.setProperty('--accent', paletteCss.accent);
  root.style.setProperty('--accent-strong', paletteCss.strong);
  root.style.setProperty('--muted', paletteCss.muted);
  root.style.setProperty('--line', paletteCss.line);
  refs.body.style.backgroundColor = paletteCss.bg;
}

export function updatePalette(now = performance.now()) {
  const p = paletteAt(state.actMix);
  const key = p.bg.join() + '|' + p.ink.join() + '|' + p.accent.join() + '|' + p.strong.join() + '|' + p.muted.join() + '|' + p.line.join();
  if (key !== lastPaletteKey) {
    lastPaletteKey = key;
    Object.assign(palette, p);
    paletteCss.bg = rgbCss(p.bg);
    paletteCss.ink = rgbCss(p.ink);
    paletteCss.accent = rgbCss(p.accent);
    paletteCss.strong = rgbCss(p.strong);
    paletteCss.muted = rgbCss(p.muted);
    paletteCss.line = rgbaCss(p.line, p.la);
    syncScenePalette();
    cssDirty = true;
  }
  const interval = mobileQuery.matches ? CSS_INTERVAL_MOBILE : CSS_INTERVAL_DESKTOP;
  if (cssDirty && now - lastCssWrite >= interval) {
    cssDirty = false;
    lastCssWrite = now;
    writeCssVars();
  }

  const skew = clamp(state.velocitySmooth * 1.05, -2.2, 2.2);
  if (Math.abs(skew - lastSkew) > 0.02) {
    lastSkew = skew;
    const value = 'skewY(' + skew.toFixed(2) + 'deg)';
    for (let i = 0; i < refs.skewTargets.length; i++) refs.skewTargets[i].style.transform = value;
  }

  const progress = clamp(state.scroll / state.scrollMax, 0, 1);
  if (refs.progress && Math.abs(progress - lastProgress) > 0.0003) {
    lastProgress = progress;
    refs.progress.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
  }
}
