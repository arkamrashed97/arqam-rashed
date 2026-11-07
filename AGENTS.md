# Project Memory & Agent Rules (AGENTS.md)

## 1. Primary Source of Truth vs. Secondary Single-File Build (CRITICAL RULE)

- **MAIN PROJECT (Primary Source of Truth):**
  The modular root project (`index.html` + `css/` [13 stylesheets] + `js/` [29 ES modules] + `assets/` + `functions/`) is the **MAIN** project.
  - All production traffic on **`https://arqamrashed.com`**, **`https://arqam-rashed.pages.dev`**, and **`https://arkamrashed97.github.io/arqam-rashed/`** serves this modular root project.
  - **Every code, style, audio, or content change MUST be made in the modular source files (`index.html`, `css/*.css`, `js/**/*.js`, `assets/`, `functions/`) first.**

- **SECONDARY PORTABLE BUILD (`single-file/index.html`):**
  `single-file/index.html` is **NOT** the main project; it is a generated portable bundle derived from the main modular project via `npm run build` (`tools/build-single.mjs`).

- **MANDATORY DUAL-SYNC RULE (No One-Sided Updates Ever):**
  1. Never edit `single-file/index.html` directly, and never update one edition without updating the other.
  2. After any edit to the modular project (`index.html`, `css/`, `js/`, `assets/`), you **MUST** run `npm run build` (`node tools/build-single.mjs`).
  3. `tools/build-single.mjs` automatically performs **two** synchronized actions on every build:
     - Computes a SHA-256 content hash (`?v=<hash>`) across all modular `css/` and `js/` files and updates the `<link rel="stylesheet">` tags, `<script type="importmap">`, and `<script type="module" src="js/main.js?v=<hash>">` in root `index.html` so browsers never serve stale cached CSS/JS on the main modular site.
     - Rebuilds `single-file/index.html` from the exact same modular source.
  4. Always keep `/tmp/opencode/arqam-rashed` (Git working clone) and `/mnt/sdcard/arqam rashed` (SD card workspace) 100% synchronized (`npm run deploy:cf` automatically runs `build-single.mjs`, deploys to Cloudflare Pages, purges Cloudflare Zone cache, and syncs to `/mnt/sdcard/arqam rashed`).

---

## 2. Environment & Deployment Stack

- **Workspaces:**
  - Active Git repository & build directory: `/tmp/opencode/arqam-rashed` (`https://github.com/arkamrashed97/arqam-rashed.git`, branch `main`).
  - Persistent SD card mirror: `/mnt/sdcard/arqam rashed`.
- **Cloudflare Pages & Custom Domain:**
  - Production Domain: **`https://arqamrashed.com`** and **`https://www.arqamrashed.com`** (Cloudflare Zone ID: `233d796ba1b6a9377e5753b7c193108c`, Account ID: `e28448a87756d57d66633a52c5b984bc`).
  - Cloudflare Pages Project: `arqam-rashed` (`https://arqam-rashed.pages.dev`).
  - Deploy command: `npm run deploy:cf` (uses `.env.local`).
- **Cloudflare Email Routing:**
  - Official public portfolio email: **`me@arqamrashed.com`** (with Catch-All `*@arqamrashed.com` enabled).
  - Forwarding destination (verified): **`arkamrashed@gmail.com`**.
  - Act V Inquiry Form endpoint: `https://formsubmit.co/ajax/arkamrashed@gmail.com`.
- **Supabase Leaderboard (Act V Fishing Lagoon):**
  - Supabase URL: `https://qsbuqfkkevrbdxrebsln.supabase.co`.
  - Edge API endpoint: `https://arqam-rashed.pages.dev/api/leaderboard` (`functions/api/leaderboard.js`).
- **Audio Engine (39 ElevenLabs MP3s in `assets/audio/`):**
  - 5 ambient loops + 34 interaction/onboarding/fishing SFX generated via `tools/audio/generate.mjs`.
  - Every decoded buffer is loudness-normalized in-place via gated 20ms active RMS + soft-knee crest control in `js/audio/engine.js`.

---

## 3. Verification Workflow

Before claiming any task is complete:
1. Run `npm run build` (synchronizes modular `index.html` cache-busting hashes + `single-file/index.html`).
2. Run `npm run lint` (ESLint across `js/` and `tools/`).
3. Run `npm run verify` (Playwright headless Chromium verification of **both** the Modular Root Edition `/` and `/single-file/index.html` at `1440x900` desktop and `390x844` mobile Arabic RTL).
4. Run `npm run deploy:cf` and `git push origin main`.
