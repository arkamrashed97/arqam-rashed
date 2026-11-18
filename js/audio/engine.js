import { AMBIENT, FISHING_SFX_KEYS, SFX } from './manifest.js';
import { CONFIG } from '../config.js';
import { assetPath } from '../core/utils.js';

/**
 * Web Audio sound engine V5 — measured loudness balance.
 *
 * Source files range from -60 dB to -9 dB active RMS, so every decoded AudioBuffer is
 * re-leveled in place: gated active RMS (50ms windows, silence excluded) is brought to a
 * shared target, bounded only by a clean peak ceiling. No waveshaping is applied (the old
 * tanh stage added audible distortion). Bright/harsh sources get a small loudness discount
 * because high-frequency energy is perceived louder at equal RMS. Short fades remove clicks.
 */

const PREF_KEY = 'arqam-sound';
const CROSSFADE_CURVE_STEPS = 128;
const AMBIENT_URLS = new Set(AMBIENT.map((a) => a.url));
const MAX_LATE_PLAY_MS = 260;

// Calibrated master & bus levels for a calm, luxury web audio experience
const MASTER_GAIN = 0.46;
const AMBIENT_BUS_GAIN = 0.28;
const SFX_BUS_GAIN = 0.36;
const IDLE_DUCK_MS = 14000;
const IDLE_SLEEP_MS = 30000;

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

function softCeiling(x, ceiling) {
  const ax = x < 0 ? -x : x;
  const knee = ceiling * 0.72;
  if (ax <= knee) return x;
  const sign = x < 0 ? -1 : 1;
  const span = ceiling - knee;
  const excess = (ax - knee) / Math.max(1e-6, span);
  return sign * (knee + span * (excess / (1 + excess)));
}

function normalizeBufferInPlace(buffer, isAmbient = false) {
  const channels = buffer.numberOfChannels;
  const len = buffer.length;
  if (!len || !channels) return;
  const rate = buffer.sampleRate;
  const chData = [];
  for (let c = 0; c < channels; c++) chData.push(buffer.getChannelData(c));

  // Peak + mono-sum energy per 50ms window + first-difference energy (brightness proxy)
  const win = Math.max(512, Math.floor(rate * 0.05));
  const winRms = [];
  let peak = 0;
  let maxWin = 0;
  let sumSq = 0;
  let diffSq = 0;
  let prev = 0;
  for (let start = 0; start < len; start += win) {
    const end = Math.min(len, start + win);
    let ws = 0;
    for (let i = start; i < end; i++) {
      let s = 0;
      for (let c = 0; c < channels; c++) {
        const v = chData[c][i];
        const a = v < 0 ? -v : v;
        if (a > peak) peak = a;
        s += v;
      }
      s /= channels;
      ws += s * s;
      const d = s - prev;
      diffSq += d * d;
      prev = s;
    }
    sumSq += ws;
    const r = Math.sqrt(ws / (end - start));
    winRms.push(r);
    if (r > maxWin) maxWin = r;
  }
  if (peak < 1e-6 || maxWin < 1e-6) return;

  const gate = maxWin * 0.22;
  let gSum = 0;
  let gCount = 0;
  for (let i = 0; i < winRms.length; i++) {
    if (winRms[i] >= gate) {
      gSum += winRms[i] * winRms[i];
      gCount++;
    }
  }
  const active = Math.sqrt(gSum / Math.max(1, gCount));
  const brightness = Math.sqrt(diffSq / len) / Math.max(1e-6, Math.sqrt(sumSq / len));

  // Calm, matched target RMS with Fletcher-Munson high-frequency comfort discount
  let target = isAmbient ? 0.042 : 0.075;
  if (brightness > 0.34) {
    target *= Math.max(0.52, 1 - (brightness - 0.34) * 0.65);
  }
  const ceiling = isAmbient ? 0.24 : 0.38;
  const scale = Math.min(target / active, (ceiling * 1.15) / peak, 8.0);

  // Click-free raised-cosine edges: 8ms fade-in, 36ms fade-out on SFX; 60ms on ambient
  const fadeIn = isAmbient
    ? Math.min(len, Math.floor(rate * 0.06))
    : Math.min(len, Math.floor(rate * 0.008));
  const fadeOut = isAmbient
    ? Math.min(len, Math.floor(rate * 0.06))
    : Math.min(len, Math.floor(rate * 0.036));
  for (let c = 0; c < channels; c++) {
    const data = chData[c];
    for (let i = 0; i < len; i++) {
      let g = scale;
      if (i < fadeIn) {
        const u = i / fadeIn;
        g *= 0.5 - 0.5 * Math.cos(u * Math.PI);
      }
      const fromEnd = len - 1 - i;
      if (fromEnd < fadeOut) {
        const u = fromEnd / fadeOut;
        g *= 0.5 - 0.5 * Math.cos(u * Math.PI);
      }
      data[i] = softCeiling(data[i] * g, ceiling);
    }
  }
}

