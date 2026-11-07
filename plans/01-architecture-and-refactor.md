# Plan 01 — Modular Architecture & Codebase Decomposition

> **For agentic workers:** Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking. If resuming from a quota reset, check `git status` and run `npx eslint js` to see current progress.

**Goal:** Split the monolithic 5,044-line `index.html` (466 KB) into clean, single-responsibility CSS and ES module files at the repository root for GitHub Pages, extract embedded base64 images into `assets/img/`, and build `single-file/index.html` automatically via `tools/build-single.mjs`.

---

## Target Directory Structure

```text
/tmp/opencode/arqam-rashed/
├── index.html                        # Clean ~375-line HTML shell (GitHub Pages deployment)
├── single-file/
│   └── index.html                    # Self-contained single-file bundle (auto-built via tools/build-single.mjs)
├── css/
│   ├── main.css                      # @import manifest for standalone dev or linked in index.html
│   ├── base.css                      # Reset, root variables, skip link, #gl canvas, .grain overlay
│   ├── chrome.css                    # Top HUD, scroll progress, live readout, right act-nav, custom cursor, boot screen
│   ├── lang-gate.css                 # Language onboarding gate & header lang toggle
│   ├── typography.css                # Arabic brutalist typography & RTL layout rules
│   ├── act1.css                      # Act I (Core / Obsidian Monolith)
│   ├── act2.css                      # Act II (Selected Work horizontal pin & project cards)
│   ├── act3.css                      # Act III (System Architecture clusters & glass HUD panels)
│   ├── act4.css                      # Act IV (Signal / Contact & CV download actions)
│   ├── act5.css                      # Act V (Direct Transmission & Project Inquiry form)
│   ├── footer.css                    # Site footer (CV dossier card, verified channels, colophon)
│   ├── components.css                # Sound toggle button, project action buttons, no-js states
│   ├── modal-actions.css             # Case study modal drawer, WhatsApp, CV & vCard buttons
│   └── responsive.css                # Breakpoints (1100px, 900px, 860px, 560px, 480px, 360px, reduced-motion)
├── js/
│   ├── main.js                       # Application entry point & lifecycle orchestrator
│   ├── config.js                     # Public endpoints, email, WhatsApp, CV & vCard file paths
│   ├── core/
│   │   ├── utils.js                  # $, $$, clamp, lerp, damp, smoothstep, hashString, mulberry32
│   │   ├── env.js                    # MediaQueries (reduced, finePointer, mobile) & haptic()
│   │   ├── state.js                  # Reactive state, layout metrics, DOM refs, ACT_NAME_KEYS
│   │   ├── lang.js                   # langCode(), langText(), whenLanguageReady()
│   │   ├── color.js                  # PALETTE_STOPS (Acts I–V), hexToRgb, mixRgb, paletteAt()
│   │   ├── palette.js                # Throttled CSS variable writer, direct heading skew, scroll progress bar
│   │   ├── scroll.js                 # Lenis smooth wheel (desktop) / native scroll (touch) + GSAP ScrollTrigger
│   │   ├── boot.js                   # Preloader progress bar & hero character split intro animation
│   │   ├── cursor.js                 # Custom cursor ring/dot, magnetic buttons, localized cursor labels
│   │   ├── widgets.js                # Cluster selector, email copy + burst, domain probe, motion toggle, anchor nav
│   │   ├── hud.js                    # FPS counter, Cairo clock, SVG waveform, active act indicator
│   │   └── loop.js                   # Adaptive frame loop (tick), dynamic resolution scaler, composer governor
│   ├── gl/
│   │   ├── scene-state.js            # Shared Three.js object references & Reusable Vector3 probes
│   │   ├── shaders.js                # Simplex noise GLSL & post-processing chromatic/grain shader
│   │   ├── renderer.js               # WebGLRenderer, EffectComposer, UnrealBloomPass, resize & context-loss handlers
│   │   ├── act1.js                   # Displaced ferrofluid icosahedron, orbital rings & dust particles
│   │   ├── act2.js                   # WebGL project media planes & background monolith wireframes
│   │   ├── act3.js                   # 4-cluster GPU particle topology, edges & pointer sprite
│   │   ├── act4.js                   # Gravitational singularity vortex, orbital shards & warped shader grid
│   │   ├── textures.js               # Async project image texture loader with mipmaps & anisotropy
│   │   ├── palette-sync.js           # Syncs Three.js uniforms and material colors with active palette
│   │   └── update.js                 # Per-frame visibility culling and uniform updates across Acts I–V
│   ├── i18n/
│   │   ├── en.js                     # English dictionary
│   │   ├── ar.js                     # Arabic dictionary
│   │   ├── bindings.js               # Declarative DOM selector -> translation key bindings
│   │   └── i18n.js                   # t(), applyLanguage(), initLanguage(), toggleLanguage()
│   ├── audio/
│   │   ├── manifest.js               # 5 ambient loops + 17 interactive SFX definitions with gain/reverb/cooldown
│   │   ├── engine.js                 # Web Audio V3 engine (LoopVoice equal-power crossfader, Convolver, Limiter)
│   │   ├── bindings.js               # Delegated click, hover, typing, act-enter & toggle sound bindings
│   │   └── index.js                  # Public audio exports
│   └── features/
│       ├── gate.js                   # Language onboarding gate controller & focus trap
│       ├── case-studies-data.js      # Bilingual architectural case studies for the 3 shipped projects
│       ├── modal.js                  # Case study modal controller with scroll lock & focus restoration
│       ├── contact.js                # CV PDF download, vCard download & localized WhatsApp links
│       └── inquiry.js                # Act V inquiry form validation, FormSubmit/Formspree POST & mailto fallback
├── assets/
│   ├── img/
│   │   ├── project-sequoia.jpg       # Extracted from base64 (129 KB)
│   │   ├── project-arko.svg          # Extracted from base64 (8.8 KB)
│   │   └── project-rt.jpg            # Extracted from base64 (53 KB)
│   ├── docs/
│   │   ├── Arqam-Rashed-CV.pdf       # Downloadable CV PDF (99 KB)
│   │   └── Arqam-Rashed.vcf          # Downloadable Contact Card VCF
│   └── audio/                        # 22 natural ElevenLabs MP3 files (5 ambient + 17 interactive SFX)
├── tools/
│   ├── build-single.mjs              # Compiles modular source into single-file/index.html
│   ├── verify.mjs                    # Automated Playwright + static verification suite
│   └── audio/
│       └── generate.mjs              # ElevenLabs SFX generator script
└── plans/                            # Detailed Markdown plans for model handoff
```

