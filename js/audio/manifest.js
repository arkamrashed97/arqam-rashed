/**
 * Audio manifest (31 committed MP3 files in assets/audio/).
 *
 * Every buffer is perceptually loud-normalized in-place on decode (gated 20ms active RMS +
 * soft-knee crest control in engine.js), so `gain` here is a true perceptual mix weight
 * between 0.55 and 0.92 — no sound is ever buried/inaudible and no sound is ever harsh.
 */
export const AMBIENT = [
  { act: 0, url: 'assets/audio/act1-luxor-wind.mp3', gain: 0.55 },
  { act: 1, url: 'assets/audio/act2-kinetic-garden.mp3', gain: 0.55 },
  { act: 2, url: 'assets/audio/act3-crystal-resonance.mp3', gain: 0.52 },
  { act: 3, url: 'assets/audio/act4-twilight-calm.mp3', gain: 0.55 },
  { act: 4, url: 'assets/audio/act5-dialogue-presence.mp3', gain: 0.54 }
];

export const SFX = {
  // Section button clicks
  'btn-act1': { url: 'assets/audio/btn-act1.mp3', gain: 0.48, reverb: 0.08, cooldown: 80 },
  'btn-act2': { url: 'assets/audio/btn-act2.mp3', gain: 0.48, reverb: 0.08, cooldown: 80 },
  'btn-act3': { url: 'assets/audio/btn-act3.mp3', gain: 0.46, reverb: 0.12, cooldown: 80 },
  'btn-act4': { url: 'assets/audio/btn-act4.mp3', gain: 0.48, reverb: 0.10, cooldown: 80 },
  'btn-act5': { url: 'assets/audio/btn-act5.mp3', gain: 0.48, reverb: 0.08, cooldown: 80 },

  // Physical pointer / touch interactions per act
  'touch-act1': { url: 'assets/audio/touch-act1.mp3', gain: 0.42, reverb: 0.12, cooldown: 400 },
  'touch-act2': { url: 'assets/audio/touch-act2.mp3', gain: 0.42, reverb: 0.10, cooldown: 400 },
  'touch-act3': { url: 'assets/audio/touch-act3.mp3', gain: 0.40, reverb: 0.14, cooldown: 400 },
  'touch-act4': { url: 'assets/audio/touch-act4.mp3', gain: 0.44, reverb: 0.14, cooldown: 400 },

  // Core UI interactions & Onboarding Gate (#lang-gate) distinct vocabulary
  'gate-open': { url: 'assets/audio/gate-open.mp3', gain: 0.55, reverb: 0.16, cooldown: 400 },
  'gate-hover-en': { url: 'assets/audio/gate-hover-en.mp3', gain: 0.42, reverb: 0.12, cooldown: 180 },
  'gate-hover-ar': { url: 'assets/audio/gate-hover-ar.mp3', gain: 0.42, reverb: 0.12, cooldown: 180 },
  'gate-select-en': { url: 'assets/audio/gate-select-en.mp3', gain: 0.58, reverb: 0.22, cooldown: 400 },
  'gate-select-ar': { url: 'assets/audio/gate-select-ar.mp3', gain: 0.58, reverb: 0.22, cooldown: 400 },
  'gate-telemetry': { url: 'assets/audio/gate-telemetry.mp3', gain: 0.38, reverb: 0.10, cooldown: 250 },
  'gate-monolith': { url: 'assets/audio/gate-monolith.mp3', gain: 0.42, reverb: 0.14, cooldown: 300 },
  'gate-coords': { url: 'assets/audio/gate-coords.mp3', gain: 0.38, reverb: 0.10, cooldown: 250 },
  'gate-touch': { url: 'assets/audio/gate-touch.mp3', gain: 0.42, reverb: 0.12, cooldown: 220 },
  'toggle-on': { url: 'assets/audio/toggle-on.mp3', gain: 0.52, reverb: 0.08, cooldown: 180 },
  'toggle-off': { url: 'assets/audio/toggle-off.mp3', gain: 0.48, reverb: 0.08, cooldown: 180 },
  'hover-soft': { url: 'assets/audio/hover-soft.mp3', gain: 0.22, reverb: 0.04, cooldown: 140 },

  // Scene transition breaths
  'enter-act1': { url: 'assets/audio/enter-act1.mp3', gain: 0.45, reverb: 0.18, cooldown: 1600 },
  'enter-act2': { url: 'assets/audio/enter-act2.mp3', gain: 0.45, reverb: 0.18, cooldown: 1600 },
  'enter-act3': { url: 'assets/audio/enter-act3.mp3', gain: 0.42, reverb: 0.20, cooldown: 1600 },
  'enter-act4': { url: 'assets/audio/enter-act4.mp3', gain: 0.45, reverb: 0.18, cooldown: 1600 },
  'enter-act5': { url: 'assets/audio/enter-act5.mp3', gain: 0.45, reverb: 0.18, cooldown: 1600 },

  // Feature cues
  'modal-open': { url: 'assets/audio/modal-open.mp3', gain: 0.52, reverb: 0.14, cooldown: 250 },
  'modal-close': { url: 'assets/audio/modal-close.mp3', gain: 0.48, reverb: 0.10, cooldown: 250 },
  'cluster-select': { url: 'assets/audio/cluster-select.mp3', gain: 0.48, reverb: 0.14, cooldown: 120 },
  'copy-success': { url: 'assets/audio/copy-success.mp3', gain: 0.54, reverb: 0.16, cooldown: 300 },
  'form-success': { url: 'assets/audio/form-success.mp3', gain: 0.56, reverb: 0.18, cooldown: 600 },
  'form-error': { url: 'assets/audio/form-error.mp3', gain: 0.50, reverb: 0.08, cooldown: 400 },
  'download-ok': { url: 'assets/audio/download-ok.mp3', gain: 0.54, reverb: 0.14, cooldown: 400 },
  'type-tick': { url: 'assets/audio/type-tick.mp3', gain: 0.22, reverb: 0.02, cooldown: 65 },

  // Act V Fishing mini-game cues
  'cast-line': { url: 'assets/audio/cast-line.mp3', gain: 0.48, reverb: 0.12, cooldown: 260 },
  'water-plop': { url: 'assets/audio/water-plop.mp3', gain: 0.46, reverb: 0.14, cooldown: 220 },
  'fish-bite': { url: 'assets/audio/fish-bite.mp3', gain: 0.62, reverb: 0.15, cooldown: 260 },
  'reel-in': { url: 'assets/audio/reel-in.mp3', gain: 0.48, reverb: 0.10, cooldown: 220 },
  'fish-catch': { url: 'assets/audio/fish-catch.mp3', gain: 0.64, reverb: 0.20, cooldown: 380 }
};

/** Button sound per act index (0..4). */
export const ACT_BUTTON_SFX = ['btn-act1', 'btn-act2', 'btn-act3', 'btn-act4', 'btn-act5'];
export const ACT_TOUCH_SFX = ['touch-act1', 'touch-act2', 'touch-act3', 'touch-act4', 'water-plop'];
export const ACT_ENTER_SFX = ['enter-act1', 'enter-act2', 'enter-act3', 'enter-act4', 'enter-act5'];
