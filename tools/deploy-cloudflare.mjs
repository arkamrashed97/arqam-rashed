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

function main() {
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
      { stdio: 'inherit', env: process.env }
    );
  } finally {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }
}

main();
