# Arqam Rashed Portfolio — Master Overhaul & Refactoring Plan

> **For agentic workers / future models:** This directory contains the complete, step-by-step specification and execution blueprint for the portfolio refactoring, performance optimization, Web Audio V3 engine, CV download extraction, onboarding cursor fix, and dual-edition build pipeline (GitHub Pages modular deployment + Single-File standalone bundle).
> Use `superpowers:executing-plans` or execute task-by-task following the checkboxes (`- [ ]` / `- [x]`).

**Goal:** Refactor the monolithic 5,044-line `index.html` into a fast, modular, 60fps production architecture at the repo root (for GitHub Pages) while automatically compiling a 100% self-contained single-file edition in `single-file/index.html`, fixing onboarding cursor visibility, overhauling the audio engine with 22 ElevenLabs natural sound effects, removing inline CV history from the DOM/JS in favor of static file downloads (`Arqam-Rashed-CV.pdf` & `Arqam-Rashed.vcf`), and eliminating transition frame drops.

**Architecture:**
1. **Modular Edition (Repository Root `/` — GitHub Pages Deployment):**
   - Clean semantic `index.html` (~380 lines) linking modular CSS (`css/*.css`) and ES module entry (`js/main.js`).
   - 13 focused CSS modules in `css/` and 29 focused ES modules in `js/{core,gl,i18n,audio,features}/`.
   - Externalized binary assets in `assets/img/`, `assets/audio/`, and `assets/docs/`.
2. **Single-File Edition (`single-file/index.html`):**
   - Built deterministically via `node tools/build-single.mjs` using `esbuild`.
   - Inlines all 13 CSS files, bundles all ES modules into an inline module script, and converts local image/document/audio references as needed so `single-file/index.html` works as a standalone portable file.

**Tech Stack:**
- Three.js `0.187.0` + Custom GLSL Shaders + Post-processing (`EffectComposer`, `UnrealBloomPass`, `ShaderPass`)
- GSAP `3.15.1` + `ScrollTrigger`
- Lenis `1.3.27` (desktop smooth wheel scroll; native compositor scroll on touch devices)
- Web Audio API (gapless equal-power crossfade loop voices, stereo pointer panning, procedural room impulse convolver, master dynamics limiter)
- ElevenLabs Sound Effects (`@elevenlabs/elevenlabs-js` via `tools/audio/generate.mjs`)
- `esbuild` `0.28.2` + `eslint` `10.14.0` + Playwright Chromium arm64 verification suite

---

## Plan Index

1. [`plans/01-architecture-and-refactor.md`](./01-architecture-and-refactor.md) — Modular File Decomposition (CSS, ES Modules, Extracted Images, Dual-Edition Build Script)
2. [`plans/02-performance-and-cursor.md`](./02-performance-and-cursor.md) — 60fps Transition Performance, Adaptive DPR, Offscreen WebGL Culling, & Onboarding Custom Cursor Fix
3. [`plans/03-audio-engine-v3.md`](./03-audio-engine-v3.md) — Web Audio API V3 Engine, Cross-Platform Mobile/Desktop Unlock, & 22 ElevenLabs Interactive Sound Effects
4. [`plans/04-cv-and-dual-build.md`](./04-cv-and-dual-build.md) — CV Removal from Code, Static PDF/VCF Download Export, Automated Verification, & GitHub Deployment

---

## Global Constraints

- **Repo Path:** `/tmp/opencode/arqam-rashed` (mirror synced to `/mnt/sdcard/arqam rashed`).
- **GitHub Remote:** `https://github.com/arkamrashed97/arqam-rashed.git` (`main` branch).
- **Zero Inline CV History in Code:** Do not embed work history timelines (Bosta, Grand Memphis, AHE, Luxor University) or inline vCard text builders in HTML/JS. Serve `assets/docs/Arqam-Rashed-CV.pdf` and `assets/docs/Arqam-Rashed.vcf` as direct downloads when the user clicks Download CV / Save Contact Card.
- **Zero Synthetic Audio Buzz:** Never use Web Audio `OscillatorNode` or synthetic pink/white noise generators for background sound. Use only the 22 natural ElevenLabs MP3 files in `assets/audio/`.
- **Desktop Onboarding Cursor:** Custom cursor (`.cursor`, `.cursor-dot`) must have `z-index: 650` (above `#lang-gate` at `z-index: 500` and `#project-modal` at `z-index: 600`), and `initCursor()` must run immediately at script load **before** `await whenLanguageReady()` so desktop users see the custom cursor on the language onboarding gate.
- **60fps Scroll & Act Transitions:**
  - Never mutate CSS custom properties (`--bg`, `--ink`, etc.) or `--vskew` on `document.documentElement` at 60Hz during scroll transitions (causes full-document style recalculation every frame). Throttle root CSS variable writes and apply `skewY` directly to the 4 target headings.
  - Pause `EffectComposer` post-processing passes (`UnrealBloomPass` + `ShaderPass`) during high-velocity scroll transitions or when FPS drops below 50, falling back seamlessly to direct `renderer.render(scene, camera)` with adaptive pixel ratio.
  - Keep `.grain` overlay static without full-screen `mix-blend-mode: soft-light` repainting over the WebGL canvas.

## Review Focus (Top 5 Failure Modes Tested)

1. **Cursor invisible on `#lang-gate` on Desktop:** If `initCursor()` is called after `await whenLanguageReady()`, or if `.cursor` has `z-index: 120` while `.lang-gate` has `z-index: 500`, the cursor is hidden behind the gate. Tested by asserting `getComputedStyle(cursor).zIndex > getComputedStyle(langGate).zIndex` and verifying `body.has-cursor` activates on `pointermove` while `html.lang-pending` is true.
2. **Audio silent on PC or Mobile after first click:** Caused by binding unlock to `pointerdown` (rejected by mobile Safari/Chrome as audio activation) or calling `audio.play()` asynchronously after a promise/fetch. Fixed by unlocking `AudioContext` synchronously inside `click`/`pointerup`/`touchend` and decoding buffers into `AudioBufferSourceNode`.
3. **Frame drops / freeze during Act transitions (Act I→II→III→IV→V):** Caused by setting 6 CSS variables + `--vskew` on `<html>` every frame (60 style recalculations/sec across 500+ DOM nodes), plus `backdrop-filter: blur()` over a full-screen `mix-blend-mode` grain layer and 4-pass `EffectComposer`. Fixed by throttling root CSS variable updates, removing root `--vskew`, removing `mix-blend-mode` on `.grain`, and dynamic resolution / composer bypass during fast scroll.
4. **CV data still present in HTML/JS:** Verified by grepping `index.html`, `js/**/*.js`, and `single-file/index.html` for `Grand Memphis`, `Bosta`, `BEGIN:VCARD`, and `.timeline` — must return 0 matches, while `#cv-btn` and `#footer-cv-btn` have `href="assets/docs/Arqam-Rashed-CV.pdf"` and `download="Arqam-Rashed-CV.pdf"`.
5. **Broken relative paths or missing assets in `single-file/index.html`:** Verified by loading both `/index.html` (via HTTP server) and `single-file/index.html` in headless Chromium and asserting `0` page errors, `0` failed local asset requests, and identical visual/interactive behavior.
