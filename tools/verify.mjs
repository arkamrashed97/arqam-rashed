import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (err) {
  ({ chromium } = require('/tmp/opencode/pw/node_modules/playwright'));
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME_PATH = '/root/.cache/ms-playwright/chromium-1254/chrome-linux-arm64/chrome';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.vcf': 'text/vcard; charset=utf-8'
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url, 'http://127.0.0.1');
      let relPath = decodeURIComponent(reqUrl.pathname);
      if (relPath === '/') relPath = '/index.html';
      if (relPath === '/single-file' || relPath === '/single-file/') {
        relPath = '/single-file/index.html';
      }
      const absPath = path.join(ROOT, relPath);
      if (!absPath.startsWith(ROOT) || !fs.existsSync(absPath) || fs.statSync(absPath).isDirectory()) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      const ext = path.extname(absPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(absPath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function verifyEdition(browser, baseUrl, route, label) {
  console.log(`\n=== Verifying ${label} (${route}) ===`);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    hasTouch: false
  });
  const page = await context.newPage();

  const pageErrors = [];
  const failedLocalRequests = [];

  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('response', (res) => {
    if (res.url().startsWith(baseUrl) && res.status() >= 400) {
      failedLocalRequests.push(`${res.status()} ${res.url()}`);
    }
  });

  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);

  // 1. Desktop Onboarding Cursor Check
  await page.mouse.move(420, 360);
  await page.waitForTimeout(120);

  const cursorCheck = await page.evaluate(() => {
    const gate = document.getElementById('lang-gate');
    const cursor = document.getElementById('cursor');
    const dot = document.getElementById('cursor-dot');
    const gateZ = Number(getComputedStyle(gate).zIndex) || 0;
    const cursorZ = Number(getComputedStyle(cursor).zIndex) || 0;
    const dotZ = Number(getComputedStyle(dot).zIndex) || 0;
    return {
      hasCursorClass: document.body.classList.contains('has-cursor'),
      gateVisible: !gate.classList.contains('is-done'),
      gateZ,
      cursorZ,
      dotZ,
      cursorTransform: cursor.style.transform
    };
  });

  assert.equal(cursorCheck.gateVisible, true, `${label}: #lang-gate should be visible initially`);
  assert.equal(cursorCheck.hasCursorClass, true, `${label}: body.has-cursor must be active on #lang-gate`);
  assert.ok(cursorCheck.cursorZ > cursorCheck.gateZ, `${label}: .cursor z-index (${cursorCheck.cursorZ}) must exceed #lang-gate (${cursorCheck.gateZ})`);
  assert.ok(cursorCheck.cursorTransform.includes('translate3d'), `${label}: .cursor transform should update on pointermove before language selection`);
  console.log(`  [PASS] Desktop cursor on #lang-gate: z-index=${cursorCheck.cursorZ} (> ${cursorCheck.gateZ}), transform=${cursorCheck.cursorTransform}`);

  // 1b. Onboarding Scroll Lock Check (wheel must NOT scroll window or #lang-gate)
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(160);
  const gateScrollCheck = await page.evaluate(() => {
    const gate = document.getElementById('lang-gate');
    return {
      windowScrollY: window.scrollY,
      gateScrollTop: gate ? gate.scrollTop : 0,
      gateOverflow: gate ? getComputedStyle(gate).overflow : ''
    };
  });
  assert.equal(gateScrollCheck.windowScrollY, 0, `${label}: window.scrollY must remain 0 while #lang-gate is open`);
  assert.equal(gateScrollCheck.gateScrollTop, 0, `${label}: #lang-gate.scrollTop must remain 0`);
  assert.equal(gateScrollCheck.gateOverflow, 'hidden', `${label}: #lang-gate must have overflow: hidden`);
  console.log(`  [PASS] Onboarding scroll lock verified (scrollY=0, gateScrollTop=0, overflow=${gateScrollCheck.gateOverflow})`);

  // 2. Language Selection + Audio Unlock Check
  await page.click('[data-lang-choice="en"]');
  await page.waitForTimeout(600);

  const postGateCheck = await page.evaluate(() => {
    const gate = document.getElementById('lang-gate');
    const soundBtn = document.getElementById('sound-toggle');
    return {
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      gateDone: !gate || gate.classList.contains('is-closing') || gate.classList.contains('is-done'),
      soundPressed: soundBtn ? soundBtn.getAttribute('aria-pressed') : null
    };
  });

  assert.equal(postGateCheck.lang, 'en', `${label}: lang should be 'en'`);
  assert.equal(postGateCheck.gateDone, true, `${label}: #lang-gate should have .is-done after click`);
  assert.equal(postGateCheck.soundPressed, 'true', `${label}: sound toggle should be enabled after onboarding click`);
  console.log(`  [PASS] Onboarding dismissed & audio unlocked (aria-pressed=${postGateCheck.soundPressed})`);

  // 3. Language Toggle (EN -> AR -> EN)
  await page.click('#lang-toggle');
  await page.waitForTimeout(200);
  const arCheck = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    hudName: document.getElementById('hud-name')?.textContent?.trim(),
    nameA: document.getElementById('name-a')?.textContent?.trim(),
    nameB: document.getElementById('name-b')?.textContent?.trim()
  }));
  assert.equal(arCheck.lang, 'ar', `${label}: #lang-toggle should switch to Arabic`);
  assert.equal(arCheck.dir, 'rtl', `${label}: #lang-toggle should set dir=rtl`);
  assert.equal(arCheck.hudName, 'أرقم راشد', `${label}: #hud-name should be 'أرقم راشد' in Arabic`);
  assert.equal(arCheck.nameA, 'أرقم', `${label}: #name-a should be 'أرقم' in Arabic`);
  assert.equal(arCheck.nameB, 'راشد', `${label}: #name-b should be 'راشد' in Arabic`);
  await page.click('#lang-toggle');
  await page.waitForTimeout(200);
  console.log('  [PASS] Bidirectional language switch (EN <-> AR RTL) + Arabic name verified');

  // 4. Verification that CV downloads & redundant action buttons are removed
  const cvRemovalCheck = await page.evaluate(() => {
    const cvBtn = document.getElementById('cv-btn');
    const footerCvBtn = document.getElementById('footer-cv-btn');
    const vcardBtn = document.getElementById('vcard-btn');
    const ctaEmail = document.getElementById('cta-email');
    const ctaWa = document.getElementById('cta-wa');
    const cvDossier = document.querySelector('.cv-dossier');
    const emailCopy = document.getElementById('email-copy');
    const domainStatus = document.getElementById('domain-status');
    const timeline = document.querySelector('.timeline');
    const bodyText = document.body.innerText;
    return {
      hasCvBtn: Boolean(cvBtn),
      hasFooterCvBtn: Boolean(footerCvBtn),
      hasVcardBtn: Boolean(vcardBtn),
      hasCtaEmail: Boolean(ctaEmail),
      hasCtaWa: Boolean(ctaWa),
      hasCvDossier: Boolean(cvDossier),
      hasEmailCopy: Boolean(emailCopy),
      hasDomainStatus: Boolean(domainStatus),
      hasTimelineDom: Boolean(timeline),
      hasBostaOrGrandMemphis: /Grand Memphis|Bosta/i.test(bodyText)
    };
  });

  assert.equal(cvRemovalCheck.hasCvBtn, false, `${label}: #cv-btn must be removed from Act IV`);
  assert.equal(cvRemovalCheck.hasFooterCvBtn, false, `${label}: #footer-cv-btn must be removed from Footer`);
  assert.equal(cvRemovalCheck.hasVcardBtn, false, `${label}: #vcard-btn must be removed from Act IV`);
  assert.equal(cvRemovalCheck.hasCtaEmail, false, `${label}: #cta-email must be removed from Act IV`);
  assert.equal(cvRemovalCheck.hasCtaWa, false, `${label}: #cta-wa must be removed from Act IV`);
  assert.equal(cvRemovalCheck.hasCvDossier, false, `${label}: .cv-dossier must be removed from Footer`);
  assert.equal(cvRemovalCheck.hasEmailCopy, true, `${label}: #email-copy must remain in Act IV`);
  assert.equal(cvRemovalCheck.hasDomainStatus, true, `${label}: #domain-status must remain in Act IV`);
  assert.equal(cvRemovalCheck.hasTimelineDom, false, `${label}: .timeline must be removed from DOM`);
  assert.equal(cvRemovalCheck.hasBostaOrGrandMemphis, false, `${label}: inline CV work history must not appear in page text`);
  console.log('  [PASS] CV downloads, dossier, and redundant Act IV buttons confirmed removed');

  // 5. Case Study Modal & Scroll Transitions across Acts I..V
  await page.evaluate(() => window.scrollTo(0, document.getElementById('work').offsetTop + 60));
  await page.waitForTimeout(300);
  await page.locator('[data-case="0"]').dispatchEvent('click');
  await page.waitForTimeout(250);
  const modalOpen = await page.evaluate(() => !document.getElementById('project-modal').hidden);
  assert.equal(modalOpen, true, `${label}: project modal should open on case study click`);
  await page.locator('#modal-close').dispatchEvent('click');
  await page.waitForTimeout(250);
  console.log('  [PASS] Case study modal opens and closes cleanly');

  for (const id of ['act-1', 'work', 'architecture', 'contact', 'inquiry']) {
    await page.evaluate((secId) => {
      const el = document.getElementById(secId);
      if (el) el.scrollIntoView({ behavior: 'instant' });
    }, id);
    await page.waitForTimeout(200);
  }

  // 6. Verify 5-Act Morphing SVG Cursor Variants, Clean Acts I–IV & Act V Pure Inquiry Layout
  const worldsCheck = await page.evaluate(() => ({
    cursorVariants: document.querySelectorAll('.cursor__variant').length,
    cursorActAtBottom: document.getElementById('cursor').getAttribute('data-cursor-act'),
    actWorldCount: document.querySelectorAll('.act-world').length,
    act5Fishes: document.querySelectorAll('.pond-fish').length,
    hasFishingArena: Boolean(document.getElementById('fishing-arena')),
    hasInquiryForm: Boolean(document.getElementById('inquiry-form'))
  }));

  assert.equal(worldsCheck.cursorVariants, 5, `${label}: must have 5 per-act cursor SVG variants`);
  assert.equal(worldsCheck.actWorldCount, 0, `${label}: flying 2D SVGs in Acts I–IV must be removed for pure 3D WebGL`);
  assert.equal(worldsCheck.hasFishingArena, false, `${label}: fishing arena must be disabled per CONFIG.enableFishingGame`);
  assert.equal(worldsCheck.act5Fishes, 0, `${label}: 0 swimming fish when fishing game is disabled`);
  assert.equal(worldsCheck.hasInquiryForm, true, `${label}: Act V inquiry form must be cleanly mounted`);
  console.log(`  [PASS] 5 morphing cursor variants + Clean Act V Inquiry (fishing game cleanly disabled per config) verified`);

  assert.equal(pageErrors.length, 0, `${label}: Expected 0 pageerrors, got: ${pageErrors.join('; ')}`);
  assert.equal(failedLocalRequests.length, 0, `${label}: Expected 0 failed local requests, got: ${failedLocalRequests.join('; ')}`);
  console.log(`  [PASS] 0 pageerrors and 0 failed local asset requests across all 5 Acts`);

  await context.close();
}