---

## Tasks

### Task 1: Extract CSS, JS Modules, and Base64 Images
- [x] **Step 1:** Slice legacy `<style>` block into 13 focused files under `css/`.
- [x] **Step 2:** Extract the 3 base64 project images from `index.html` into `assets/img/project-sequoia.jpg`, `assets/img/project-arko.svg`, and `assets/img/project-rt.jpg`.
- [x] **Step 3:** Slice the Three.js, I18N, Audio, and Feature scripts into ES modules under `js/core/`, `js/gl/`, `js/i18n/`, `js/audio/`, and `js/features/`.
- [x] **Step 4:** Configure `eslint.config.mjs` and verify zero `no-undef` or `no-dupe-keys` errors.

### Task 2: Wire Clean Modular `index.html` at Repo Root
- [x] **Step 1:** Write the clean root `index.html` linking `css/*.css`, external `<img src="assets/img/...">`, CV download buttons (`href="assets/docs/Arqam-Rashed-CV.pdf" download`), importmap for Three.js `0.187.0`, and `<script type="module" src="js/main.js"></script>`.
- [x] **Step 2:** Update `js/main.js` so all subsystems (`initCursor`, `initSoundUI`, `armAutoStart`, `initLanguage`, `initGate`, `initModal`, `initContact`, `initInquiry`, `initScroll`, `initGL`) initialize in the exact deterministic order.
- [x] **Step 3:** Run `npx eslint js tools` and confirm 0 errors and 0 warnings.
