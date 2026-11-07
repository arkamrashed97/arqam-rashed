import { AMBIENT, SFX } from './manifest.js';

/**
 * Web Audio sound engine V4 — Balanced Perceptual Loudness & Spatial Physics.
 *
 * Every decoded AudioBuffer is analyzed in 20ms windows and normalized in-place using
 * gated active RMS + soft-knee transient taming so quiet effects (hover-soft, type-tick,
 * water-plop) are crystal clear while loud effects never spike or startle.
 */

const PREF_KEY = 'arqam-sound';
const CROSSFADE_CURVE_STEPS = 96;
const AMBIENT_URLS = new Set(AMBIENT.map((a) => a.url));

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

/**
 * In-place perceptual loudness normalizer.
 * Uses 20ms gated RMS (ignoring silent padding) + soft-knee tanh crest control so all
 * sounds sit in a tight, comfortable dynamic window on both phone and desktop speakers.
 */
function normalizeBufferInPlace(buffer, isAmbient = false) {
  const channels = buffer.numberOfChannels;
  const len = buffer.length;
  if (!len || !channels) return;

  const winSize = Math.max(256, Math.floor(buffer.sampleRate * 0.02));
  const winRmsList = [];
  let maxWinRms = 0;
  let peak = 0;

  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < len; i++) {
      const a = Math.abs(data[i]);
      if (a > peak) peak = a;
    }
  }

  const ch0 = buffer.getChannelData(0);
  for (let start = 0; start < len; start += winSize) {
    const end = Math.min(len, start + winSize);
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += ch0[i] * ch0[i];
    }
    const rms = Math.sqrt(sum / (end - start));
    winRmsList.push(rms);
    if (rms > maxWinRms) maxWinRms = rms;
  }

  if (peak < 1e-5 || maxWinRms < 1e-5) return;

  // Gate at 18% of max window RMS to exclude leading/trailing silence
  const gate = maxWinRms * 0.18;
  let gatedSumSq = 0;
  let gatedCount = 0;
  for (let i = 0; i < winRmsList.length; i++) {
    if (winRmsList[i] >= gate) {
      gatedSumSq += winRmsList[i] * winRmsList[i];
      gatedCount++;
    }
  }
  const activeRms = Math.sqrt(gatedSumSq / Math.max(1, gatedCount));

  // If crest factor is very high (spiky click with quiet body), gently soft-saturate first
  const crest = peak / Math.max(1e-4, activeRms);
  if (!isAmbient && crest > 4.0) {
    const drive = Math.min(2.6, (crest / 3.4) / peak);
    const normTanh = 1 / Math.tanh(drive * peak);
    peak = 0;
    for (let c = 0; c < channels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const s = Math.tanh(data[i] * drive) * normTanh * 0.85;
        data[i] = s;
        const a = Math.abs(s);
        if (a > peak) peak = a;
      }
    }
  }

  // Re-measure gated RMS after soft-knee crest taming
  let postSumSq = 0;
  let postCount = 0;
  for (let start = 0; start < len; start += winSize) {
    const end = Math.min(len, start + winSize);
    let sum = 0;
    for (let i = start; i < end; i++) sum += ch0[i] * ch0[i];
    const r = Math.sqrt(sum / (end - start));
    if (r >= maxWinRms * 0.15) {
      postSumSq += r * r;
      postCount++;
    }
  }
  const finalRms = Math.sqrt(postSumSq / Math.max(1, postCount)) || activeRms;

  const targetRms = isAmbient ? 0.088 : 0.185;
  const maxPeak = isAmbient ? 0.42 : 0.72;
  let scale = targetRms / Math.max(1e-4, finalRms);
  scale = Math.min(scale, maxPeak / Math.max(1e-4, peak), 12.0);

  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < len; i++) {
      data[i] *= scale;
    }
  }
}

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
    this.preloadQueue = [];
    this.preloadRunning = false;
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
    if (!this.preferenceOff && this.master) {
      this.master.gain.setTargetAtTime(0.95, ctx.currentTime, 0.02);
    }
    try {
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start(0);
    } catch (err) { /* ignore */ }
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

  /**
   * Lazy-preload onboarding gate cues:
   * Immediately decode only the 2 primary language selection cues so click feedback is instant,
   * then stagger hover cues one-by-one during idle time so initial page boot never stalls.
   */
  preloadGate() {
    if (!this.supported) return;
    if (!this.ctx) this.build();
    ['gate-select-en', 'gate-select-ar'].forEach((k) => {
      const def = SFX[k];
      if (def) this.decode(def.url).catch(() => {});
    });
    this.enqueuePreload([
      SFX['gate-hover-en']?.url,
      SFX['gate-hover-ar']?.url,
      SFX['gate-touch']?.url,
      SFX['gate-telemetry']?.url,
      SFX['gate-monolith']?.url,
      SFX['gate-coords']?.url
    ], 160);
  }

  build() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx({ latencyHint: 'interactive' });
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.95;

    // Master brickwall limiter + gentle glue compressor
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 10;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.22;
    this.master.connect(limiter);
    limiter.connect(ctx.destination);

    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = 0.72;
    this.ambientTone = ctx.createBiquadFilter();
    this.ambientTone.type = 'lowpass';
    this.ambientTone.frequency.value = 3400;
    this.ambientTone.Q.value = 0.4;
    this.ambientSwell = ctx.createGain();
    this.ambientSwell.gain.value = 0.85;
    this.ambientBus.connect(this.ambientTone);
    this.ambientTone.connect(this.ambientSwell);
    this.ambientSwell.connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.92;
    this.sfxBus.connect(this.master);

    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 1;
    const convolver = ctx.createConvolver();
    convolver.buffer = this.makeImpulse(1.5);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.42;
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
        data[i] = low * Math.pow(1 - t, 2.6) * 0.85;
      }
    }
    return impulse;
  }

  async decode(url) {
    if (this.buffers.has(url)) return this.buffers.get(url);
    if (this.loading.has(url)) return this.loading.get(url);
    const isAmbient = AMBIENT_URLS.has(url);
    const job = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((data) => new Promise((resolve, reject) => this.ctx.decodeAudioData(data, resolve, reject)))
      .then((buffer) => {
        normalizeBufferInPlace(buffer, isAmbient);
        this.buffers.set(url, buffer);
        this.loading.delete(url);
        return buffer;
      })
      .catch((err) => { this.loading.delete(url); throw err; });
    this.loading.set(url, job);
    return job;
  }

  /**
   * Staggered single-file background audio preloader.
   * Decodes at most 1 audio file per idle slice so the main thread and network
   * are never flooded with 39 simultaneous MP3 decode + RMS normalization jobs.
   */
  enqueuePreload(urls, stepDelayMs = 220) {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (url && !this.buffers.has(url) && !this.loading.has(url) && !this.preloadQueue.includes(url)) {
        this.preloadQueue.push(url);
      }
    }
    if (this.preloadRunning || !this.preloadQueue.length) return;
    this.preloadRunning = true;

    const pumpNext = () => {
      if (document.hidden) {
        this.preloadRunning = false;
        return;
      }
      const nextUrl = this.preloadQueue.shift();
      if (!nextUrl) {
        this.preloadRunning = false;
        return;
      }
      this.decode(nextUrl)
        .catch(() => {})
        .finally(() => {
          if (!this.preloadQueue.length) {
            this.preloadRunning = false;
            return;
          }
          window.setTimeout(() => {
            if ('requestIdleCallback' in window) {
              window.requestIdleCallback(pumpNext, { timeout: 1500 });
            } else {
              pumpNext();
            }
          }, stepDelayMs);
        });
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(pumpNext, { timeout: 1200 });
    } else {
      window.setTimeout(pumpNext, 300);
    }
  }

  preloadSfx() {
    // Prioritize core UI clicks/hovers first, then lazy-drip remaining act cues in the background
    const priorityKeys = [
      'hover-tick',
      'hover-soft',
      'ui-click',
      'nav-jump',
      'lang-switch',
      'enter-act2'
    ];
    const priorityUrls = priorityKeys.map((k) => SFX[k]?.url).filter(Boolean);
    const restUrls = Object.values(SFX).map((d) => d.url);
    this.enqueuePreload([...priorityUrls, ...restUrls], 240);
  }

  preloadAmbientForAct(act) {
    // Only pre-decode the next adjacent Act's ambient track during idle time
    const nextDef = AMBIENT.find((a) => a.act === act + 1);
    if (nextDef) {
      this.enqueuePreload([nextDef.url], 450);
    }
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
      this.master.gain.setTargetAtTime(0.95, now, 0.12);
      this.startAct(this.currentAct, true);
      this.preloadSfx();
      this.preloadAmbientForAct(this.currentAct);
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
    this.master.gain.setTargetAtTime(0, now + (withCue ? 0.35 : 0), 0.07);
    window.setTimeout(() => {
      if (!this.enabled && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
      if (!this.enabled && this.silentEl) this.silentEl.pause();
    }, withCue ? 1000 : 450);
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
      voice.level = def.gain;
      this.voices.set(act, voice);
    }
    this.voices.forEach((other, key) => {
      if (key === act) return;
      other.out.gain.cancelScheduledValues(this.ctx.currentTime);
      other.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.45);
      other.stop(2);
      this.voices.delete(key);
    });
    voice.start();
    const now = this.ctx.currentTime;
    voice.out.gain.cancelScheduledValues(now);
    voice.out.gain.setTargetAtTime(voice.level, now, instant ? 0.65 : 0.75);
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
      prev.out.gain.setTargetAtTime(0, now, 0.65);
      prev.stop(3.0);
      this.voices.delete(previous);
    }
    this.startAct(act);
    this.preloadAmbientForAct(act);
    if (announce) this.playNow('enter-act' + (act + 1));
  }

  /** Scroll velocity (0..1) opens the tone filter and swells the ambience. */
  setEnergy(value) {
    if (!this.enabled || !this.ctx) return;
    const e = Math.min(1, Math.abs(value));
    if (Math.abs(e - this.energy) < 0.025) return;
    this.energy = e;
    const now = this.ctx.currentTime;
    this.ambientTone.frequency.setTargetAtTime(3400 + e * 6200, now, 0.25);
    this.ambientSwell.gain.setTargetAtTime(0.85 + e * 0.18, now, 0.3);
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
    const cd = opts.cooldown != null ? opts.cooldown : (def.cooldown || 0);
    if (t - last < cd) return;
    this.lastPlay.set(name, t);

    const buffer = this.buffers.get(def.url);
    if (!buffer) {
      this.decode(def.url).then(() => { if (this.enabled || opts.force) this.playNow(name, opts); }).catch(() => {});
      return;
    }
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = (opts.rate || 1) * (1 + (Math.random() - 0.5) * 0.05);

    const gain = ctx.createGain();
    gain.gain.value = Math.min(1.35, (opts.gain || 1) * def.gain);
    src.connect(gain);

    let tail = gain;
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = opts.pan != null ? opts.pan : this.pointerPan * 0.6;
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
