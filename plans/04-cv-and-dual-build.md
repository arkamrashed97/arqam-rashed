# Plan 04 — CV Extraction as Download, Dual-Edition Build (`single-file/`), & Verification

> **For agentic workers:** Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.

**Goal:** Remove all inline CV work history and hardcoded vCard arrays from the HTML/JS code, export the CV (`Arqam-Rashed-CV.pdf`) and contact card (`Arqam-Rashed.vcf`) as static downloadable files triggered by dedicated download buttons, build the standalone `single-file/index.html` bundle alongside the modular root GitHub Pages deployment, verify everything in headless Chromium, and push to GitHub.

---

## Tasks

### Task 1: Extract CV & vCard to Static Downloadable Files & Remove Inline CV Code
**Files:**
- Create: `assets/docs/Arqam-Rashed-CV.pdf`
- Create: `assets/docs/Arqam-Rashed.vcf`
- Modify: `index.html`
- Modify: `js/i18n/en.js`, `js/i18n/ar.js`, `js/i18n/bindings.js`
- Modify: `css/footer.css`, `css/modal-actions.css`

- [x] **Step 1:** Copy `/mnt/sdcard/arqam rashed/Arqam Rashed – CV (Full-Stack Developer) (2).pdf` to `assets/docs/Arqam-Rashed-CV.pdf` (`chmod 644`).
- [x] **Step 2:** Create `assets/docs/Arqam-Rashed.vcf` as a clean static vCard file in `assets/docs/`.
- [x] **Step 3:** Remove the inline `<ul class="timeline">` CV work history (Bosta, Grand Memphis Hotel, AHE, Luxor University) and the Bosta context line from `index.html`, `js/i18n/en.js`, `js/i18n/ar.js`, and `js/i18n/bindings.js`.
- [x] **Step 4:** Add prominent **"DOWNLOAD CV (PDF) ↓"** (`#cv-btn` in Act IV and `#footer-cv-btn` in the Footer dossier block) and **"SAVE CONTACT CARD (VCF) ↓"** (`#vcard-btn`) anchor elements with `href="assets/docs/Arqam-Rashed-CV.pdf" download="Arqam-Rashed-CV.pdf"` and `data-sfx="download-ok"`.

### Task 2: Build the Single-File Edition (`single-file/index.html`)
**Files:**
- Create: `tools/build-single.mjs`
- Create: `single-file/index.html`

- [x] **Step 1:** Implement `tools/build-single.mjs` using `esbuild`:
  - Reads root `index.html`.
  - Concatenates and minifies all linked `css/*.css` stylesheets into a single inline `<style>` tag.
  - Bundles `js/main.js` via `esbuild` (`bundle: true, format: 'esm', minify: true, external: ['three', 'three/*']`).
  - Converts `assets/img/*` `<img src="...">` and `assets/docs/Arqam-Rashed.vcf` into inline data URIs in `single-file/index.html`, and rewrites `assets/audio/*` and `assets/docs/Arqam-Rashed-CV.pdf` paths to `../assets/...` (or embeds data URIs when `--embed-all` is passed) so `single-file/index.html` works out of the box both locally and on GitHub Pages (`/single-file/`).
- [x] **Step 2:** Add `"build": "node tools/build-single.mjs"` and `"lint": "eslint js tools"` to `package.json` scripts.
- [x] **Step 3:** Run `npm run build` and verify `single-file/index.html` is generated cleanly.

### Task 3: Automated Playwright Verification (Desktop + Mobile + Single-File)
**Files:**
- Create: `tools/verify.mjs`

- [x] **Step 1:** Write `tools/verify.mjs` to spin up a local HTTP server and test both `/` (modular GitHub Pages edition) and `/single-file/index.html` (single-file edition) in Playwright Chromium arm64:
  - Assert `0` uncaught `pageerror`s and `0` failed local network requests (`404`).
  - Assert desktop custom cursor is visible on `#lang-gate` (`z-index > 500`, `body.has-cursor` active on `pointermove`).
  - Assert clicking a language option dismisses `#lang-gate`, unlocks `AudioContext`, and transitions smoothly into Act I.
  - Assert `#cv-btn` and `#footer-cv-btn` have `download="Arqam-Rashed-CV.pdf"` and HTTP `200` for `assets/docs/Arqam-Rashed-CV.pdf`, and that `Grand Memphis` / `BEGIN:VCARD` do not appear in the DOM or JS.
  - Assert scrolling through Acts I → V updates the HUD (`01`..`05`), triggers audio act transitions, and maintains `0px` horizontal overflow on mobile (`390x844`).
- [x] **Step 2:** Run `node tools/verify.mjs` and confirm all assertions pass.

### Task 4: Sync SD Card Mirror & Push to GitHub
- [x] **Step 1:** Sync all updated files (`index.html`, `single-file/`, `css/`, `js/`, `assets/`, `tools/`, `plans/`, `README.md`) to `/mnt/sdcard/arqam rashed/`.
- [x] **Step 2:** Stage, commit, and push to `origin/main` on GitHub (`https://github.com/arkamrashed97/arqam-rashed.git`).
