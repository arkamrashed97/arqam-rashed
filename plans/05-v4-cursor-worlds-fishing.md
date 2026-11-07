# Plan 05 — V4 Morphing Act Cursors, Balanced Audio Normalization, Water-Silk Sheet & Act V Fishing Game

> **For agentic workers:** Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.

**Goal:** Transform the custom cursor into a multi-act morphing SVG pointer (starting with the all-green orbital arrow + 4-point star in Act I and morphing into a fishing rod + hook in Act V), normalize all 31 ElevenLabs audio buffers in-place for consistent loudness, add interactive SVG animations to Acts I–IV, replace the Act IV wireframe grid with a 3D Water-Silk Sheet (`ملاية على مية`), and build a playable fishing mini-game in Act V.

---

## Completed Tasks

- [x] **Task 1: Perceptual Audio Loudness Normalization & 9 New ElevenLabs Cues (`js/audio/engine.js`, `js/audio/manifest.js`, `js/audio/bindings.js`)**
  - Generated 9 additional ElevenLabs MP3 files (`touch-act1..4.mp3`, `cast-line.mp3`, `water-plop.mp3`, `fish-bite.mp3`, `reel-in.mp3`, `fish-catch.mp3`) — 31 total committed audio files in `assets/audio/`.
  - Implemented `normalizeBufferInPlace(buffer, isAmbient)` using 20ms gated active RMS (18% gate to ignore leading/trailing silence) and soft-knee `tanh` crest taming so quiet sounds (`hover-soft`, `type-tick`, `water-plop`) are clearly audible and loud cues never spike.
  - Added velocity-sensitive physical pointer/touch sweep audio across all 5 Acts.

- [x] **Task 2: 5-Act Morphing SVG Pointer & Universal Mouse/Touch Physics (`js/core/cursor.js`, `css/chrome.css`)**
  - Act I (`data-cursor-act="0"`): All-Green Orbital Arrow + 4-point star sparkle (`#D4FF00` / `#80FF00`).
  - Act II (`data-cursor-act="1"`): Amber-Gold Origami Paper Glider Pointer (`#FF9500` / `#FFD000`).
  - Act III (`data-cursor-act="2"`): Quantum Cyan Crystal Prism Pointer (`#00F0FF`).
  - Act IV (`data-cursor-act="3"`): Violet-Aqua Water-Silk Droplet Pointer (`#C084FC` / `#38BDF8`).
  - Act V (`data-cursor-act="4"`): Emerald & Gold Fishing Rod Tip with pendulum-physics line, bobber, and silver hook (`#10B981` / `#FBBF24`).
  - Enabled universal `pointermove`, `touchstart`, and `touchmove` coordinate tracking on all screen sizes with visual `.touch-ripple` shockwaves.

- [x] **Task 3: Act IV 3D Water-Silk Sheet (`js/gl/act4.js`)**
  - Removed the background square grid lines (`fract(p * 7.0)`) and replaced `gridMesh` with a subdivided 3D Silk Sheet Floating on Water (`PlaneGeometry(44, 28, 112, 72)`) with analytical normals, dual grazing specular highlights, Fresnel silk folds, and interactive pointer/touch water depression & concentric ripples.

- [x] **Task 4: Interactive SVG Worlds (Acts I–IV) & Act V Playable Fishing Mini-Game (`js/features/act-worlds.js`, `css/act5.css`)**
  - Act I: 4 animated SVG spaceships (`cruiser`, `saucer`, `interceptor`) with ion thrusters + 24 twinkling stars & pointer constellation beams.
  - Act II: 5 origami paper airplanes gliding on wind currents + 3 spinning kinetic pinwheels.
  - Act III: 4 autonomous quantum hex-drones locking telemetry beams onto the pointer.
  - Act IV: 4 floating origami lotus boats & expanding liquid ripples.
  - Act V: Full playable fishing game (`#fishing-pond` + `#fishing-hud`) with 11 swimming fish across 6 species (`Nile Tilapia`, `Coral Clownfish`, `Royal Blue Tang`, `Imperial Golden Koi`, `Neon Abyss Angler`, `Luxor Pharaoh Gold`), live fishing line & bobber, bait button (`DROP BAIT 🪱`), combo multipliers, and persistent high score.