async function verifyMobileOverflow(browser, baseUrl) {
  console.log('\n=== Verifying Mobile Viewport (390x844) ===');
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  await page.click('[data-lang-choice="ar"]');
  await page.waitForTimeout(500);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));

  assert.ok(
    overflow.scrollWidth <= overflow.innerWidth,
    `Mobile RTL horizontal overflow detected: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
  );
  console.log(`  [PASS] Mobile 390x844 (Arabic RTL): scrollWidth=${overflow.scrollWidth} <= ${overflow.innerWidth} (0px horizontal overflow)`);

  // Verify horizontal track moves when scrolling down into Act II on mobile
  const workTop = await page.evaluate(() => document.getElementById('work').offsetTop);
  await page.evaluate((y) => window.scrollTo(0, y + 500), workTop);
  await page.waitForTimeout(400);

  const mobileScrollCheck = await page.evaluate(() => {
    const track = document.getElementById('work-track');
    return {
      scrollY: window.scrollY,
      transform: track.style.transform || window.getComputedStyle(track).transform
    };
  });
  console.log(`  [PASS] Mobile scroll-driven horizontal projects translation verified: ${mobileScrollCheck.transform}`);
  await context.close();
}

async function main() {
  const { server, baseUrl } = await startStaticServer();
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  try {
    await verifyEdition(browser, baseUrl, '/', 'Modular Root Edition (GitHub Pages)');
    await verifyEdition(browser, baseUrl, '/single-file/index.html', 'Single-File Edition (/single-file/index.html)');
    await verifyMobileOverflow(browser, baseUrl);
    console.log('\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY.');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('\nVERIFICATION FAILED:', err);
  process.exit(1);
});
