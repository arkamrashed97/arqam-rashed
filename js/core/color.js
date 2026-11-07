import { clamp, lerp } from './utils.js';

export const PALETTE_STOPS = [
  { m: 0.00, bg: '070708', ink: 'E2E2E5', accent: 'D4FF00', strong: 'D4FF00', muted: '8A8A90', line: 'E2E2E5', la: 0.18 },
  { m: 0.72, bg: '070708', ink: 'E2E2E5', accent: 'D4FF00', strong: 'D4FF00', muted: '8A8A90', line: 'E2E2E5', la: 0.18 },
  { m: 1.00, bg: 'F2EFE9', ink: '111111', accent: 'FF3B00', strong: 'B82800', muted: '6B665E', line: '111111', la: 0.16 },
  { m: 1.72, bg: 'F2EFE9', ink: '111111', accent: 'FF3B00', strong: 'B82800', muted: '6B665E', line: '111111', la: 0.16 },
  { m: 2.00, bg: '040814', ink: 'E8F7FF', accent: '00F0FF', strong: '00F0FF', muted: '8AA2B8', line: 'E8F7FF', la: 0.18 },
  { m: 2.72, bg: '040814', ink: 'E8F7FF', accent: '00F0FF', strong: '00F0FF', muted: '8AA2B8', line: 'E8F7FF', la: 0.18 },
  { m: 3.00, bg: '14100E', ink: 'FDFBF7', accent: 'FF8A2A', strong: 'FFA654', muted: 'C2B3A4', line: 'FDFBF7', la: 0.18 },
  { m: 3.72, bg: '14100E', ink: 'FDFBF7', accent: 'FF8A2A', strong: 'FFA654', muted: 'C2B3A4', line: 'FDFBF7', la: 0.18 },
  { m: 4.00, bg: '080B10', ink: 'F0F6FC', accent: '38EF7D', strong: '00E5FF', muted: '8B949E', line: '30363D', la: 0.20 }
];

export const hexToRgb = (hex) => {
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixRgb = (a, b, t) => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t))
];
export const rgbCss = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
export const rgbaCss = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a.toFixed(3)})`;

export function paletteAt(mix) {
  const m = clamp(mix, 0, 4);
  let i = 0;
  while (i < PALETTE_STOPS.length - 2 && m > PALETTE_STOPS[i + 1].m) i++;
  const a = PALETTE_STOPS[i];
  const b = PALETTE_STOPS[i + 1];
  const span = Math.max(0.0001, b.m - a.m);
  const t = clamp((m - a.m) / span, 0, 1);
  const ease = t * t * (3 - 2 * t);
  const bg = mixRgb(hexToRgb(a.bg), hexToRgb(b.bg), ease);
  const ink = mixRgb(hexToRgb(a.ink), hexToRgb(b.ink), ease);
  const accent = mixRgb(hexToRgb(a.accent), hexToRgb(b.accent), ease);
  const strong = mixRgb(hexToRgb(a.strong), hexToRgb(b.strong), ease);
  const muted = mixRgb(hexToRgb(a.muted), hexToRgb(b.muted), ease);
  const line = mixRgb(hexToRgb(a.line), hexToRgb(b.line), ease);
  const la = lerp(a.la, b.la, ease);
  return { bg, ink, accent, strong, muted, line, la };
}

export const palette = paletteAt(0);
export const paletteCss = { bg: '', ink: '', accent: '', strong: '', muted: '', line: '' };
