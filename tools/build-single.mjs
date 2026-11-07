import fs from 'node:fs';
import path from 'node:path';
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

async function buildSingleFile() {
  const htmlPath = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  // 1. Collect all linked CSS files in order and minify via esbuild
  const cssRegex = /<link\s+rel="stylesheet"\s+href="(css\/[^"]+)"\s*>/g;
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

  // 5. Inline the bundled JS module in place of <script type="module" src="js/main.js"></script>
  html = html.replace(
    '<script type="module" src="js/main.js"></script>',
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
