# Plan 03 — Web Audio Engine V3 & 22 ElevenLabs Interactive Soundscapes

> **For agentic workers:** Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.

**Goal:** Fix all audio playback issues across PC and mobile browsers and expand the sound design with 17 new subtle, calming ElevenLabs interactive sound effects (22 total MP3 files in `assets/audio/`), using a true Web Audio API graph with gapless crossfade looping, stereo pointer panning, procedural room impulse reverb, and a master limiter.

---

## Root Causes of Previous Audio Issues on PC & Mobile

1. **Mobile Auto-Start Failed (`pointerdown` is not an audio activation gesture):**
   - Mobile Chrome (Android) and Safari (iOS) reject `AudioContext.resume()` and `HTMLMediaElement.play()` inside `pointerdown` or `touchstart` because the browser does not yet know if the touch is a scroll gesture. Audio unlock **must** run synchronously inside `click`, `pointerup`, or `touchend`.
2. **`HTMLAudioElement.volume` Ignored on iOS & Laggy on Android:**
   - On iOS Safari, `audioElement.volume` is read-only (always `1.0`), so `setInterval` volume fades had zero effect and tracks jumped in at full volume or failed to crossfade.
   - Cloning `<audio>` nodes (`sound.cloneNode().play()`) on every click caused a 40–120ms main-thread decode hitch during scroll/click transitions.
3. **MP3 Loop Seam Clicks:**
   - Native `<audio loop>` has a brief silence gap at the loop boundary due to MP3 encoder padding.

---

## Complete Audio Asset Manifest (`assets/audio/`)

All 22 files are generated via ElevenLabs (`tools/audio/generate.mjs`) and committed directly to `assets/audio/` so the portfolio has zero runtime external API dependency:

### 5 Section Ambient Soundscapes (18s each, looped via equal-power Web Audio crossfader)
- `act1-luxor-wind.mp3` — Act I (Core): Gentle desert night breeze through Luxor sandstone pillars
- `act2-kinetic-garden.mp3` — Act II (Work): Peaceful zen garden water droplet & soft bamboo rustle
- `act3-crystal-resonance.mp3` — Act III (System): Pure 432Hz quartz crystal singing bowl harmonic wash
- `act4-twilight-calm.mp3` — Act IV (Signal): Warm Egyptian evening dusk breeze
- `act5-dialogue-presence.mp3` — Act V (Inquiry): Serene open balcony room air presence

### 5 Section-Specific Button Clicks
- `btn-act1.mp3` — Soft sandstone micro tap (Act I)
- `btn-act2.mp3` — Crisp bamboo / parchment tap (Act II)
- `btn-act3.mp3` — Delicate crystal glass droplet ping (Act III)
- `btn-act4.mp3` — Warm rounded water droplet tap (Act IV)
- `btn-act5.mp3` — Clean modern haptic tactile snap (Act V)

### 12 Additional Interactive & Transition Cues (Generated via ElevenLabs MCP/SDK)
- `gate-open.mp3` — Language gate dismissal welcoming airy whoosh + distant wooden chime
- `toggle-on.mp3` — Sound / motion switch ON (warm rising two-note marimba tap)
- `toggle-off.mp3` — Sound / motion switch OFF (warm falling muted tap)
- `hover-soft.mp3` — Subtle airy paper brush tick on desktop pointer hover (`gain: 0.32`, 110ms cooldown)
- `enter-act1.mp3` .. `enter-act5.mp3` — 5 gentle scene-transition breaths played when scrolling into each Act
- `modal-open.mp3` & `modal-close.mp3` — Case study drawer open/close wooden slide cues
- `cluster-select.mp3` — Architecture cluster selection crystal tap + shimmer tail
- `copy-success.mp3` — Email copied confirmation soft bell pluck
- `download-ok.mp3` — CV PDF / vCard download confirmation paper drop + pluck
- `form-success.mp3` & `form-error.mp3` — Act V inquiry form submission status cues
- `type-tick.mp3` — Ultra-quiet keyboard tap when typing in the Act V inquiry form

---

## Tasks

### Task 1: Generate All 17 New Interactive MP3 Assets with ElevenLabs
- [x] **Step 1:** Create `tools/audio/generate.mjs` using `@elevenlabs/elevenlabs-js`.
- [x] **Step 2:** Run `node --env-file=.env.local tools/audio/generate.mjs` and verify all 22 MP3 files exist in `assets/audio/` with non-zero sizes.

### Task 2: Implement Web Audio V3 Engine (`js/audio/`)
- [x] **Step 1:** Create `js/audio/manifest.js` defining `AMBIENT`, `SFX`, `ACT_BUTTON_SFX`, and `ACT_ENTER_SFX`.
- [x] **Step 2:** Create `js/audio/engine.js` with `LoopVoice` (overlapping `AudioBufferSourceNode` with `sin/cos` equal-power fade curves), `DynamicsCompressorNode` limiter, `BiquadFilterNode` scroll-velocity lowpass swell, `ConvolverNode` procedural room reverb, and `StereoPannerNode` pointer tracking.
- [x] **Step 3:** Create `js/audio/bindings.js` wiring single-tap `#sound-toggle`, `pointerup`/`click`/`touchend` auto-start, `data-sfx` attributes, hover cues, and form typing cues.
- [x] **Step 4:** Connect `sound.setAct(actIndex)` and `sound.setEnergy(velocity)` in `js/core/loop.js`, and add `data-sfx` attributes to key interactive elements in `index.html` (`cluster-select`, `copy-success`, `modal-open`, `modal-close`, `download-ok`).
