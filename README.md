# Arqam Rashed — Portfolio 2026 (v2.0 Dual-Edition Architecture)

Bilingual (English / Arabic RTL) creative engineering portfolio for **Arqam Rashed**, Full-Stack Architect & Creative Developer in Luxor, Egypt.

Live Deployment: **https://arkamrashed97.github.io/arqam-rashed/**

---

## Dual-Edition Repository Structure

This repository ships **two synchronized editions** of the portfolio:

1. **Modular GitHub Pages Deployment (Repository Root)**
   - [`index.html`](./index.html) — Clean, semantic HTML shell (~539 lines).
   - [`css/`](./css/) — 13 modular CSS stylesheets (`base.css`, `chrome.css`, `lang-gate.css`, `typography.css`, `act1.css`..`act5.css`, `footer.css`, `responsive.css`, `components.css`, `modal-actions.css`).
   - [`js/`](./js/) — 29 ES modules organized into `core/`, `gl/`, `i18n/`, `audio/`, and `features/`.
   - [`assets/img/`](./assets/img/) — Extracted project textures (`project-sequoia.jpg`, `project-arko.svg`, `project-rt.jpg`).
   - [`assets/docs/`](./assets/docs/) — Static downloadable CV (`Arqam-Rashed-CV.pdf`) and contact card (`Arqam-Rashed.vcf`).
   - [`assets/audio/`](./assets/audio/) — 22 natural, non-musical ElevenLabs MP3 soundscapes and interactive micro-cues.
2. **Self-Contained Single-File Edition ([`single-file/index.html`](./single-file/index.html))**
   - Built automatically from the modular source via [`tools/build-single.mjs`](./tools/build-single.mjs) (`esbuild`).
   - Inlines all 13 CSS stylesheets, all 29 JS ES modules, project textures, and `.vcf` data URI into a single portable file while keeping audio and PDF assets linked cleanly.

---

## Five-Act Experience

1. **Act I — Identity / Core**: Displaced ferrofluid icosahedron in obsidian, titanium, and acid lime (`act1-luxor-wind.mp3`).
2. **Act II — Selected Work**: Horizontal editorial track and case-study architecture modal for **Sequoia Travel**, **ArkoClick**, and **RT Supplements** (`act2-kinetic-garden.mp3`).
3. **Act III — System Architecture**: GPU particle topology with 6 selectable engineering clusters (`ALL`, `WEB`, `BACKEND`, `DESKTOP`, `MOBILE`, `DEVOPS`) (`act3-crystal-resonance.mp3`).
4. **Act IV — Direct Line / Signal**: Gravitational portal, cursor-warped grid, one-click email copy, and direct **Download CV (PDF)** + **Save Contact Card (VCF)** actions (`act4-twilight-calm.mp3`).
5. **ActV — Project Inquiry**: Interactive project scope, timeline, and budget estimator with instant WhatsApp and email dispatch (`act5-dialogue-presence.mp3`).

---

## Engineering & Performance Highlights

- **60fps Scroll Transitions**:
  - Offscreen Three.js act groups (`m1`..`m4`) are culled (`visible = false`) and skipped when opacity is near zero.
  - Zero mid-scroll shader recompilations (`needsUpdate` stalls removed).
  - Throttled `:root` CSS custom property updates and scoped `skewY` transforms.
  - GPU-promoted noise layer without full-screen `feTurbulence` + `mix-blend-mode` compositing stalls.
  - Adaptive pixel-ratio scaling and half-resolution `UnrealBloomPass`.
- **Spatial Web Audio Engine V3 (`js/audio/`)**:
  - Seamless equal-power (`sin`/`cos`) overlapping buffer loops for zero-click ambient beds.
  - Synchronous iOS/Android/Desktop `AudioContext` unlock on first user gesture (`click`, `pointerup`, `touchend`, `keydown`).
  - Procedural room impulse response (`ConvolverNode`), pointer-tracked `StereoPannerNode`, scroll-velocity filter modulation, and master `DynamicsCompressorNode` brickwall limiter.
- **CV & Contact Export**:
  - Inline work history timelines and hardcoded vCard arrays are removed from the codebase; clicking **Download CV (PDF)** or **Save Contact Card (VCF)** downloads `assets/docs/Arqam-Rashed-CV.pdf` and `assets/docs/Arqam-Rashed.vcf` directly.
- **Implementation Plans ([`plans/`](./plans/))**:
  - Detailed step-by-step architectural and continuation plans are documented in [`plans/README.md`](./plans/README.md) and `plans/01-*.md` through `plans/04-*.md`.

---

## Development Commands

```bash
# Rebuild single-file/index.html from modular css/ + js/ + assets/
npm run build

# Lint all ES modules and build tools
npm run lint

# Run automated Playwright verification (Desktop + Mobile + Single-File)
npm run verify

# Regenerate ElevenLabs audio cues (requires ELEVENLABS_API_KEY in .env.local)
npm run audio:generate
```
