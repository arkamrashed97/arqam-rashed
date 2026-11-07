import { AMBIENT, SFX } from './manifest.js';

/**
 * Web Audio sound engine.
 *
 * Why Web Audio instead of <audio> elements: iOS ignores HTMLMediaElement.volume (no fades),
 * clone-and-play has audible latency on Android, and mp3 encoder padding makes `loop=true`
 * click. Here every ambience is decoded once and looped with an equal-power crossfade, every
 * sound passes through a gentle limiter, and everything starts synchronously inside the user
 * gesture so the first tap always works (no more "tap three times").
 *
 * Physical touches (all subtle, never harsh):
 *  - scroll velocity opens a low-pass on the ambience and swells it slightly (wind picks up)
 *  - UI sounds are panned by pointer position and detuned +-3% so repeats never sound identical
 *  - UI sounds feed a small procedural room reverb (decaying filtered noise impulse response)
 *  - a limiter on the master bus keeps peaks calm on earbuds and phone speakers
 */

const PREF_KEY = 'arqam-sound';
const CROSSFADE_CURVE_STEPS = 96;

function makeFadeCurves() {
  const fadeIn = new Float32Array(CROSSFADE_CURVE_STEPS);
  const fadeOut = new Float32Array(CROSSFADE_CURVE_STEPS);
  for (let i = 0; i < CROSSFADE_CURVE_STEPS; i++) {
    const x = i / (CROSSFADE_CURVE_STEPS - 1);
    fadeIn[i] = Math.sin(x * Math.PI * 0.5);
    fadeOut[i] = Math.cos(x * Math.PI * 0.5);
  }
  return { fadeIn, fadeOut };
}
const CURVES = makeFadeCurves();

/** Gapless looping voice: overlapping buffer sources joined by an equal-power crossfade. */
class LoopVoice {
  constructor(ctx, buffer, destination, crossfade = 2.6) {
    this.ctx = ctx;
    this.buffer = buffer;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(destination);
    this.fade = Math.min(crossfade, buffer.duration / 3);
    this.nextStart = 0;
    this.timer = 0;
    this.running = false;
    this.sources = new Set();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.nextStart = this.ctx.currentTime + 0.04;
    this.pump();
  }

  pump() {
    if (!this.running) return;
    const horizon = this.ctx.currentTime + this.fade + 1.5;
    while (this.nextStart < horizon) {
      this.spawn(this.nextStart);
      this.nextStart += this.buffer.duration - this.fade;
    }
    this.timer = window.setTimeout(() => this.pump(), 450);
  }

  spawn(at) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setValueCurveAtTime(CURVES.fadeIn, at, this.fade);
    gain.gain.setValueCurveAtTime(CURVES.fadeOut, at + this.buffer.duration - this.fade, this.fade);
    src.connect(gain);
    gain.connect(this.out);
    src.start(at);
    this.sources.add(src);
    src.onended = () => {
      this.sources.delete(src);
      try { gain.disconnect(); } catch (err) { /* already gone */ }
    };
  }

  stop(afterSeconds = 2.5) {
    if (!this.running) return;
    this.running = false;
    window.clearTimeout(this.timer);
    window.setTimeout(() => {
      this.sources.forEach((s) => { try { s.stop(); } catch (err) { /* ended */ } });
      this.sources.clear();
      try { this.out.disconnect(); } catch (err) { /* already gone */ }
    }, afterSeconds * 1000);
  }
}

/** One second of 8 kHz silence as a blob URL; keeps the iOS media session alive. */
let silentUrl = '';
function silentWavUrl() {
  if (silentUrl) return silentUrl;
  const rate = 8000;
  const samples = rate;
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  text(0, 'RIFF'); view.setUint32(4, 36 + samples * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, samples * 2, true);
  silentUrl = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
  return silentUrl;
}

function peakOf(buffer) {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
    }
  }
  return peak || 1;
}