/** Gapless looping voice: overlapping buffer sources joined by an equal-power crossfade. */
class LoopVoice {
  constructor(ctx, buffer, destination, crossfade = 3.2) {
    this.ctx = ctx;
    this.buffer = buffer;
    this.out = ctx.createGain();
    this.out.gain.value = 0.0001;
    this.out.connect(destination);
    this.fade = Math.min(crossfade, buffer.duration / 2.8);
    this.nextStart = 0;
    this.timer = 0;
    this.stopTimer = 0;
    this.running = false;
    this.sources = new Set();
  }

  start() {
    window.clearTimeout(this.stopTimer);
    this.stopTimer = 0;
    if (this.running && this.nextStart > this.ctx.currentTime) return;
    this.running = true;
    this.nextStart = Math.max(this.ctx.currentTime + 0.05, this.nextStart || 0);
    this.pump();
  }

  pump() {
    if (!this.running) return;
    const now = this.ctx.currentTime;
    if (this.nextStart < now + 0.02) {
      this.nextStart = now + 0.04;
    }
    const horizon = now + this.fade + 1.6;
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
    try {
      gain.gain.setValueCurveAtTime(CURVES.fadeIn, at, this.fade);
      gain.gain.setValueCurveAtTime(CURVES.fadeOut, at + this.buffer.duration - this.fade, this.fade);
    } catch (err) {
      gain.gain.setValueAtTime(1, at);
    }
    src.connect(gain);
    gain.connect(this.out);
    src.start(at);
    this.sources.add(src);
    src.onended = () => {
      this.sources.delete(src);
      try { gain.disconnect(); } catch (err) { /* already gone */ }
    };
  }

  stop(afterSeconds = 2.8) {
    this.running = false;
    window.clearTimeout(this.timer);
    this.timer = 0;
    window.clearTimeout(this.stopTimer);
    this.stopTimer = window.setTimeout(() => {
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
    this.suspendTimer = 0;
    this.ambientDelayTimer = 0;
    this.idleTimer = 0;
    this.lastActivity = performance.now();
    this.lastActCueAt = 0;
    this.idleStage = 0; // 0 = full active, 1 = ducked whisper, 2 = faded sleep
    this.supported = Boolean(window.AudioContext || window.webkitAudioContext);
    this.preferenceOff = this.readPreference() === 'off';
    document.addEventListener('visibilitychange', () => this.onVisibility());
    window.addEventListener('pagehide', () => this.onPageHide());
    window.addEventListener('pageshow', () => this.onPageShow());
    window.addEventListener('blur', () => {
      if (window.matchMedia('(max-width: 900px)').matches) this.onPageHide();
    });
    window.addEventListener('focus', () => {
      if (window.matchMedia('(max-width: 900px)').matches) this.onPageShow();
    });
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
    window.clearTimeout(this.suspendTimer);
    this.suspendTimer = 0;
    if (!this.ctx) this.build();
    const ctx = this.ctx;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
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
      if (!this.preferenceOff) {
        this.silentEl.play().catch(() => {});
      }
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
      SFX['gate-hover-ar']?.url
    ], 220);
  }

  build() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx({ latencyHint: 'interactive' });
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.0001;

    // Ear-comfort Fletcher-Munson presence dip (2.9 kHz -3.5 dB) + warm master ceiling
    const earComfort = ctx.createBiquadFilter();
    earComfort.type = 'peaking';
    earComfort.frequency.value = 2950;
    earComfort.Q.value = 1.05;
    earComfort.gain.value = -3.5;

    const highWarmth = ctx.createBiquadFilter();
    highWarmth.type = 'highshelf';
    highWarmth.frequency.value = 3800;
    highWarmth.gain.value = -4.0;

    // Master brickwall limiter + gentle glue compressor
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.knee.value = 12;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.25;

