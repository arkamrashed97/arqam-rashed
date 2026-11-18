/**
 * Audio manifest (mastered MP3 files in assets/audio/).
 *
 * Every file is EBU R128 loudness-matched and ear-comfort EQ'd on disk, and further
 * normalized in-place on decode in engine.js so all cues share a calm, uniform,
 * studio-grade perceived loudness that never fatigues the ear on speakers or earbuds.
 */
export const AMBIENT = [
  { act: 0, url: 'assets/audio/act1-luxor-wind.mp3', gain: 0.36 },
  { act: 1, url: 'assets/audio/act2-kinetic-garden.mp3', gain: 0.36 },
  { act: 2, url: 'assets/audio/act3-crystal-resonance.mp3', gain: 0.34 },
  { act: 3, url: 'assets/audio/act4-twilight-calm.mp3', gain: 0.36 },
  { act: 4, url: 'assets/audio/act5-dialogue-presence.mp3', gain: 0.35 }
];

export const SFX = {
  // Section button clicks (uniform, soft tactile tap)
  'btn-act1': { url: 'assets/audio/btn-act1.mp3', gain: 0.30, reverb: 0.06, cooldown: 150 },
  'btn-act2': { url: 'assets/audio/btn-act2.mp3', gain: 0.30, reverb: 0.06, cooldown: 150 },
  'btn-act3': { url: 'assets/audio/btn-act3.mp3', gain: 0.29, reverb: 0.08, cooldown: 150 },
  'btn-act4': { url: 'assets/audio/btn-act4.mp3', gain: 0.30, reverb: 0.07, cooldown: 150 },
  'btn-act5': { url: 'assets/audio/btn-act5.mp3', gain: 0.30, reverb: 0.06, cooldown: 150 },

  // Core UI interactions & Onboarding Gate (#lang-gate) vocabulary
  'gate-hover-en': { url: 'assets/audio/gate-hover-en.mp3', gain: 0.22, reverb: 0.08, cooldown: 260 },
  'gate-hover-ar': { url: 'assets/audio/gate-hover-ar.mp3', gain: 0.22, reverb: 0.08, cooldown: 260 },
  'gate-select-en': { url: 'assets/audio/gate-select-en.mp3', gain: 0.34, reverb: 0.14, cooldown: 500 },
  'gate-select-ar': { url: 'assets/audio/gate-select-ar.mp3', gain: 0.34, reverb: 0.14, cooldown: 500 },
  'toggle-on': { url: 'assets/audio/toggle-on.mp3', gain: 0.32, reverb: 0.06, cooldown: 200 },
  'toggle-off': { url: 'assets/audio/toggle-off.mp3', gain: 0.28, reverb: 0.05, cooldown: 200 },
  'hover-soft': { url: 'assets/audio/hover-soft.mp3', gain: 0.14, reverb: 0.03, cooldown: 220 },

  // Scene transition breaths
  'enter-act1': { url: 'assets/audio/enter-act1.mp3', gain: 0.28, reverb: 0.14, cooldown: 3600 },
  'enter-act2': { url: 'assets/audio/enter-act2.mp3', gain: 0.28, reverb: 0.14, cooldown: 3600 },
  'enter-act3': { url: 'assets/audio/enter-act3.mp3', gain: 0.26, reverb: 0.15, cooldown: 3600 },
  'enter-act4': { url: 'assets/audio/enter-act4.mp3', gain: 0.28, reverb: 0.14, cooldown: 3600 },
  'enter-act5': { url: 'assets/audio/enter-act5.mp3', gain: 0.28, reverb: 0.14, cooldown: 3600 },

  // Feature cues
  'modal-open': { url: 'assets/audio/modal-open.mp3', gain: 0.32, reverb: 0.10, cooldown: 280 },
  'modal-close': { url: 'assets/audio/modal-close.mp3', gain: 0.28, reverb: 0.08, cooldown: 280 },
  'cluster-select': { url: 'assets/audio/cluster-select.mp3', gain: 0.30, reverb: 0.10, cooldown: 180 },
  'copy-success': { url: 'assets/audio/copy-success.mp3', gain: 0.32, reverb: 0.12, cooldown: 350 },
  'form-success': { url: 'assets/audio/form-success.mp3', gain: 0.34, reverb: 0.14, cooldown: 600 },
  'form-error': { url: 'assets/audio/form-error.mp3', gain: 0.28, reverb: 0.06, cooldown: 450 },
  'download-ok': { url: 'assets/audio/download-ok.mp3', gain: 0.32, reverb: 0.10, cooldown: 400 },
  'type-tick': { url: 'assets/audio/type-tick.mp3', gain: 0.14, reverb: 0.02, cooldown: 85 },

  // Optional Act V Fishing mini-game cues (loaded only when CONFIG.enableFishingGame is true)
  'cast-line': { url: 'assets/audio/cast-line.mp3', gain: 0.30, reverb: 0.10, cooldown: 280 },
  'water-plop': { url: 'assets/audio/water-plop.mp3', gain: 0.28, reverb: 0.12, cooldown: 260 },
  'fish-bite': { url: 'assets/audio/fish-bite.mp3', gain: 0.34, reverb: 0.12, cooldown: 300 },
  'reel-in': { url: 'assets/audio/reel-in.mp3', gain: 0.30, reverb: 0.08, cooldown: 260 },
  'fish-catch': { url: 'assets/audio/fish-catch.mp3', gain: 0.36, reverb: 0.14, cooldown: 400 }
};

export const FISHING_SFX_KEYS = new Set(['cast-line', 'water-plop', 'fish-bite', 'reel-in', 'fish-catch']);

/** Button sound per act index (0..4). */
export const ACT_BUTTON_SFX = ['btn-act1', 'btn-act2', 'btn-act3', 'btn-act4', 'btn-act5'];
export const ACT_ENTER_SFX = ['enter-act1', 'enter-act2', 'enter-act3', 'enter-act4', 'enter-act5'];
