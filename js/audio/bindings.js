import { sound } from './engine.js';
import { ACT_BUTTON_SFX } from './manifest.js';
import { t } from '../i18n/i18n.js';
import { haptic } from '../core/env.js';

/**
 * Wires the sound engine to the page: header toggle, click/hover/typing cues,
 * pointer panning and first-gesture auto start.
 *
 * Cue selection for clicks, in order:
 *   1. nearest [data-sfx="name"] ancestor  ("none" silences the click)
 *   2. the button sound of the section the element lives in (stone, bamboo, crystal, water, haptic)
 *   3. the button sound of the act currently on screen (header, nav, modal)
 */
const SECTION_ACT = [
  ['#act-1', 0],
  ['#work', 1],
  ['#architecture', 2],
  ['#contact', 3],
  ['#inquiry', 4],
  ['.site-footer', 4]
];

function actOf(el) {
  for (const [selector, act] of SECTION_ACT) {
    if (el.closest(selector)) return act;
  }
  return null;
}

function renderToggle() {
  const btn = document.getElementById('sound-toggle');
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(sound.enabled));
  btn.classList.toggle('is-active', sound.enabled);
  btn.setAttribute('aria-label', t('soundAria'));
  const label = document.getElementById('sound-toggle-text');
  if (label) label.textContent = t(sound.enabled ? 'soundOn' : 'soundOff');
}

export function initSoundUI() {
  const btn = document.getElementById('sound-toggle');
  if (btn) {
    if (!sound.supported) {
      btn.hidden = true;
    } else {
      // Single tap: the engine unlocks and flips state synchronously inside this gesture.
      btn.addEventListener('click', () => {
        haptic(10);
        sound.toggle();
      });
    }
  }
  sound.onChange(renderToggle);
  window.addEventListener('arqam:lang', renderToggle);
  renderToggle();

  document.addEventListener('click', (event) => {
    if (!sound.enabled || !(event.target instanceof Element)) return;
    const target = event.target.closest('[data-sfx], button, a[href], [role="button"], select, label[for]');
    if (!target) return;
    const tagged = target.closest('[data-sfx]');
    const cue = tagged ? tagged.dataset.sfx : '';
    if (cue === 'none') return;
    if (cue) { sound.play(cue); return; }
    const act = actOf(target);
    sound.play(ACT_BUTTON_SFX[act == null ? sound.currentAct : act]);
  }, true);

  document.addEventListener('pointerover', (event) => {
    if (!sound.enabled || event.pointerType !== 'mouse' || !(event.target instanceof Element)) return;
    const target = event.target.closest('a[href], button, .cluster, [data-cursor]');
    if (!target || (event.relatedTarget && target.contains(event.relatedTarget))) return;
    if (target.closest('[data-sfx="none"]')) return;
    sound.play('hover-soft');
  }, { passive: true });

  document.addEventListener('input', (event) => {
    if (!sound.enabled || !(event.target instanceof Element)) return;
    if (event.target.matches('#inquiry-form input, #inquiry-form textarea')) sound.play('type-tick');
  });

  window.addEventListener('pointermove', (event) => {
    sound.setPointer((event.clientX / window.innerWidth) * 2 - 1);
  }, { passive: true });
}

/**
 * Sound starts by itself on the first real gesture (language choice for new visitors, any
 * tap/click/key for returning ones) unless the visitor switched it off before.
 * pointerup/touchend/click are what mobile browsers accept as activation. pointerdown is not.
 */
export function armAutoStart() {
  if (!sound.supported || sound.preferenceOff) return;
  const events = ['pointerup', 'touchend', 'click', 'mousedown', 'keydown'];
  const handler = (event) => {
    if (event.target instanceof Element && event.target.closest('#sound-toggle')) return;
    if (event.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(event.key)) return;
    events.forEach((name) => window.removeEventListener(name, handler, true));
    sound.enable();
  };
  events.forEach((name) => window.addEventListener(name, handler, { capture: true, passive: true }));
}
