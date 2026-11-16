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
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
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
      let absPath = path.join(ROOT, relPath);
      if (absPath.startsWith(ROOT) && fs.existsSync(absPath) && fs.statSync(absPath).isDirectory()) {
        absPath = path.join(absPath, 'index.html');
      }
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

  // 2b. Sound Toggle OFF -> ON Verification
  await page.click('#sound-toggle');
  await page.waitForTimeout(80);
  const soundOffCheck = await page.evaluate(() => ({
    pressed: document.getElementById('sound-toggle')?.getAttribute('aria-pressed'),
    label: document.getElementById('sound-label')?.textContent?.trim(),
    pref: localStorage.getItem('arqam-sound')
  }));
  assert.equal(soundOffCheck.pressed, 'false', `${label}: #sound-toggle click should turn sound OFF`);
  assert.equal(soundOffCheck.label, 'SOUND: OFF', `${label}: #sound-label should read SOUND: OFF when muted`);
  assert.equal(soundOffCheck.pref, 'off', `${label}: localStorage arqam-sound should be 'off'`);

  await page.click('#sound-toggle');
  await page.waitForTimeout(80);
  const soundOnCheck = await page.evaluate(() => ({
    pressed: document.getElementById('sound-toggle')?.getAttribute('aria-pressed'),
    label: document.getElementById('sound-label')?.textContent?.trim(),
    pref: localStorage.getItem('arqam-sound')
  }));
  assert.equal(soundOnCheck.pressed, 'true', `${label}: second #sound-toggle click should turn sound back ON`);
  assert.equal(soundOnCheck.label, 'SOUND: ON', `${label}: #sound-label should read SOUND: ON when enabled`);
  assert.equal(soundOnCheck.pref, 'on', `${label}: localStorage arqam-sound should be 'on'`);
  console.log('  [PASS] Sound toggle OFF <-> ON verified cleanly');

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

  // 4. Verification that Footer CV dossier is present & redundant Act IV action buttons are removed
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
      footerCvHref: footerCvBtn ? footerCvBtn.getAttribute('href') : null,
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
  assert.equal(cvRemovalCheck.hasFooterCvBtn, true, `${label}: #footer-cv-btn must be present in Footer`);
  assert.ok(cvRemovalCheck.footerCvHref && cvRemovalCheck.footerCvHref.endsWith('assets/docs/Arqam-Rashed-CV.pdf'), `${label}: #footer-cv-btn must link to CV PDF`);
  assert.equal(cvRemovalCheck.hasVcardBtn, false, `${label}: #vcard-btn must be removed from Act IV`);
  assert.equal(cvRemovalCheck.hasCtaEmail, false, `${label}: #cta-email must be removed from Act IV`);
  assert.equal(cvRemovalCheck.hasCtaWa, false, `${label}: #cta-wa must be removed from Act IV`);
  assert.equal(cvRemovalCheck.hasCvDossier, true, `${label}: .cv-dossier must be present in Footer`);
  assert.equal(cvRemovalCheck.hasEmailCopy, true, `${label}: #email-copy must remain in Act IV`);
  assert.equal(cvRemovalCheck.hasDomainStatus, true, `${label}: #domain-status must remain in Act IV`);
  assert.equal(cvRemovalCheck.hasTimelineDom, false, `${label}: .timeline must be removed from DOM`);
  assert.equal(cvRemovalCheck.hasBostaOrGrandMemphis, false, `${label}: inline CV work history must not appear in page text`);
  console.log('  [PASS] Footer CV dossier restored and redundant Act IV buttons confirmed removed');

  // 5. Case Study Modal & Scroll Transitions across Acts I..V
  await page.evaluate(() => window.scrollTo(0, document.getElementById('work').offsetTop + 60));
  await page.waitForTimeout(300);
  await page.locator('[data-case="0"]').dispatchEvent('click');
  await page.waitForTimeout(250);
  const modalCheck = await page.evaluate(() => ({
    open: !document.getElementById('project-modal').hidden,
    title: document.getElementById('modal-title')?.textContent?.trim(),
    shotCount: document.querySelectorAll('#modal-frame img').length,
    hasSequoia: /sequoia/i.test(document.body.innerText)
  }));
  assert.equal(modalCheck.open, true, `${label}: project modal should open on case study click`);
  assert.equal(modalCheck.title, 'TAWFEEK TOURS', `${label}: Case study 0 must be TAWFEEK TOURS`);
  assert.ok(modalCheck.shotCount >= 4, `${label}: Case study 0 modal must display all TawfeekTours screenshots (${modalCheck.shotCount})`);
  assert.equal(modalCheck.hasSequoia, false, `${label}: legacy Sequoia Travel reference must be removed`);
  await page.locator('#modal-close').dispatchEvent('click');
  await page.waitForTimeout(250);
  console.log(`  [PASS] Case study modal opens and renders ${modalCheck.shotCount} TawfeekTours screenshots cleanly`);

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

  // Verify Act II stacks vertically on mobile and displays all screenshots uncropped on scroll-down
  const workTop = await page.evaluate(() => document.getElementById('work').offsetTop);
  await page.evaluate((y) => window.scrollTo(0, y + 100), workTop);
  await page.waitForTimeout(400);

  // Trigger lazy-loaded images along Act II by scrolling through each project
  const imgCount = await page.locator('.project__media img').count();
  for (let i = 0; i < imgCount; i++) {
    await page.locator('.project__media img').nth(i).scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
  }

  const mobileWorkCheck = await page.evaluate(() => {
    const track = document.getElementById('work-track');
    const projects = [...document.querySelectorAll('.project')];
    const imgs = [...document.querySelectorAll('.project__media img')];
    const tops = projects.map((p) => p.getBoundingClientRect().top + window.scrollY);
    const imgMetrics = imgs.map((img) => {
      const rect = img.getBoundingClientRect();
      const natRatio = img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0;
      const renRatio = rect.height ? rect.width / rect.height : 0;
      return {
        src: img.getAttribute('src')?.slice(0, 60),
        visible: getComputedStyle(img).display !== 'none' && Number(getComputedStyle(img).opacity) > 0.5,
        complete: img.complete && img.naturalWidth > 0,
        width: rect.width,
        height: rect.height,
        ratioDiff: natRatio && renRatio ? Math.abs(natRatio - renRatio) / natRatio : 1
      };
    });
    return {
      flexDir: getComputedStyle(track).flexDirection,
      projectTopsAscending: tops.length === 3 && tops[1] > tops[0] + 50 && tops[2] > tops[1] + 50,
      imgCount: imgs.length,
      allVisible: imgMetrics.every((m) => m.visible && m.complete && m.height > 80),
      allUncropped: imgMetrics.every((m) => m.ratioDiff < 0.08),
      imgMetrics
    };
  });
  assert.equal(mobileWorkCheck.flexDir, 'column', 'Mobile Act II track must stack vertically');
  assert.equal(mobileWorkCheck.projectTopsAscending, true, 'Mobile projects must stack vertically down the page');
  assert.ok(mobileWorkCheck.imgCount >= 7, `Expected >= 7 project screenshots on mobile, got ${mobileWorkCheck.imgCount}`);
  assert.equal(mobileWorkCheck.allVisible, true, `All mobile project images must be visible & loaded: ${JSON.stringify(mobileWorkCheck.imgMetrics)}`);
  assert.equal(mobileWorkCheck.allUncropped, true, `All mobile project images must preserve natural aspect ratio: ${JSON.stringify(mobileWorkCheck.imgMetrics)}`);
  console.log(`  [PASS] Mobile vertical scroll-down displays all ${mobileWorkCheck.imgCount} uncropped project screenshots`);
  await context.close();
}

