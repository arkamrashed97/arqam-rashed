# Project Memory & Agent Rules (CLAUDE.md)

See [AGENTS.md](./AGENTS.md) for the complete project memory and mandatory dual-sync architecture rules.

## Core Golden Rule
1. **The Modular Root Project (`index.html` + `css/` + `js/` + `assets/` + `functions/`) is the MAIN project (Primary Source of Truth).**
2. **`single-file/index.html` is a secondary generated bundle** built automatically from the modular project via `npm run build` (`tools/build-single.mjs`).
3. **Both editions MUST always be updated together** on every change (`npm run build` updates root `index.html` cache-busting hashes `?v=<hash>` for all CSS/JS modules AND rebuilds `single-file/index.html`), and `/tmp/opencode/arqam-rashed` + `/mnt/sdcard/arqam rashed` must stay 100% synchronized.
