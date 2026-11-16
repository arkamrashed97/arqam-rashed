import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { buildArabicPage } from './build-ar.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'single-file');
const OUT_FILE = path.join(OUT_DIR, 'index.html');
const EMBED_ALL = process.argv.includes('--embed-all');

const CSS_MODULES = [
  'css/fonts.css',
  'css/base.css',
  'css/chrome.css',
  'css/lang-gate.css',
  'css/typography.css',
  'css/act1.css',
  'css/act2.css',
  'css/act3.css',
  'css/act4.css',
  'css/footer.css',
  'css/responsive.css',
  'css/components.css',
  'css/modal-actions.css',
  'css/act5.css'
];

function toDataUri(relPath, mime) {
  const abs = path.join(ROOT, relPath);
  const buf = fs.readFileSync(abs);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function listFilesRecursive(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(full, baseDir));
    } else if (entry.isFile()) {
      files.push(path.relative(baseDir, full).replace(/\\/g, '/'));
    }
  }
  return files.sort();
}

async function buildSingleFile() {
  const htmlPath = path.join(ROOT, 'index.html');
  let rootHtml = fs.readFileSync(htmlPath, 'utf8');

  // 0. Compile & minify all modular CSS into css/app.min.css and compute a content hash
  //    across source CSS and JS files so the modular site always busts caches cleanly.
  const rawCss = CSS_MODULES
    .map((rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8'))
    .join('\n');

  const minifiedCss = await esbuild.transform(rawCss, {
    loader: 'css',
    minify: true
  });
  fs.writeFileSync(path.join(ROOT, 'css/app.min.css'), minifiedCss.code.trim(), 'utf8');

  const allJsRel = listFilesRecursive(path.join(ROOT, 'js')).map((f) => `js/${f}`);
  const hash = crypto.createHash('sha256');
  for (const rel of [...CSS_MODULES, ...allJsRel]) {
    hash.update(rel);
    hash.update(fs.readFileSync(path.join(ROOT, rel)));
  }
  const vTag = hash.digest('hex').slice(0, 8);

  // Update <link rel="stylesheet" href="css/...?v=..."> in root index.html
  rootHtml = rootHtml.replace(
    /<link\s+rel="stylesheet"\s+href="(css\/[^"?]+)(?:\?v=[^"]*)?"\s*>/g,
    `<link rel="stylesheet" href="$1?v=${vTag}">`
  );

  // Update <script type="importmap"> in root index.html so every modular ES import gets ?v=${vTag}
  const importMapEntries = {
    three: './assets/vendor/three/build/three.module.js',
    'three/addons/': './assets/vendor/three/examples/jsm/'
  };
  for (const jsRel of allJsRel) {
    importMapEntries[`./${jsRel}`] = `./${jsRel}?v=${vTag}`;
  }
  const importMapJson = JSON.stringify({ imports: importMapEntries }, null, 2);
  rootHtml = rootHtml.replace(
    /<script type="importmap">[\s\S]*?<\/script>/,
    `<script type="importmap">\n${importMapJson}\n</script>`
  );

  // Update <script type="module" src="js/main.js?v=..."> in root index.html
  rootHtml = rootHtml.replace(
    /<script type="module" src="js\/main\.js(?:\?v=[^"]*)?"><\/script>/,
    `<script type="module" src="js/main.js?v=${vTag}"></script>`
  );

  // Write the updated cache-busted modular root index.html back to disk
  fs.writeFileSync(htmlPath, rootHtml, 'utf8');

  // Generate static crawlable Arabic SEO route (ar/index.html) in lockstep
  buildArabicPage(ROOT);

  let html = rootHtml;

  // 1. Replace compiled stylesheet link with inline <style> block for single-file/index.html
  const cssRegex = /<link\s+rel="stylesheet"\s+href="(css\/[^"?]+)(?:\?v=[^"]*)?"\s*>/g;

  // Replace the block of <link rel="stylesheet" href="css/..."> tags with a single <style> block
  let replacedFirstCss = false;
  html = html.replace(cssRegex, () => {
    if (!replacedFirstCss) {
      replacedFirstCss = true;
      return `<style>\n${minifiedCss.code.trim()}\n</style>`;
    }
    return '';
  });

  // 2. Bundle js/main.js via esbuild
  const jsBuild = await esbuild.build({
    entryPoints: [path.join(ROOT, 'js/main.js')],
    bundle: true,
    format: 'esm',
    minify: true,
    write: false,
    external: ['three', 'three/*']
  });

  let bundledJs = jsBuild.outputFiles[0].text.trim();

  const imgMimeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
  };

  // Rewrite audio, image, vendor, and doc paths in the bundled JS for single-file/index.html
  const vcardPath = path.join(ROOT, 'assets/docs/Arqam-Rashed.vcf');
  const vcardDataUri = fs.existsSync(vcardPath) ? toDataUri('assets/docs/Arqam-Rashed.vcf', 'text/vcard') : '';
  const cvPath = path.join(ROOT, 'assets/docs/Arqam-Rashed-CV.pdf');
  const cvDataUri = fs.existsSync(cvPath) ? toDataUri('assets/docs/Arqam-Rashed-CV.pdf', 'application/pdf') : '';
  if (EMBED_ALL) {
    bundledJs = bundledJs.replace(/["']assets\/audio\/([^"']+\.mp3)["']/g, (_, file) => {
      const uri = toDataUri(`assets/audio/${file}`, 'audio/mpeg');
      return JSON.stringify(uri);
    });
    bundledJs = bundledJs.replace(/["']assets\/img\/([^"']+)["']/g, (_, file) => {
      const ext = path.extname(file).toLowerCase();
      const mime = imgMimeMap[ext] || 'application/octet-stream';
      return JSON.stringify(toDataUri(`assets/img/${file}`, mime));
    });
    bundledJs = bundledJs.replace(/["']assets\/vendor\/([^"']+)["']/g, '"../assets/vendor/$1"');
    if (cvDataUri) {
      bundledJs = bundledJs.replace(/["']assets\/docs\/Arqam-Rashed-CV\.pdf["']/g, JSON.stringify(cvDataUri));
    }
    if (vcardDataUri) {
      bundledJs = bundledJs.replace(/["']assets\/docs\/Arqam-Rashed\.vcf["']/g, JSON.stringify(vcardDataUri));
    }
  } else {
    bundledJs = bundledJs.replace(/["']assets\/audio\/([^"']+\.mp3)["']/g, '"../assets/audio/$1"');
    bundledJs = bundledJs.replace(/["']assets\/img\/([^"']+)["']/g, '"../assets/img/$1"');
    bundledJs = bundledJs.replace(/["']assets\/vendor\/([^"']+)["']/g, '"../assets/vendor/$1"');
    bundledJs = bundledJs.replace(/["']assets\/docs\/Arqam-Rashed-CV\.pdf["']/g, '"../assets/docs/Arqam-Rashed-CV.pdf"');
    if (vcardDataUri) {
      bundledJs = bundledJs.replace(/["']assets\/docs\/Arqam-Rashed\.vcf["']/g, JSON.stringify(vcardDataUri));
    }
  }

  // 3. Inline project & portrait images as data URIs so offline/single-file works everywhere;
  //    rewrite font preloads to ../assets/fonts/ and strip srcset on inline-URI images.
  html = html.replace(/href="assets\/fonts\/([^"]+)"/g, 'href="../assets/fonts/$1"');
  html = html.replace(/<link rel="preload" as="image"[^>]*>\s*/g, '');
  html = html.replace(/\s+srcset="assets\/img\/[^"]+"/g, '');
  html = html.replace(/src="(assets\/img\/[^"]+)"/g, (_, relPath) => {
    const ext = path.extname(relPath).toLowerCase();
    const mime = imgMimeMap[ext] || 'application/octet-stream';
    return `src="${toDataUri(relPath, mime)}"`;
  });

  // 4. Rewrite CV & vCard links for single-file/index.html
  if (EMBED_ALL) {
    html = html.replace(
      /href="assets\/docs\/Arqam-Rashed-CV\.pdf"/g,
      `href="${toDataUri('assets/docs/Arqam-Rashed-CV.pdf', 'application/pdf')}"`
    );
    html = html.replace(
      /href="assets\/docs\/Arqam-Rashed\.vcf"/g,
      `href="${toDataUri('assets/docs/Arqam-Rashed.vcf', 'text/vcard')}"`
    );
  } else {
    html = html.replace(
      /href="assets\/docs\/Arqam-Rashed-CV\.pdf"/g,
      'href="../assets/docs/Arqam-Rashed-CV.pdf"'
    );
    html = html.replace(
      /href="assets\/docs\/Arqam-Rashed\.vcf"/g,
      `href="${toDataUri('assets/docs/Arqam-Rashed.vcf', 'text/vcard')}"`
    );
  }

  // 5. Inline the bundled JS module in place of <script type="module" src="js/main.js..."></script>
  //    and point single-file vendor scripts + importmap to ../assets/vendor/
  html = html.replace(/src="assets\/vendor\/([^"]+)"/g, 'src="../assets/vendor/$1"');
  const singleImportMap = JSON.stringify({
    imports: {
      three: '../assets/vendor/three/build/three.module.js',
      'three/addons/': '../assets/vendor/three/examples/jsm/'
    }
  }, null, 2);
  html = html.replace(
    /<script type="importmap">[\s\S]*?<\/script>/,
    `<script type="importmap">\n${singleImportMap}\n</script>`
  );
  html = html.replace(
    /<script type="module" src="js\/main\.js(?:\?v=[^"]*)?"><\/script>/,
    () => `<script type="module">\n${bundledJs}\n</script>`
  );

  // Clean up any blank lines left from removed <link> tags
  html = html.replace(/\n{3,}/g, '\n\n');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, html, 'utf8');

  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`Built single-file/index.html (${sizeKb} KB, ${CSS_MODULES.length} CSS modules + ${allJsRel.length} JS modules bundled)`);
}

buildSingleFile().catch((err) => {
  console.error(err);
  process.exit(1);
});