async function verifySeo(browser, baseUrl) {
  console.log('\n=== Verifying SEO essentials & /ar/ Arabic route ===');
  for (const [file, needle] of [
    ['robots.txt', 'Sitemap: https://arqamrashed.com/sitemap.xml'],
    ['sitemap.xml', '<loc>https://arqamrashed.com/</loc>'],
    ['sitemap.xml', '<loc>https://arqamrashed.com/ar/</loc>'],
    ['sitemap.xml', 'xhtml:link rel="alternate" hreflang="ar"'],
    ['site.webmanifest', '"start_url"'],
    ['404.html', 'noindex']
  ]) {
    const body = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(body.includes(needle), `${file} must contain ${needle}`);
  }
  for (const file of ['favicon.ico', 'favicon.svg', 'ar/index.html', 'assets/img/arqam-portrait.webp', 'assets/img/arqam-portrait-sm.webp', 'assets/img/og-image.jpg', 'assets/img/icons/apple-touch-icon.png']) {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} must exist`);
  }

  // Raw HTML check of /ar/ (verifies what search crawlers see without JS)
  const rawArHtml = fs.readFileSync(path.join(ROOT, 'ar/index.html'), 'utf8');
  assert.ok(rawArHtml.includes('<html lang="ar" dir="rtl"'), 'ar/index.html must declare lang="ar" dir="rtl"');
  assert.ok(!rawArHtml.includes('id="lang-gate"'), 'ar/index.html must not block first paint with #lang-gate');
  assert.ok(rawArHtml.includes('بُنيت<br><em>لأقصى كفاءة.</em>'), 'ar/index.html must contain static Arabic work heading');
  assert.ok(rawArHtml.includes('تطوير الأعمال والأنظمة'), 'ar/index.html must contain Arabic capabilities');

  for (const [route, expectedCanonical, expectedLang] of [
    ['/', 'https://arqamrashed.com/', 'en'],
    ['/ar/', 'https://arqamrashed.com/ar/', 'ar']
  ]) {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
    const seo = await page.evaluate(() => {
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
      const alternates = Object.fromEntries(
        [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((el) => [el.getAttribute('hreflang'), el.href])
      );
      const nodes = ld.flatMap((d) => d['@graph'] || [d]);
      const person = nodes.find((n) => n['@type'] === 'Person');
      return {
        lang: document.documentElement.lang,
        h1Count: document.querySelectorAll('h1').length,
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content || '',
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        ogImage: document.querySelector('meta[property="og:image"]')?.content,
        alternates,
        sameAs: person?.sameAs || [],
        hasFooterLinkedIn: Boolean(document.querySelector('.footer-links a[href*="linkedin.com/in/arqam-m-aa5327ba"]')),
        ldTypes: nodes.map((n) => n['@type'])
      };
    });
    await page.close();
    assert.equal(seo.lang, expectedLang, `${route}: lang mismatch`);
    assert.equal(seo.h1Count, 1, `${route}: Exactly one <h1> expected, got ${seo.h1Count}`);
    assert.ok(seo.title.length >= 20 && seo.title.length <= 70, `${route}: Title length out of range: ${seo.title}`);
    assert.ok(seo.desc.length >= 70 && seo.desc.length <= 240, `${route}: Meta description length out of range (${seo.desc.length})`);
    assert.equal(seo.canonical, expectedCanonical, `${route}: canonical mismatch`);
    assert.equal(seo.alternates.en, 'https://arqamrashed.com/', `${route}: hreflang=en mismatch`);
    assert.equal(seo.alternates.ar, 'https://arqamrashed.com/ar/', `${route}: hreflang=ar mismatch`);
    assert.equal(seo.alternates['x-default'], 'https://arqamrashed.com/', `${route}: hreflang=x-default mismatch`);
    assert.ok(seo.sameAs.some((u) => u.includes('linkedin.com/in/arqam-m-aa5327ba')), `${route}: JSON-LD Person.sameAs must include LinkedIn`);
    assert.equal(seo.hasFooterLinkedIn, true, `${route}: Footer must include LinkedIn channel link`);
    assert.ok(seo.ogImage && seo.ogImage.endsWith('og-image.jpg'), `${route}: og:image must be set`);
    assert.ok(seo.ldTypes.includes('Person') && seo.ldTypes.includes('ProfilePage'), `${route}: JSON-LD must include Person + ProfilePage`);
  }

  // Runtime interactive check on /ar/ (mobile + desktop): 0 404s, case study modal, RTL 0px overflow
  const arCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const arPage = await arCtx.newPage();
  const arErrors = [];
  const arFailedRequests = [];
  arPage.on('pageerror', (err) => arErrors.push(err.message));
  arPage.on('response', (res) => {
    if (res.url().startsWith(baseUrl) && res.status() >= 400) {
      arFailedRequests.push(`${res.status()} ${res.url()}`);
    }
  });
  await arPage.goto(`${baseUrl}/ar/`, { waitUntil: 'load' });
  await arPage.waitForTimeout(500);
  const arRuntime = await arPage.evaluate(() => {
    const pImg = document.getElementById('hero-portrait-img');
    const pRect = pImg ? pImg.getBoundingClientRect() : null;
    return {
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      hasGate: Boolean(document.getElementById('lang-gate')),
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      nameA: document.getElementById('name-a')?.textContent?.trim(),
      nameB: document.getElementById('name-b')?.textContent?.trim(),
      portraitLoaded: Boolean(pImg && pImg.complete && pImg.naturalWidth > 0),
      portraitAboveFold: Boolean(pRect && pRect.top >= 0 && pRect.bottom <= window.innerHeight + 20 && pRect.height > 100)
    };
  });
  assert.equal(arRuntime.lang, 'ar');
  assert.equal(arRuntime.dir, 'rtl');
  assert.equal(arRuntime.hasGate, false);
  assert.equal(arRuntime.nameA, 'أرقم');
  assert.equal(arRuntime.nameB, 'راشد');
  assert.equal(arRuntime.portraitLoaded, true, '/ar/ hero portrait must load cleanly');
  assert.equal(arRuntime.portraitAboveFold, true, '/ar/ mobile hero portrait must appear above the fold on first load');
  assert.ok(arRuntime.scrollWidth <= arRuntime.innerWidth, `/ar/ mobile overflow: ${arRuntime.scrollWidth} > ${arRuntime.innerWidth}`);
  await arPage.locator('[data-case="0"]').dispatchEvent('click');
  await arPage.waitForTimeout(300);
  const modalImgsLoaded = await arPage.evaluate(async () => {
    const imgs = [...document.querySelectorAll('#modal-frame img')];
    imgs.forEach((img) => { img.loading = 'eager'; });
    await Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; }))));
    return imgs.length >= 4 && imgs.every((img) => img.naturalWidth > 0);
  });
  assert.equal(modalImgsLoaded, true, '/ar/ modal screenshots must load via ../assets/img/');
  assert.equal(arErrors.length, 0, `/ar/ pageerrors: ${arErrors.join('; ')}`);
  assert.equal(arFailedRequests.length, 0, `/ar/ failed local requests: ${arFailedRequests.join('; ')}`);
  await arCtx.close();

  console.log('  [PASS] robots.txt, sitemap.xml, manifest, 404, favicons, /ar/ static & runtime RTL, reciprocal hreflang, canonical, JSON-LD');
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
    await verifySeo(browser, baseUrl);
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
