import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const STAGE_ITEMS = [
  'index.html',
  '_headers',
  'css',
  'js',
  'assets',
  'single-file'
];

const SDCARD_DIR = '/mnt/sdcard/arqam rashed';
const ZONE_ID = '233d796ba1b6a9377e5753b7c193108c';

async function main() {
  // Always synchronize root modular index.html (?v=hash) and single-file/index.html before deploying
  execFileSync('node', [path.join(ROOT, 'tools/build-single.mjs')], {
    stdio: 'inherit',
    cwd: ROOT
  });

  const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arqam-cf-deploy-'));
  try {
    for (const item of STAGE_ITEMS) {
      const src = path.join(ROOT, item);
      const dest = path.join(stageDir, item);
      if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true });
      }
    }
    execFileSync(
      'wrangler',
      [
        'pages',
        'deploy',
        stageDir,
        '--project-name=arqam-rashed',
        '--branch=main',
        '--commit-dirty=true'
      ],
      { stdio: 'inherit', cwd: ROOT, env: process.env }
    );

    // Purge Cloudflare Zone cache so https://arqamrashed.com/ immediately serves fresh modular assets
    if (process.env.CLOUDFLARE_API_TOKEN) {
      try {
        const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ purge_everything: true })
        });
        const data = await res.json();
        console.log('Cloudflare Zone cache purged:', Boolean(data.success));
      } catch (err) {
        console.warn('Cache purge warning:', err.message);
      }
    }

    // Mirror synchronized files to /mnt/sdcard/arqam rashed if present
    if (fs.existsSync(SDCARD_DIR)) {
      for (const item of [...STAGE_ITEMS, 'AGENTS.md', 'CLAUDE.md', 'README.md', 'package.json', 'tools', 'functions', 'plans']) {
        const src = path.join(ROOT, item);
        const dest = path.join(SDCARD_DIR, item);
        if (fs.existsSync(src)) {
          fs.cpSync(src, dest, { recursive: true, force: true });
        }
      }
      console.log(`Synchronized modular project + single-file to ${SDCARD_DIR}`);
    }
  } finally {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }
}

main();
