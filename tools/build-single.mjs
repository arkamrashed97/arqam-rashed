import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'single-file');
const OUT_FILE = path.join(OUT_DIR, 'index.html');
const EMBED_ALL = process.argv.includes('--embed-all');

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

  // 0. Compute a content hash across all modular CSS and JS files so the MAIN modular
  //    project (index.html + css/ + js/) always busts stale browser caches in lockstep
  //    with single-file/index.html.
  const allCssRel = listFilesRecursive(path.join(ROOT, 'css')).map((f) => `css/${f}`);
  const allJsRel = listFilesRecursive(path.join(ROOT, 'js')).map((f) => `js/${f}`);
  const hash = crypto.createHash('sha256');
  for (const rel of [...allCssRel, ...allJsRel]) {
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
    three: 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js',
    'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/'
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

  let html = rootHtml;

  // 1. Collect all linked CSS files in order and minify via esbuild
  const cssRegex = /<link\s+rel="stylesheet"\s+href="(css\/[^"?]+)(?:\?v=[^"]*)?"\s*>/g;
  const cssFiles = [];
  let match = cssRegex.exec(html);
  while (match !== null) {
    cssFiles.push(match[1]);
    match = cssRegex.exec(html);
  }

  const rawCss = cssFiles
    .map((rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8'))
    .join('\n');

  const minifiedCss = await esbuild.transform(rawCss, {
    loader: 'css',
    minify: true
  });

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

  // Rewrite audio and doc paths in the bundled JS for single-file/index.html
  const vcardDataUri = toDataUri('assets/docs/Arqam-Rashed.vcf', 'text/vcard');
  if (EMBED_ALL) {
    const cvDataUri = toDataUri('assets/docs/Arqam-Rashed-CV.pdf', 'application/pdf');
    bundledJs = bundledJs.replace(/["']assets\/audio\/([^"']+\.mp3)["']/g, (_, file) => {
      const uri = toDataUri(`assets/audio/${file}`, 'audio/mpeg');
      return JSON.stringify(uri);
    });
    bundledJs = bundledJs.replace(/["']assets\/docs\/Arqam-Rashed-CV\.pdf["']/g, JSON.stringify(cvDataUri));
    bundledJs = bundledJs.replace(/["']assets\/docs\/Arqam-Rashed\.vcf["']/g, JSON.stringify(vcardDataUri));
  } else {
    bundledJs = bundledJs.replace(/["']assets\/audio\/([^"']+\.mp3)["']/g, '"../assets/audio/$1"');
    bundledJs = bundledJs.replace(/["']assets\/docs\/Arqam-Rashed-CV\.pdf["']/g, '"../assets/docs/Arqam-Rashed-CV.pdf"');
    bundledJs = bundledJs.replace(/["']assets\/docs\/Arqam-Rashed\.vcf["']/g, JSON.stringify(vcardDataUri));
  }

  // 3. Inline project images as data URIs so WebGL texture loader works even on file://
  const imgMimeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };
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
  //    and keep single-file importmap clean (only external three.js).
  const singleImportMap = JSON.stringify({
    imports: {
      three: 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js',
      'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/'
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
  console.log(`Built single-file/index.html (${sizeKb} KB, ${cssFiles.length} CSS modules + 29 JS modules bundled)`);
}

buildSingleFile().catch((err) => {
  console.error(err);
  process.exit(1);
});