function rmsOf(buffer) {
  const data = buffer.getChannelData(0);
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 8) { sum += data[i] * data[i]; n++; }
  return Math.sqrt(sum / Math.max(1, n)) || 0.05;
}

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.currentAct = 0;
    this.pointerPan = 0;
    this.energy = 0;
    this.listeners = new Set();
    this.buffers = new Map();
    this.loading = new Map();
    this.voices = new Map();
    this.lastPlay = new Map();
    this.silentEl = null;
    this.supported = Boolean(window.AudioContext || window.webkitAudioContext);
    this.preferenceOff = this.readPreference() === 'off';
    document.addEventListener('visibilitychange', () => this.onVisibility());
  }

  readPreference() {
    try { return localStorage.getItem(PREF_KEY); } catch (err) { return null; }
  }

  writePreference(on) {
    try { localStorage.setItem(PREF_KEY, on ? 'on' : 'off'); } catch (err) { /* optional */ }
  }

  onChange(cb) { this.listeners.add(cb); }
  emit() { this.listeners.forEach((cb) => cb(this.enabled)); }

  /** Must run synchronously inside a user gesture. */
  unlock() {
    if (!this.supported) return null;
    if (!this.ctx) this.build();
    const ctx = this.ctx;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    // Old iOS: a started (even silent) source unlocks the output route inside the gesture.
    try {
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start(0);
    } catch (err) { /* ignore */ }
    // iOS ignores Web Audio when the ring switch is on unless a media element is playing.
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
      if (!this.silentEl) {
        const el = document.createElement('audio');
        el.setAttribute('playsinline', '');
        el.loop = true;
        el.preload = 'auto';
        el.src = silentWavUrl();
        this.silentEl = el;
      }
      this.silentEl.play().catch(() => {});
    } catch (err) { /* ignore */ }
    return ctx;
  }

  build() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx({ latencyHint: 'interactive' });
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.knee.value = 14;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.006;
    limiter.release.value = 0.28;
    this.master.connect(limiter);
    limiter.connect(ctx.destination);

    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = 0.9;
    this.ambientTone = ctx.createBiquadFilter();
    this.ambientTone.type = 'lowpass';
    this.ambientTone.frequency.value = 3200;
    this.ambientTone.Q.value = 0.4;
    this.ambientSwell = ctx.createGain();
    this.ambientSwell.gain.value = 0.85;
    this.ambientBus.connect(this.ambientTone);
    this.ambientTone.connect(this.ambientSwell);
    this.ambientSwell.connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.85;
    this.sfxBus.connect(this.master);

    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 1;
    const convolver = ctx.createConvolver();
    convolver.buffer = this.makeImpulse(1.7);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.55;
    this.reverbSend.connect(convolver);
    convolver.connect(reverbReturn);
    reverbReturn.connect(this.master);
  }

  /** Procedural room: decaying noise, progressively darker with time. */
  makeImpulse(seconds) {
    const ctx = this.ctx;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c);
      let low = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const white = Math.random() * 2 - 1;
        const k = 0.15 + 0.7 * t;
        low += (white - low) * (1 - k);
        data[i] = low * Math.pow(1 - t, 2.6) * 0.9;
      }
    }
    return impulse;
  }

  async decode(url) {
    if (this.buffers.has(url)) return this.buffers.get(url);
    if (this.loading.has(url)) return this.loading.get(url);
    const job = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((data) => new Promise((resolve, reject) => this.ctx.decodeAudioData(data, resolve, reject)))
      .then((buffer) => { this.buffers.set(url, buffer); this.loading.delete(url); return buffer; })
      .catch((err) => { this.loading.delete(url); throw err; });
    this.loading.set(url, job);
    return job;
  }

  preloadSfx() {
    const run = () => Object.values(SFX).forEach((def) => this.decode(def.url).catch(() => {}));
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 2500 });
    else window.setTimeout(run, 1200);
  }

  preloadAmbient() {
    const run = () => AMBIENT.forEach((def) => this.decode(def.url).catch(() => {}));
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 });
    else window.setTimeout(run, 2500);
  }

  /** Turn sound on. Call from a user gesture. Idempotent. */
  enable() {
    if (!this.supported) return false;
    this.unlock();
    this.preferenceOff = false;
    this.writePreference(true);
    if (!this.enabled) {
      this.enabled = true;
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0.9, now, 0.12);
      this.startAct(this.currentAct, true);
      this.preloadSfx();
      this.preloadAmbient();
      this.emit();
    }
    return true;
  }

  disable(withCue = true) {
    if (!this.enabled) return;
    this.enabled = false;
    this.preferenceOff = true;
    this.writePreference(false);
    const ctx = this.ctx;
    if (withCue) this.playNow('toggle-off', { force: true });
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now + (withCue ? 0.4 : 0), 0.07);
    window.setTimeout(() => {
      if (!this.enabled && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
      if (!this.enabled && this.silentEl) this.silentEl.pause();
    }, withCue ? 1100 : 500);
    this.emit();
  }

  /** One tap flips the state immediately. Returns the new state. */
  toggle() {
    if (this.enabled) {
      this.disable(true);
    } else {
      this.enable();
      this.playNow('toggle-on', { force: true });
    }
    return this.enabled;
  }

  onVisibility() {
    if (!this.ctx) return;
    if (document.hidden) {
      if (this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
    } else if (this.enabled && this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => {});
    }
  }

  /* ---------------------------------------------------------------- ambience */
  async startAct(act, instant = false) {
    if (!this.ctx) return;
    const def = AMBIENT.find((a) => a.act === act) || AMBIENT[0];
    let voice = this.voices.get(act);
    if (!voice) {
      let buffer;
      try { buffer = await this.decode(def.url); } catch (err) { return; }
      if (!this.enabled || this.currentAct !== act) return;
      voice = new LoopVoice(this.ctx, buffer, this.ambientBus);
      voice.level = def.gain * Math.min(5, Math.max(0.3, 0.055 / rmsOf(buffer)));
      this.voices.set(act, voice);
    }
    // A previous act may still be looping silently (it changed while sound was off).
    this.voices.forEach((other, key) => {
      if (key === act) return;
      other.out.gain.cancelScheduledValues(this.ctx.currentTime);
      other.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
      other.stop(2);
      this.voices.delete(key);
    });
    voice.start();
    const now = this.ctx.currentTime;
    voice.out.gain.cancelScheduledValues(now);
    voice.out.gain.setTargetAtTime(voice.level, now, instant ? 0.9 : 0.8);
  }

  setAct(act, { announce = true } = {}) {
    if (act === this.currentAct) return;
    const previous = this.currentAct;
    this.currentAct = act;
    if (!this.enabled || !this.ctx) return;
    const prev = this.voices.get(previous);
    if (prev) {
      const now = this.ctx.currentTime;
      prev.out.gain.cancelScheduledValues(now);
      prev.out.gain.setTargetAtTime(0, now, 0.7);
      prev.stop(3.2);
      this.voices.delete(previous);
    }
    this.startAct(act);
    if (announce) this.playNow('enter-act' + (act + 1));
  }

  /** Scroll velocity (0..1) opens the tone filter and swells the ambience. */
  setEnergy(value) {
    if (!this.enabled || !this.ctx) return;
    const e = Math.min(1, Math.abs(value));
    if (Math.abs(e - this.energy) < 0.025) return;
    this.energy = e;
    const now = this.ctx.currentTime;
    this.ambientTone.frequency.setTargetAtTime(3200 + e * 6500, now, 0.28);
    this.ambientSwell.gain.setTargetAtTime(0.85 + e * 0.22, now, 0.35);
  }

  setPointer(nx) { this.pointerPan = Math.max(-1, Math.min(1, nx)); }

  /* ------------------------------------------------------------------- sfx */
  play(name, opts) { this.playNow(name, opts); }

  playNow(name, opts = {}) {
    if (!this.ctx || (!this.enabled && !opts.force)) return;
    const def = SFX[name];
    if (!def) return;
    const t = performance.now();
    const last = this.lastPlay.get(name) || 0;
    if (t - last < (def.cooldown || 0)) return;
    this.lastPlay.set(name, t);

    const buffer = this.buffers.get(def.url);
    if (!buffer) {
      this.decode(def.url).then(() => { if (this.enabled || opts.force) this.playNow(name, opts); }).catch(() => {});
      return;
    }
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = (opts.rate || 1) * (1 + (Math.random() - 0.5) * 0.06);

    const gain = ctx.createGain();
    const norm = Math.min(3, 0.5 / peakOf(buffer));
    gain.gain.value = (opts.gain || 1) * def.gain * norm;
    src.connect(gain);

    let tail = gain;
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = opts.pan != null ? opts.pan : this.pointerPan * 0.55;
      gain.connect(panner);
      tail = panner;
    }
    tail.connect(this.sfxBus);
    const send = ctx.createGain();
    send.gain.value = opts.reverb != null ? opts.reverb : def.reverb || 0;
    tail.connect(send);
    send.connect(this.reverbSend);

    src.onended = () => { try { src.disconnect(); gain.disconnect(); send.disconnect(); } catch (err) { /* gone */ } };
    src.start();
  }
}

export const sound = new SoundEngine();