    this.master.connect(earComfort);
    earComfort.connect(highWarmth);
    highWarmth.connect(limiter);
    limiter.connect(ctx.destination);

    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = AMBIENT_BUS_GAIN;
    this.ambientTone = ctx.createBiquadFilter();
    this.ambientTone.type = 'lowpass';
    this.ambientTone.frequency.value = 2100;
    this.ambientTone.Q.value = 0.35;
    this.ambientSwell = ctx.createGain();
    this.ambientSwell.gain.value = 0.82;
    this.ambientBus.connect(this.ambientTone);
    this.ambientTone.connect(this.ambientSwell);
    this.ambientSwell.connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = SFX_BUS_GAIN;
    this.sfxTone = ctx.createBiquadFilter();
    this.sfxTone.type = 'lowpass';
    this.sfxTone.frequency.value = 2350;
    this.sfxTone.Q.value = 0.4;
    this.sfxBus.connect(this.sfxTone);
    this.sfxTone.connect(this.master);

    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.72;
    const convolver = ctx.createConvolver();
    convolver.buffer = this.makeImpulse(1.4);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.18;
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
    const job = fetch(assetPath(url))
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
      'toggle-on',
      'toggle-off',
      'hover-soft',
      'btn-act1',
      'modal-open',
      'modal-close',
      'copy-success'
    ];
    const priorityUrls = priorityKeys.map((k) => SFX[k]?.url).filter(Boolean);
    const restUrls = Object.entries(SFX)
      .filter(([key]) => CONFIG.enableFishingGame || !FISHING_SFX_KEYS.has(key))
      .map(([, d]) => d.url);
    this.enqueuePreload([...priorityUrls, ...restUrls], 260);
  }

  preloadAmbientForAct(act) {
    // Only pre-decode the next adjacent Act's ambient track during idle time
    const nextDef = AMBIENT.find((a) => a.act === act + 1);
    if (nextDef) {
      this.enqueuePreload([nextDef.url], 450);
    }
  }

  stopAllVoices(fadeSec = 0.45) {
    if (!this.ctx) {
      this.voices.clear();
      return;
    }
    const now = this.ctx.currentTime;
    this.voices.forEach((voice) => {
      try {
        voice.out.gain.cancelScheduledValues(now);
        voice.out.gain.setTargetAtTime(0.0001, now, Math.max(0.06, fadeSec * 0.28));
        voice.stop(fadeSec + 0.15);
      } catch (err) { /* ignore */ }
    });
    this.voices.clear();
  }

  startIdleMonitor() {
    if (this.idleTimer) return;
    this.idleTimer = window.setInterval(() => this.checkIdle(), 2000);
  }

  stopIdleMonitor() {
    if (!this.idleTimer) return;
    window.clearInterval(this.idleTimer);
    this.idleTimer = 0;
  }

  /** Call on user scroll, pointer move, touch, or click to keep soundscape responsive & awake. */
  touchActivity() {
    this.lastActivity = performance.now();
    if (!this.enabled || !this.ctx || document.hidden) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.idleStage > 0) {
      const wasSleeping = this.idleStage === 2;
      this.idleStage = 0;
      const now = this.ctx.currentTime;
      this.ambientSwell.gain.cancelScheduledValues(now);
      this.ambientSwell.gain.setTargetAtTime(0.82, now, 0.55);
      if (wasSleeping || !this.voices.has(this.currentAct)) {
        this.startAct(this.currentAct, false);
      }
    }
  }

  checkIdle() {
    if (!this.enabled || !this.ctx || document.hidden) return;
    if (document.documentElement.classList.contains('lang-pending')) return;
    const elapsed = performance.now() - this.lastActivity;
    const now = this.ctx.currentTime;
    if (elapsed >= IDLE_SLEEP_MS && this.idleStage < 2) {
      this.idleStage = 2;
      this.ambientSwell.gain.cancelScheduledValues(now);
      this.ambientSwell.gain.setTargetAtTime(0.0001, now, 1.1);
      this.stopAllVoices(3.2);
    } else if (elapsed >= IDLE_DUCK_MS && elapsed < IDLE_SLEEP_MS && this.idleStage === 0) {
      this.idleStage = 1;
      this.ambientSwell.gain.cancelScheduledValues(now);
      this.ambientSwell.gain.setTargetAtTime(0.28, now, 0.9);
    }
  }

  /** Turn sound on. Call from a user gesture. Idempotent. */
  enable({ delayAmbientMs = 0, playCue = false } = {}) {
    if (!this.supported) return false;
    window.clearTimeout(this.suspendTimer);
    this.suspendTimer = 0;
    window.clearTimeout(this.ambientDelayTimer);
    this.ambientDelayTimer = 0;

    this.preferenceOff = false;
    this.writePreference(true);
    this.unlock();

    const wasEnabled = this.enabled;
    this.enabled = true;
    this.idleStage = 0;
    this.lastActivity = performance.now();
    this.startIdleMonitor();

    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(MASTER_GAIN, now, 0.14);
    this.ambientBus.gain.cancelScheduledValues(now);
    this.ambientBus.gain.setTargetAtTime(AMBIENT_BUS_GAIN, now, 0.35);
    this.ambientSwell.gain.cancelScheduledValues(now);
    this.ambientSwell.gain.setTargetAtTime(0.82, now, 0.35);

    if (playCue) {
      this.playNow('toggle-on', { force: true });
    }

    if (!wasEnabled || !this.voices.has(this.currentAct)) {
      if (delayAmbientMs > 0) {
        this.ambientDelayTimer = window.setTimeout(() => {
          this.ambientDelayTimer = 0;
          if (this.enabled) this.startAct(this.currentAct, false);
        }, delayAmbientMs);
      } else {
        this.startAct(this.currentAct, false);
      }
      this.preloadSfx();
      this.preloadAmbientForAct(this.currentAct);
    }
    this.emit();
    return true;
  }

  disable(withCue = true) {
    window.clearTimeout(this.ambientDelayTimer);
    this.ambientDelayTimer = 0;
    window.clearTimeout(this.suspendTimer);
    this.suspendTimer = 0;
    this.stopIdleMonitor();

    const wasEnabled = this.enabled;
    this.enabled = false;
    this.preferenceOff = true;
    this.writePreference(false);
    this.emit();

    if (!wasEnabled || !this.ctx) return;
    const ctx = this.ctx;
    if (withCue && ctx.state === 'running') {
      this.playNow('toggle-off', { force: true });
    }
    const now = ctx.currentTime;
    this.ambientBus.gain.cancelScheduledValues(now);
    this.ambientBus.gain.setTargetAtTime(0.0001, now, 0.12);
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0.0001, now + (withCue ? 0.22 : 0), 0.09);
    this.stopAllVoices(0.45);

    this.suspendTimer = window.setTimeout(() => {
      this.suspendTimer = 0;
      if (!this.enabled && this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
      if (!this.enabled && this.silentEl) {
        try { this.silentEl.pause(); } catch (err) { /* ignore */ }
      }
    }, withCue ? 680 : 350);
  }

  /** One tap flips the state immediately. Returns the new state. */
  toggle() {
    if (this.enabled) {
      this.disable(true);
    } else {
      this.enable({ delayAmbientMs: 180, playCue: true });
    }
    return this.enabled;
  }

  onPageHide() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0.0001, now, 0.08);
    window.clearTimeout(this.suspendTimer);
    this.suspendTimer = window.setTimeout(() => {
      this.suspendTimer = 0;
      if (this.ctx && this.ctx.state === 'running' && (document.hidden || !this.enabled)) {
        this.ctx.suspend().catch(() => {});
      }
    }, 320);
  }

  onPageShow() {
    if (!this.ctx || !this.enabled || this.preferenceOff || document.hidden) return;
    window.clearTimeout(this.suspendTimer);
    this.suspendTimer = 0;
    if (this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => {});
    }
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(MASTER_GAIN, now, 0.35);
    this.touchActivity();
  }

  onVisibility() {
    if (document.hidden) {
      this.onPageHide();
    } else {
      this.onPageShow();
    }
  }

  /* ---------------------------------------------------------------- ambience */
  async startAct(act, instant = false) {
    if (!this.ctx || !this.enabled) return;
    const def = AMBIENT.find((a) => a.act === act) || AMBIENT[0];
    let voice = this.voices.get(act);
    if (!voice || !voice.running) {
      if (voice) {
        voice.stop(0.2);
        this.voices.delete(act);
      }
      let buffer;
      try { buffer = await this.decode(def.url); } catch (err) { return; }
      if (!this.enabled || this.currentAct !== act) return;
      voice = new LoopVoice(this.ctx, buffer, this.ambientBus, 3.2);
      voice.level = def.gain;
      this.voices.set(act, voice);
    }
    const now = this.ctx.currentTime;
    this.voices.forEach((other, key) => {
      if (key === act) return;
      other.out.gain.cancelScheduledValues(now);
      other.out.gain.setTargetAtTime(0.0001, now, 0.72);
      other.stop(2.8);
      this.voices.delete(key);
    });
    voice.start();
    voice.out.gain.cancelScheduledValues(now);
    voice.out.gain.setValueAtTime(Math.max(0.0001, voice.out.gain.value || 0.0001), now);
    voice.out.gain.setTargetAtTime(voice.level, now, instant ? 0.55 : 0.85);
  }

  /**
   * Hysteresis-protected act transition from continuous scroll mix (0..4).
   * Requires crossing 0.62 past the current act integer so resting on a boundary never chatters.
   */
  setActFromMix(actMix, { announce = true } = {}) {
    const diff = actMix - this.currentAct;
    if (Math.abs(diff) < 0.62) return;
    const nextAct = Math.max(0, Math.min(4, Math.round(actMix)));
    if (nextAct !== this.currentAct) {
      this.setAct(nextAct, { announce });
    }
  }

  setAct(act, { announce = false } = {}) {
    if (act === this.currentAct) return;
    const previous = this.currentAct;
    this.currentAct = act;
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const prev = this.voices.get(previous);
    if (prev) {
      prev.out.gain.cancelScheduledValues(now);
      prev.out.gain.setTargetAtTime(0.0001, now, 0.75);
      prev.stop(3.0);
      this.voices.delete(previous);
    }
    this.startAct(act, false);
    this.preloadAmbientForAct(act);
    const t = performance.now();
    if (announce && t - this.lastActCueAt > 4200 && document.body.classList.contains('is-ready')) {
      this.lastActCueAt = t;
      this.playNow('enter-act' + (act + 1));
    }
  }

  /** Scroll velocity (0..1) gently opens the warmth filter and breathes the ambience. */
  setEnergy(value) {
    if (!this.enabled || !this.ctx) return;
    const e = Math.min(1, Math.abs(value));
    if (Math.abs(e - this.energy) < 0.03) return;
    this.energy = e;
    if (e > 0.04) this.touchActivity();
    const now = this.ctx.currentTime;
    this.ambientTone.frequency.setTargetAtTime(2100 + e * 1150, now, 0.32);
    if (this.idleStage === 0) {
      this.ambientSwell.gain.setTargetAtTime(0.80 + e * 0.12, now, 0.35);
    }
  }

  setPointer(nx) { this.pointerPan = Math.max(-1, Math.min(1, nx)); }

  /* ------------------------------------------------------------------- sfx */
  play(name, opts) { this.playNow(name, opts); }

  playNow(name, opts = {}) {
    if (!this.ctx || (!this.enabled && !opts.force)) return;
    if (this.preferenceOff && name !== 'toggle-off') return;
    const def = SFX[name];
    if (!def) return;
    const t = performance.now();
    const last = this.lastPlay.get(name) || 0;
    const cd = opts.cooldown != null ? opts.cooldown : (def.cooldown || 0);
    if (t - last < cd) return;
    this.lastPlay.set(name, t);

    const buffer = this.buffers.get(def.url);
    if (!buffer) {
      const requestedAt = performance.now();
      this.decode(def.url)
        .then(() => {
          if ((this.enabled || opts.force) && performance.now() - requestedAt < MAX_LATE_PLAY_MS) {
            this.lastPlay.delete(name);
            this.playNow(name, opts);
          }
        })
        .catch(() => {});
      return;
    }
    const ctx = this.ctx;
    if (ctx.state === 'suspended' && (this.enabled || opts.force)) {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = (opts.rate || 1) * (1 + (Math.random() - 0.5) * 0.03);

    const gain = ctx.createGain();
    gain.gain.value = Math.min(0.65, (opts.gain || 1) * def.gain);
    src.connect(gain);

    // Subtle ambient ducking when a prominent feature cue plays so levels never stack
    if (this.enabled && this.idleStage === 0 && def.gain >= 0.30 && this.ambientSwell) {
      this.ambientSwell.gain.cancelScheduledValues(now);
      this.ambientSwell.gain.setTargetAtTime(0.62, now, 0.05);
      this.ambientSwell.gain.setTargetAtTime(0.82, now + 0.28, 0.35);
    }

    let tail = gain;
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = opts.pan != null ? opts.pan : this.pointerPan * 0.42;
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
