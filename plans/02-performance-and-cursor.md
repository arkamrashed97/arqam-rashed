# Plan 02 — Performance Engineering (60fps Transitions) & Onboarding Cursor Fix

> **For agentic workers:** Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.

**Goal:** Eliminate frame drops during scroll and section transitions on both desktop and mobile, and make the custom cursor immediately visible and responsive on the PC language onboarding screen (`#lang-gate`).

---

## Root Causes Diagnosed

1. **Why the Custom Cursor Was Invisible on `#lang-gate` (PC):**
   - **Z-Index stacking:** In `css/chrome.css`, `.cursor, .cursor-dot` had `z-index: 120`, whereas `.boot` had `z-index: 300`, `.lang-gate` had `z-index: 500`, and `.project-modal` had `z-index: 600`. Meanwhile `body.has-cursor` set `cursor: none` on `body, a, button`! So when moving the mouse on the onboarding gate, the native OS cursor was hidden (`cursor: none`) while the custom cursor was rendered *underneath* `.lang-gate` (`z-index: 120 < 500`)!
   - **Deferred initialization:** In `js/main.js`, `initCursor()` was called *after* `await whenLanguageReady()`, and `updateCursor(dt)` only ran inside `tick()` after `startLoop()` was called.
2. **Why Frame Rate Died During Section Transitions:**
   - **60Hz Root CSS Custom Property Thrashing:** During transitions between Acts (`0.72..1.00`, `1.72..2.00`, `2.72..3.00`, `3.72..4.00`), `updatePalette()` called `document.documentElement.style.setProperty(...)` 6 times per frame (`--bg`, `--ink`, `--accent`, `--accent-strong`, `--muted`, `--line`) plus `--vskew` on `<html>`. In Chromium/WebKit, mutating a custom property on `:root` invalidates computed styles for **every element in the DOM** (500+ nodes) on every single frame!
   - **Full-Viewport Blend Mode + SVG Turbulence Filter:** `.grain` used `position: fixed; inset: -40px; mix-blend-mode: soft-light` with an inline `<feTurbulence>` SVG filter over the entire WebGL canvas, plus 4 separate `backdrop-filter: blur(14px..20px)` layers (`.hud`, `.act-nav`, `.glass`, `.project-modal__backdrop`).
   - **Unthrottled Multi-Pass Post-Processing During Scroll:** On desktop, `EffectComposer` ran 4 full-screen passes (`RenderPass` + `UnrealBloomPass` (which itself runs 11 internal mip blur passes) + `ShaderPass(POST_SHADER)` with 3 texture taps + `OutputPass`) at `DPR 1.8` even while the browser was simultaneously compositing DOM scroll and GSAP ScrollTrigger pinning.
   - **Act 4 Blend Mode Shader Recompilation Stall:** In `js/gl/update.js`, crossing `m3 > 0.55` flipped `sceneState.pointMat.blending` and `sceneState.lineMat.blending` between `AdditiveBlending` and `NormalBlending` with `needsUpdate = true` mid-scroll, forcing WebGL to recompile/reconfigure the pipeline right in the middle of the Act III → Act IV transition!

---

## Tasks

### Task 1: Fix Desktop Onboarding Cursor Visibility & Responsiveness
**Files:**
- Modify: `css/chrome.css`
- Modify: `js/core/cursor.js`
- Modify: `js/main.js`

- [x] **Step 1: Elevate `.cursor` and `.cursor-dot` z-index in `css/chrome.css`**
  - Set `z-index: 700` on `.cursor, .cursor-dot` (above `.lang-gate` `500`, `.boot` `300`, and `.project-modal` `600`).
  - Add `will-change: transform` to `.cursor, .cursor-dot` so cursor movement is GPU-composited.
- [x] **Step 2: Make `initCursor()` self-driving before main loop starts in `js/core/cursor.js`**
  - Call `initCursor()` immediately in `js/main.js` **before** `await whenLanguageReady()`.
  - Inside `initCursor()`, on `pointermove`, immediately position `.cursor` and `.cursor-dot` if the main GSAP loop hasn't started yet (or run a lightweight `requestAnimationFrame` follower until `startLoop()` takes over), so the cursor tracks smoothly on the language onboarding gate from the first pixel of mouse movement.
  - Include `[data-lang-choice]` and `input, select, textarea` in hover target detection.

### Task 2: Eliminate Transition Style Recalculation & GPU Overdraw
**Files:**
- Modify: `js/core/palette.js`
- Modify: `css/base.css`
- Modify: `css/act3.css`
- Modify: `js/gl/update.js`
- Modify: `js/gl/renderer.js`
- Modify: `js/core/loop.js`

- [x] **Step 1: Throttle root CSS variable writes & apply velocity skew directly to headings in `js/core/palette.js`**
  - Keep WebGL uniform color updates (`syncScenePalette()`) running smoothly, but throttle `:root` CSS variable writes to 20Hz on desktop / 11Hz on mobile with a trailing write when the transition settles.
  - Apply `transform: skewY(...)` directly to the 4 `refs.skewTargets` elements instead of setting `--vskew` on `<html>`.
- [x] **Step 2: Optimize `.grain` and glass `backdrop-filter` in `css/base.css` & `css/act3.css`**
  - Replace the expensive live `<feTurbulence>` + `mix-blend-mode: soft-light` full-screen pass on `.grain` with a lightweight, GPU-friendly static noise pattern (`mix-blend-mode: normal; opacity: 0.045; contain: strict; transform: translateZ(0)`).
  - Add `contain: layout paint` to `.act` sections (except `.act-2` when pinned) so scrolling one section never triggers layout/paint in neighboring sections.
- [x] **Step 3: Remove mid-scroll material `.needsUpdate` pipeline stall in `js/gl/update.js`**
  - Keep `pointMat` and `lineMat` on a consistent blending mode and fade their opacity via `uOpacity` uniform instead of toggling `blending` + `needsUpdate = true` at `m3 = 0.55`.
  - Skip matrix and uniform calculations for any Act group whose weight is `< 0.004`.
- [x] **Step 4: Add Adaptive DPR Governor & Scroll-Transition Composer Bypass in `js/core/loop.js` & `js/gl/renderer.js`**
  - Cap desktop DPR at `1.5` (and `1.1` on mobile).
  - In `js/core/loop.js`, track a rolling frame-time average. If FPS drops below `48` or during fast scroll transitions (`Math.abs(state.velocitySmooth) > 0.35`), bypass `EffectComposer` bloom/chromatic passes or dynamically step down pixel ratio so frame rate stays locked at 60fps.
  - Pause WebGL rendering completely when `document.hidden` is true.
