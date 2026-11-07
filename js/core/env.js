export const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
export const mobileQuery = window.matchMedia('(max-width: 900px)');
export const prefersReduced = reducedQuery.matches;
export function haptic(ms) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms || 8);
    }
  } catch (err) {}
}
