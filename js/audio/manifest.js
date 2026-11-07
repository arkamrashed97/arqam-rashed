/**
 * Audio manifest. Every file is a committed MP3 in assets/audio/ (generated once with
 * tools/audio/generate.mjs). URLs are literal strings on purpose: tools/build-single.mjs
 * swaps them for data URIs when it produces the single-file edition.
 *
 * gain      relative level after automatic loudness normalisation (1 = reference)
 * reverb    wet send for the procedural room (0 = dry)
 * cooldown  minimum ms between two plays of the same sound
 */
export const AMBIENT = [
  { act: 0, url: 'assets/audio/act1-luxor-wind.mp3', gain: 1.0 },
  { act: 1, url: 'assets/audio/act2-kinetic-garden.mp3', gain: 1.0 },
  { act: 2, url: 'assets/audio/act3-crystal-resonance.mp3', gain: 0.9 },
  { act: 3, url: 'assets/audio/act4-twilight-calm.mp3', gain: 1.0 },
  { act: 4, url: 'assets/audio/act5-dialogue-presence.mp3', gain: 0.95 }
];

export const SFX = {
  'btn-act1': { url: 'assets/audio/btn-act1.mp3', gain: 0.9, reverb: 0.10, cooldown: 60 },
  'btn-act2': { url: 'assets/audio/btn-act2.mp3', gain: 0.9, reverb: 0.10, cooldown: 60 },
  'btn-act3': { url: 'assets/audio/btn-act3.mp3', gain: 0.85, reverb: 0.22, cooldown: 60 },
  'btn-act4': { url: 'assets/audio/btn-act4.mp3', gain: 0.9, reverb: 0.14, cooldown: 60 },
  'btn-act5': { url: 'assets/audio/btn-act5.mp3', gain: 0.85, reverb: 0.08, cooldown: 60 },
  'gate-open': { url: 'assets/audio/gate-open.mp3', gain: 0.9, reverb: 0.3, cooldown: 400 },
  'toggle-on': { url: 'assets/audio/toggle-on.mp3', gain: 0.85, reverb: 0.12, cooldown: 120 },
  'toggle-off': { url: 'assets/audio/toggle-off.mp3', gain: 0.85, reverb: 0.12, cooldown: 120 },
  'hover-soft': { url: 'assets/audio/hover-soft.mp3', gain: 0.32, reverb: 0.04, cooldown: 110 },
  'enter-act1': { url: 'assets/audio/enter-act1.mp3', gain: 0.7, reverb: 0.3, cooldown: 1200 },
  'enter-act2': { url: 'assets/audio/enter-act2.mp3', gain: 0.7, reverb: 0.3, cooldown: 1200 },
  'enter-act3': { url: 'assets/audio/enter-act3.mp3', gain: 0.7, reverb: 0.35, cooldown: 1200 },
  'enter-act4': { url: 'assets/audio/enter-act4.mp3', gain: 0.7, reverb: 0.3, cooldown: 1200 },
  'enter-act5': { url: 'assets/audio/enter-act5.mp3', gain: 0.7, reverb: 0.3, cooldown: 1200 },
  'modal-open': { url: 'assets/audio/modal-open.mp3', gain: 0.85, reverb: 0.2, cooldown: 200 },
  'modal-close': { url: 'assets/audio/modal-close.mp3', gain: 0.8, reverb: 0.15, cooldown: 200 },
  'cluster-select': { url: 'assets/audio/cluster-select.mp3', gain: 0.85, reverb: 0.25, cooldown: 90 },
  'copy-success': { url: 'assets/audio/copy-success.mp3', gain: 0.85, reverb: 0.25, cooldown: 300 },
  'form-success': { url: 'assets/audio/form-success.mp3', gain: 0.9, reverb: 0.3, cooldown: 600 },
  'form-error': { url: 'assets/audio/form-error.mp3', gain: 0.8, reverb: 0.1, cooldown: 400 },
  'download-ok': { url: 'assets/audio/download-ok.mp3', gain: 0.85, reverb: 0.2, cooldown: 400 },
  'type-tick': { url: 'assets/audio/type-tick.mp3', gain: 0.3, reverb: 0.03, cooldown: 55 }
};

/** Button sound per act index (0..4). */
export const ACT_BUTTON_SFX = ['btn-act1', 'btn-act2', 'btn-act3', 'btn-act4', 'btn-act5'];
export const ACT_ENTER_SFX = ['enter-act1', 'enter-act2', 'enter-act3', 'enter-act4', 'enter-act5'];
