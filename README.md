# Arqam Rashed — Portfolio 2026 (Dual-Edition + Static `/ar/` Architecture)

Bilingual (English / Arabic RTL) creative engineering portfolio for **Arqam Rashed**, Full-Stack Architect & Systems Developer in Luxor, Egypt.

Live Production Domain: **https://arqamrashed.com**  
Arabic SEO Route: **https://arqamrashed.com/ar/**  
GitHub Pages Mirror: **https://arkamrashed97.github.io/arqam-rashed/**

---

## Primary Modular Project & Synchronized Builds

This repository maintains strictly synchronized editions generated from the modular source of truth (see [`AGENTS.md`](./AGENTS.md)):

1. **MAIN PROJECT — Modular Root Architecture (Primary Source of Truth)**
   - [`index.html`](./index.html) — Semantic HTML shell with automatic content-hashed CSS (`css/app.min.css?v=<hash>`) and ES module `<script type="importmap">` (`?v=<hash>`).
   - [`ar/index.html`](./ar/index.html) — Crawlable pre-rendered Arabic RTL edition generated automatically from `index.html` + `js/i18n/ar.js` via `tools/build-ar.mjs`.
   - [`css/`](./css/) — 14 modular CSS stylesheets compiled into `css/app.min.css` (plus optional lazy `css/fishing.css`).
   - [`js/`](./js/) — 39 ES modules organized into `core/`, `gl/`, `i18n/`, `audio/`, and `features/`.
   - [`functions/`](./functions/) — Cloudflare Pages Functions (`_middleware.js` canonical redirect + `api/leaderboard.js`).
   - [`assets/img/`](./assets/img/) — Responsive WebP (`-sm.webp` + full `.webp`) portraits and project screenshots.
   - [`assets/docs/`](./assets/docs/) — Static downloadable CV (`Arqam-Rashed-CV.pdf`) and contact card (`Arqam-Rashed.vcf`).
   - [`assets/audio/`](./assets/audio/) — EBU R128 loudness-matched spatial ambient soundscapes and tactile UI SFX.
2. **Secondary Portable Single-File Edition ([`single-file/index.html`](./single-file/index.html))**
   - Generated automatically from the modular source via `npm run build` ([`tools/build-single.mjs`](./tools/build-single.mjs)).
   - Never edited directly; always rebuilt in lockstep with `ar/index.html` and `css/app.min.css`.

---

## Five-Act Experience

1. **Act I — Identity / Core**: Displaced ferrofluid icosahedron in obsidian, titanium, and acid lime (`act1-luxor-wind.mp3`).
2. **Act II — Selected Work**: Horizontal desktop multi-screenshot theater (vertical uncropped showcase on mobile) and case-study architecture modal for **TawfeekTours**, **ArkoClick**, and **RT Supplements** (`act2-kinetic-garden.mp3`).
3. **Act III — System Architecture**: Interactive 3D GPU particle topology with 4 selectable engineering clusters (`WEB & MOBILE`, `DATA & STORAGE`, `SYSTEMS`, `BIZDEV & ENTERPRISE ERP`) (`act3-crystal-resonance.mp3`).
4. **Act IV — Direct Signal**: Gravitational portal + interactive 3D liquid-silk sheet, one-click email copy, and live domain status probe (`act4-twilight-calm.mp3`).
5. **Act V — Project Scoping & Inquiry**: Direct project brief submission with localized domain selection, honeypot protection, instant WhatsApp session launch, and Footer CV PDF dossier (`act5-dialogue-presence.mp3`).

---

## Development Commands

```bash
# Compile css/app.min.css, ar/index.html, and single-file/index.html
npm run build

# Lint all ES modules and build tools
npm run lint

# Run automated Playwright verification (Desktop + Mobile + /ar/ + Single-File)
npm run verify

# Build, deploy to Cloudflare Pages, purge zone cache, and sync SD mirror
npm run deploy:cf
```
