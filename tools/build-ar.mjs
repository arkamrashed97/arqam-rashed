import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import AR from '../js/i18n/ar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(__dirname, '..');

function escAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function replacePattern(html, pattern, replacement, label) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  assert.ok(re.test(html), `build-ar: pattern not found for "${label}"`);
  return html.replace(re, replacement);
}

/**
 * Generates the static crawlable Arabic SEO route (`ar/index.html`) directly
 * from the hashed modular `index.html` and the canonical `js/i18n/ar.js` dictionary.
 */
export function buildArabicPage(rootDir = DEFAULT_ROOT) {
  const srcPath = path.join(rootDir, 'index.html');
  const outDir = path.join(rootDir, 'ar');
  const outPath = path.join(outDir, 'index.html');
  let html = fs.readFileSync(srcPath, 'utf8');

  // 1. Root <html> & SEO metadata for /ar/
  html = replacePattern(
    html,
    /<html lang="en" id="top">/,
    '<html lang="ar" dir="rtl" class="lang-set" id="top" data-asset-base="../" data-page-lang="ar">',
    'html tag'
  );
  html = replacePattern(html, /<title>[\s\S]*?<\/title>/, `<title>${escAttr(AR.pageTitle)}</title>`, 'title');
  html = replacePattern(
    html,
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escAttr(AR.metaDesc)}">`,
    'meta description'
  );
  html = replacePattern(
    html,
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${escAttr(AR.pageTitle)}">`,
    'og:title'
  );
  html = replacePattern(
    html,
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${escAttr(AR.metaDesc)}">`,
    'og:description'
  );
  html = replacePattern(
    html,
    /<meta property="og:url" content="[^"]*">/,
    '<meta property="og:url" content="https://arqamrashed.com/ar/">',
    'og:url'
  );
  html = replacePattern(
    html,
    /<meta property="og:locale" content="[^"]*">\s*<meta property="og:locale:alternate" content="[^"]*">/,
    '<meta property="og:locale" content="ar_EG">\n<meta property="og:locale:alternate" content="en_US">',
    'og:locale'
  );
  html = replacePattern(
    html,
    /<meta property="og:image:alt" content="[^"]*">/,
    '<meta property="og:image:alt" content="أرقم راشد — مطور برمجيات Full-Stack وتطوير أعمال في الأقصر، مصر">',
    'og:image:alt'
  );
  html = replacePattern(
    html,
    /<link rel="canonical" href="[^"]*">/,
    '<link rel="canonical" href="https://arqamrashed.com/ar/">',
    'canonical'
  );
  html = replacePattern(
    html,
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${escAttr(AR.pageTitle)}">`,
    'twitter:title'
  );
  html = replacePattern(
    html,
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${escAttr(AR.metaDesc)}">`,
    'twitter:description'
  );

  // Arabic Schema.org JSON-LD for /ar/
  const arJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': 'https://arqamrashed.com/#person',
        name: 'أرقم راشد',
        alternateName: ['Arqam Rashed', 'أرقم محمد راشد', 'Arqam Mohamed Rashed'],
        url: 'https://arqamrashed.com/ar/',
        image: 'https://arqamrashed.com/assets/img/og-image.jpg',
        jobTitle: 'مطور برمجيات Full-Stack وتطوير أعمال',
        description: AR.metaDesc,
        email: 'mailto:me@arqamrashed.com',
        address: { '@type': 'PostalAddress', addressLocality: 'الأقصر', addressCountry: 'EG' },
        knowsLanguage: ['ar', 'en'],
        knowsAbout: [
          'تطوير الويب المتكامل', 'تطوير الأعمال', 'Next.js', 'React', 'TypeScript',
          'Astro', 'Sanity CMS', 'Flutter', 'Dart', 'Python', 'Rust',
          'PostgreSQL', 'Supabase', 'SQLite', 'Three.js', 'أنظمة ERP'
        ],
        sameAs: [
          'https://github.com/arkamrashed97',
          'https://www.linkedin.com/in/arqam-m-aa5327ba'
        ]
      },
      {
        '@type': 'WebSite',
        '@id': 'https://arqamrashed.com/#website',
        url: 'https://arqamrashed.com/',
        name: 'أرقم راشد',
        alternateName: 'Arqam Rashed',
        inLanguage: ['ar', 'en'],
        publisher: { '@id': 'https://arqamrashed.com/#person' }
      },
      {
        '@type': 'ProfilePage',
        '@id': 'https://arqamrashed.com/ar/#profile',
        url: 'https://arqamrashed.com/ar/',
        name: AR.pageTitle,
        inLanguage: 'ar',
        isPartOf: { '@id': 'https://arqamrashed.com/#website' },
        mainEntity: { '@id': 'https://arqamrashed.com/#person' },
        dateModified: '2026-04-18'
      },
      {
        '@type': 'ItemList',
        name: 'أعمال مختارة',
        itemListElement: [
          { '@type': 'ListItem', position: 1, item: { '@type': 'WebSite', name: 'توفيق تورز — TawfeekTours', url: 'https://tawfeektours.com', description: AR.p1Desc, creator: { '@id': 'https://arqamrashed.com/#person' } } },
          { '@type': 'ListItem', position: 2, item: { '@type': 'SoftwareApplication', name: 'أركو كليك — ArkoClick', url: 'https://github.com/arkamrashed97/ArkoClick', operatingSystem: 'Windows', applicationCategory: 'UtilitiesApplication', license: 'https://opensource.org/licenses/MIT', description: AR.p2Desc, creator: { '@id': 'https://arqamrashed.com/#person' } } },
          { '@type': 'ListItem', position: 3, item: { '@type': 'WebApplication', name: 'آر تي للمكملات — RT Supplements', url: 'https://rtsupplements.vercel.app', applicationCategory: 'BusinessApplication', description: AR.p3Desc, creator: { '@id': 'https://arqamrashed.com/#person' } } }
        ]
      }
    ]
  };
  html = replacePattern(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${JSON.stringify(arJsonLd, null, 2)}\n</script>`,
    'JSON-LD'
  );

  // 2. Replace EN hero font preloads with Arabic hero preloads + strip gate
  html = replacePattern(
    html,
    /<link rel="preload" href="assets\/fonts\/archivo-black-latin-4eecb62d\.woff2"[^>]*>\s*<link rel="preload" href="assets\/fonts\/ibm-plex-mono-latin-cf8d2b0e\.woff2"[^>]*>/,
    `<link rel="preload" href="../assets/fonts/alexandria-arabic-d73b83a0.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../assets/fonts/ibm-plex-sans-arabic-arabic-00b30da7.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../assets/fonts/ibm-plex-sans-arabic-arabic-5ab42dd5.woff2" as="font" type="font/woff2" crossorigin>`,
    'ar font preloads'
  );

  html = replacePattern(
    html,
    /<script>\s*\(function \(\) \{\s*var root = document\.documentElement;[\s\S]*?\}\)\(\);\s*<\/script>/,
    `<script>
(function () {
  window.haptic = function (ms) {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms || 8);
    } catch (err) {}
  };
})();
</script>`,
    'inline head lang script'
  );

  html = replacePattern(
    html,
    /<div class="lang-gate" id="lang-gate"[\s\S]*?<a class="skip"/,
    `<a class="skip"`,
    'remove lang-gate'
  );

  // 3. Rewrite modular relative links so /ar/ loads assets cleanly from parent root
  html = html
    .replace(/href="css\//g, 'href="../css/')
    .replace(/href="assets\/docs\//g, 'href="../assets/docs/')
    .replace(/href="assets\/img\//g, 'href="../assets/img/')
    .replace(/src="assets\//g, 'src="../assets/')
    .replace(/srcset="assets\//g, 'srcset="../assets/')
    .replace(/imagesrcset="assets\//g, 'imagesrcset="../assets/')
    .replace(/, assets\/img\//g, ', ../assets/img/')
    .replace(/src="js\/main\.js/g, 'src="../js/main.js')
    .replace(/"\.\/assets\/vendor\//g, '"../assets/vendor/')
    .replace(/"\.\/js\//g, '"../js/');

  // 4. Static server-rendered Arabic content matching BINDINGS + metadata + images
  html = replacePattern(html, /<a class="skip" href="#main">[^<]*<\/a>/, `<a class="skip" href="#main">${AR.skip}</a>`, 'skip');

  // Boot overlay
  html = replacePattern(
    html,
    /<div id="boot"[\s\S]*?<div class="boot__pct">/,
    `<div id="boot" class="boot" hidden aria-hidden="true">
  <div class="boot__top">
    <span>${AR.bootTop1}</span>
    <span>${AR.bootTop2}</span>
  </div>
  <div class="boot__center">
    <ul class="boot__lines" id="boot-lines">
      <li><span>${AR.boot1}</span><b>OK</b></li>
      <li><span>${AR.boot2}</span><b>OK</b></li>
      <li><span>${AR.boot3}</span><b>OK</b></li>
      <li><span>${AR.boot4}</span><b>OK</b></li>
      <li><span>${AR.boot5}</span><b>OK</b></li>
    </ul>
    <div class="boot__pct">`,
    'boot lines'
  );
  html = replacePattern(
    html,
    /(<div class="boot__meta">\s*)<span>[^<]*<\/span>/,
    `$1<span>${AR.location}</span>`,
    'boot location'
  );

  // Header & Acts nav
  html = replacePattern(html, /<b id="hud-name">[^<]*<\/b>/, `<b id="hud-name">${AR.hudName}</b>`, 'hud-name');
  html = replacePattern(html, /<span id="hud-portfolio">[^<]*<\/span>/, `<span id="hud-portfolio">${AR.hudPortfolio}</span>`, 'hud-portfolio');
  html = replacePattern(html, /<span id="hud-act-name">[^<]*<\/span>/, `<span id="hud-act-name">${AR.actName0}</span>`, 'hud-act-name');
  html = replacePattern(
    html,
    /<button class="sound-toggle"[\s\S]*?<\/button>/,
    `<button class="sound-toggle" id="sound-toggle" type="button" aria-pressed="false" title="الصوت" data-sfx="none">
      <span class="sound-toggle__icon" aria-hidden="true">☊</span>
      <span class="sound-toggle__text" id="sound-label">${AR.soundLabel}</span>
    </button>`,
    'sound-toggle'
  );
  html = replacePattern(
    html,
    /<button class="lang-toggle" id="lang-toggle"[^>]*>[\s\S]*?<\/button>/,
    `<button class="lang-toggle" id="lang-toggle" type="button" lang="en" aria-label="EN — ${escAttr(AR.switchToEn)}" title="English">EN</button>`,
    'lang-toggle'
  );
  html = replacePattern(html, /<span id="motion-label">[^<]*<\/span>/, `<span id="motion-label">${AR.motionOn}</span>`, 'motion-label');

  html = replacePattern(
    html,
    /<nav class="act-nav"[\s\S]*?<\/nav>/,
    `<nav class="act-nav" aria-label="${escAttr(AR.actsLabel)}">
  <a href="#act-1" data-act-link="0" class="is-active"><span>01</span><span>${AR.navCore}</span></a>
  <a href="#work" data-act-link="1"><span>02</span><span>${AR.navWork}</span></a>
  <a href="#architecture" data-act-link="2"><span>03</span><span>${AR.navSystem}</span></a>
  <a href="#contact" data-act-link="3"><span>04</span><span>${AR.navSignal}</span></a>
  <a href="#inquiry" data-act-link="4"><span>05</span><span>${AR.navInquiry}</span></a>
</nav>`,
    'act-nav'
  );

  // Act I Hero
  html = replacePattern(
    html,
    /<div class="hero-top">[\s\S]*?<\/div>/,
    `<div class="hero-top">
    <span>${AR.heroTopLeft}</span>
    <span class="hero-top__right">${AR.heroTopRight}</span>
  </div>`,
    'hero-top'
  );
  html = replacePattern(
    html,
    /<h1 id="hero-title" aria-label="[^"]*">[\s\S]*?<\/h1>/,
    `<h1 id="hero-title" aria-label="${escAttr(AR.heroName)}">
      <span class="line" aria-hidden="true"><span class="line-inner" id="name-a">${AR.nameA}</span></span>
      <span class="line line--2" aria-hidden="true"><span class="line-inner" id="name-b">${AR.nameB}</span></span>
    </h1>`,
    'hero-title'
  );
  html = replacePattern(
    html,
    /<div class="hero-name__aside">[\s\S]*?<\/div>/,
    `<div class="hero-name__aside">
      <span>${AR.heroAside1}</span>
      <span>${AR.heroAside2}</span>
    </div>`,
    'hero-name__aside'
  );
  html = replacePattern(
    html,
    /(<img\s+class="hero-portrait__img"\s+id="hero-portrait-img"[^>]*alt=")[^"]*(")/,
    `$1${escAttr(AR.portraitAlt)}$2`,
    'portrait alt'
  );
  html = replacePattern(
    html,
    /<span id="hero-portrait-label">[^<]*<\/span>/,
    `<span id="hero-portrait-label">${AR.portraitLabel}</span>`,
    'portrait label'
  );
  html = replacePattern(
    html,
    /<div class="hero-bottom">\s*<div>[\s\S]*?<p class="hero-copy">[\s\S]*?<\/p>/,
    `<div class="hero-bottom">
    <div>
      <p class="hero-copy">${AR.heroCopy}</p>`,
    'hero-copy'
  );
  html = replacePattern(html, /<a class="scroll-cue" href="#work" data-cursor="SCROLL">[\s\S]*?<\/a>/, `<a class="scroll-cue" href="#work" data-cursor="SCROLL">${AR.scrollCue}</a>`, 'scroll-cue');
  html = replacePattern(
    html,
    /<div class="hero-facts" aria-label="[^"]*">[\s\S]*?(?=\s*<ul class="capabilities")/,
    `<div class="hero-facts" aria-label="${escAttr(AR.heroFactsLabel)}">
      <div><b>02</b><span>${AR.fact1}</span></div>
      <div><b>01</b><span>${AR.fact2}</span></div>
      <div><b>03</b><span>${AR.fact3}</span></div>
    </div>
  </div>`,
    'hero-facts'
  );
  html = replacePattern(
    html,
    /<ul class="capabilities" aria-label="[^"]*">[\s\S]*?<\/ul>/,
    `<ul class="capabilities" aria-label="${escAttr(AR.capLabel)}">
    <li>${AR.capBizDev}</li>
    <li>${AR.capNext}</li>
    <li>${AR.capReact}</li>
    <li>${AR.capTs}</li>
    <li>${AR.capFlutter}</li>
    <li>${AR.capPy}</li>
    <li>${AR.capSqlite}</li>
    <li>${AR.capPostgres}</li>
    <li>${AR.capSupabase}</li>
    <li>${AR.capErp}</li>
    <li>${AR.capRust}</li>
    <li>${AR.capThree}</li>
  </ul>`,
    'capabilities'
  );

  // Act II Projects
  html = replacePattern(
    html,
    /<div class="work-intro">[\s\S]*?(?=\s*<article class="project" data-project="0")/,
    `<div class="work-intro">
        <div>
          <div class="kicker">${AR.workKicker}</div>
          <h2 id="work-title">${AR.workTitle}</h2>
          <p>${AR.workIntro}</p>
        </div>
        <div class="work-intro__foot">
          <span>${AR.workFoot1}</span><br>
          <span>${AR.workFoot2}</span>
        </div>
      </div>`,
    'work-intro'
  );

  const projectLocal = [
    { type: AR.p1Type, desc: AR.p1Desc, stackLabel: AR.p1StackLabel, link: AR.p1Link, tag: AR.p1Tag },
    { type: AR.p2Type, desc: AR.p2Desc, stackLabel: AR.p2StackLabel, link: AR.p2Link, tag: AR.p2Tag },
    { type: AR.p3Type, desc: AR.p3Desc, stackLabel: AR.p3StackLabel, link: AR.p3Link, tag: AR.p3Tag }
  ];
  projectLocal.forEach((p, idx) => {
    html = replacePattern(
      html,
      new RegExp(`(<article class="project" data-project="${idx}"[\\s\\S]*?<div class="project__top"><span class="project__index">0${idx + 1}</span><span>)[^<]*(</span></div>)`),
      `$1${p.type}$2`,
      `project ${idx} type`
    );
    html = replacePattern(
      html,
      new RegExp(`(<article class="project" data-project="${idx}"[\\s\\S]*?<p class="project__desc">)[\\s\\S]*?(</p>)`),
      `$1${p.desc}$2`,
      `project ${idx} desc`
    );
    html = replacePattern(
      html,
      new RegExp(`(<article class="project" data-project="${idx}"[\\s\\S]*?<ul class="project__stack" aria-label=")[^"]*(">)`),
      `$1${escAttr(p.stackLabel)}$2`,
      `project ${idx} stackLabel`
    );
    html = replacePattern(
      html,
      new RegExp(`(<article class="project" data-project="${idx}"[\\s\\S]*?<a class="project__link"[^>]*>)[\\s\\S]*?(</a>)`),
      `$1${p.link}$2`,
      `project ${idx} link`
    );
    html = replacePattern(
      html,
      new RegExp(`(<button class="project__deep"[^>]*data-case="${idx}"[^>]*>)[\\s\\S]*?(</button>)`),
      `$1${AR.caseBtn}$2`,
      `project ${idx} caseBtn`
    );
    html = replacePattern(
      html,
      new RegExp(`(<div class="project__media" data-media="${idx}">[\\s\\S]*?<span class="project__tag">)[^<]*(</span>)`),
      `$1${p.tag}$2`,
      `project ${idx} tag`
    );
  });

  // Arabic image sources/alts in Act II
  html = replacePattern(
    html,
    /alt="TawfeekTours homepage hero and multi-currency bar"/,
    'alt="الواجهة الرئيسية لمنصة توفيق تورز ومحول العملات"',
    'alt tawfeek 1'
  );
  html = replacePattern(
    html,
    /alt="TawfeekTours filterable tour catalog and excursions"/,
    'alt="دليل الجولات والتصفية الفورية في منصة توفيق تورز"',
    'alt tawfeek 2'
  );
  html = replacePattern(
    html,
    /alt="TawfeekTours Nile cruise package detail and booking request"/,
    'alt="صفحة تفاصيل الباخرة النيلية والحجز المباشر في توفيق تورز"',
    'alt tawfeek 3'
  );
  html = replacePattern(
    html,
    /alt="TawfeekTours Sanity CMS Studio dashboard portal"/,
    'alt="لوحة تحكم Sanity Studio لإدارة المحتوى في توفيق تورز"',
    'alt tawfeek studio'
  );
  html = replacePattern(
    html,
    /id="img-arko"([^>]*)alt="ArkoClick application interface"/,
    'id="img-arko"$1alt="واجهة برنامج أركوكليك لأتمتة سطح المكتب"',
    'alt arko 1'
  );
  html = replacePattern(
    html,
    /id="img-arko-extra"([^>]*)alt="ArkoClick light theme English interface"/,
    'id="img-arko-extra"$1alt="الوضع الفاتح لبرنامج أركوكليك"',
    'alt arko 2'
  );
  html = replacePattern(
    html,
    /alt="RT Supplements retail system interface"/,
    'alt="واجهة منظومة آر تي للمكملات لإدارة المخازن ونقاط البيع"',
    'alt rt'
  );

  // Act III System Architecture
  html = replacePattern(
    html,
    /<div class="act-3__head">[\s\S]*?<\/div>\s*<div class="panels">/,
    `<div class="act-3__head">
    <div>
      <div class="kicker">${AR.sysKicker}</div>
      <h2 id="system-title">${AR.sysTitle}</h2>
    </div>
    <p>${AR.sysIntro}</p>
  </div>

  <div class="panels">`,
    'act-3__head'
  );
  html = replacePattern(
    html,
    /(<h3 class="glass__head"><span>)CLUSTER SELECT(<\/span><b id="cluster-label">)[^<]*(<\/b><\/h3>)/,
    `$1${AR.clusterSelect}$2${AR.cluster0Label}$3`,
    'cluster head'
  );
  html = replacePattern(
    html,
    /<div class="cluster-grid"[\s\S]*?<p class="panel-note">[^<]*<\/p>/,
    `<div class="cluster-grid" role="group" aria-label="${escAttr(AR.clusterGroupLabel)}">
        <button class="cluster" type="button" data-cluster="0" data-sfx="cluster-select" aria-pressed="true">
          <b>${AR.cluster0Label}</b><span>${AR.cluster0Stack}</span>
        </button>
        <button class="cluster" type="button" data-cluster="1" data-sfx="cluster-select" aria-pressed="false">
          <b>${AR.cluster1Label}</b><span>${AR.cluster1Stack}</span>
        </button>
        <button class="cluster" type="button" data-cluster="2" data-sfx="cluster-select" aria-pressed="false">
          <b>${AR.cluster2Label}</b><span>${AR.cluster2Stack}</span>
        </button>
        <button class="cluster" type="button" data-cluster="3" data-sfx="cluster-select" aria-pressed="false">
          <b>${AR.cluster3Label}</b><span>${AR.cluster3Stack}</span>
        </button>
      </div>
      <p class="cluster-status" id="cluster-status" role="status" aria-live="polite">${AR.clusterStatus0}</p>
      <p class="panel-note">${AR.panelNote1}</p>`,
    'cluster-grid'
  );
  html = replacePattern(
    html,
    /<div class="glass">\s*<h3 class="glass__head"><span>RUNTIME \/ VERIFIED[\s\S]*?(?=\s*<div class="act-3__context">)/,
    `<div class="glass">
      <h3 class="glass__head"><span>${AR.runtimeLabel}</span><b>${AR.runtimeLive}</b></h3>
      <dl>
        <div class="data-row"><dt>${AR.rowApp}</dt><dd>${AR.rowAppValue}</dd></div>
        <div class="data-row"><dt>${AR.rowMobile}</dt><dd>${AR.rowMobileValue}</dd></div>
        <div class="data-row"><dt>${AR.rowEnterprise}</dt><dd>${AR.rowEnterpriseValue}</dd></div>
        <div class="data-row"><dt>${AR.rowData}</dt><dd>${AR.rowDataValue}</dd></div>
        <div class="data-row"><dt>${AR.rowEmbedded}</dt><dd>${AR.rowLocalValue}</dd></div>
        <div class="data-row"><dt>${AR.rowNative}</dt><dd>${AR.rowNativeValue}</dd></div>
        <div class="data-row"><dt>${AR.rowAuth}</dt><dd>${AR.authValue}</dd></div>
        <div class="data-row"><dt>${AR.rowDeploy}</dt><dd>${AR.deployValue}</dd></div>
        <div class="data-row"><dt>${AR.rowRender}</dt><dd><span id="fps-2">60</span> FPS / <span id="gpu-mode">WEBGL2</span></dd></div>
      </dl>
      <p class="panel-note">${AR.panelNote2}</p>
    </div>
  </div>`,
    'runtime panel'
  );
  html = replacePattern(
    html,
    /<div class="act-3__context">[\s\S]*?<\/div>\s*<\/section>/,
    `<div class="act-3__context">
    <span>${AR.context1}</span>
    <span>${AR.context2}</span>
  </div>
</section>`,
    'act-3__context'
  );

  // Act IV Contact
  html = replacePattern(
    html,
    /<section id="contact"[\s\S]*?<\/section>/,
    `<section id="contact" class="act act-4" data-act="3" aria-labelledby="contact-title">
  <div class="contact-head">
    <span>${AR.signalKicker}</span>
    <span id="contact-head-meta">${AR.contactHeadMeta}</span>
  </div>

  <h2 id="contact-title" class="contact-title">
    ${AR.contactTitle}
  </h2>

  <div class="contact-grid">
    <div>
      <p class="contact-copy">${AR.contactCopy}</p>
      <p class="contact-note">${AR.contactNote}</p>
    </div>
    <div class="contact-actions">
      <button class="email-copy" id="email-copy" type="button" data-copy="me@arqamrashed.com" data-cursor="COPY" data-sfx="copy-success">
        <span class="email-copy__label">${AR.emailLabel}</span>
        <span class="email-copy__value">me@arqamrashed.com</span>
        <span class="email-copy__action" id="copy-action">${AR.copy}</span>
      </button>
      <button class="domain-status" id="domain-status" type="button" data-state="checking">
        <span class="domain-status__dot" aria-hidden="true"></span>
        <span id="domain-text" aria-live="polite">${AR.domainChecking}</span>
      </button>
    </div>
  </div>
</section>`,
    'act-4 contact'
  );

  // Act V Inquiry
  html = replacePattern(html, /<div class="kicker" id="inquiry-kicker">[^<]*<\/div>/, `<div class="kicker" id="inquiry-kicker">${AR.inquiryKicker}</div>`, 'inquiry-kicker');
  html = replacePattern(html, /<h2 id="inquiry-title">[\s\S]*?<\/h2>/, `<h2 id="inquiry-title">${AR.inquiryTitle}</h2>`, 'inquiry-title');
  html = replacePattern(html, /<p class="inquiry-intro" id="inquiry-intro">[\s\S]*?<\/p>/, `<p class="inquiry-intro" id="inquiry-intro">${AR.inquiryIntro}</p>`, 'inquiry-intro');
  html = replacePattern(html, /<label for="form-name" id="label-name">[\s\S]*?<\/label>/, `<label for="form-name" id="label-name">${AR.labelName}</label>`, 'label-name');
  html = replacePattern(html, /(<input type="text" id="form-name"[^>]*placeholder=")[^"]*("[^>]*>)/, `$1${escAttr(AR.placeholderName)}$2`, 'placeholderName');
  html = replacePattern(html, /<label for="form-email" id="label-email">[\s\S]*?<\/label>/, `<label for="form-email" id="label-email">${AR.labelEmail}</label>`, 'label-email');
  html = replacePattern(html, /<label for="form-domain" id="label-domain">[^<]*<\/label>/, `<label for="form-domain" id="label-domain">${AR.labelDomain}</label>`, 'label-domain');
  html = replacePattern(
    html,
    /<select id="form-domain" name="domain">[\s\S]*?<\/select>/,
    `<select id="form-domain" name="domain">
          <option value="Tourism &amp; Booking Platforms">${escAttr(AR.domainOpt0)}</option>
          <option value="Business Development &amp; Strategy">${escAttr(AR.domainOpt1)}</option>
          <option value="Native Windows Automation">${escAttr(AR.domainOpt2)}</option>
          <option value="Retail &amp; Inventory ERP">${escAttr(AR.domainOpt3)}</option>
          <option value="Mobile App (Flutter / Dart)">${escAttr(AR.domainOpt4)}</option>
          <option value="Enterprise Architecture &amp; Python">${escAttr(AR.domainOpt5)}</option>
        </select>`,
    'form-domain options'
  );
  html = replacePattern(html, /<label for="form-message" id="label-message">[\s\S]*?<\/label>/, `<label for="form-message" id="label-message">${AR.labelMessage}</label>`, 'label-message');
  html = replacePattern(html, /(<textarea id="form-message"[^>]*placeholder=")[^"]*("[^>]*>)/, `$1${escAttr(AR.placeholderMsg)}$2`, 'placeholderMsg');
  html = replacePattern(html, /<span id="submit-btn-text">[^<]*<\/span>/, `<span id="submit-btn-text">${AR.submitBtnText}</span>`, 'submit-btn-text');
  html = replacePattern(html, /<span id="wa-btn-text">[^<]*<\/span>/, `<span id="wa-btn-text">${AR.waBtnText}</span>`, 'wa-btn-text');

  // Footer & Mobile Nav
  html = replacePattern(
    html,
    /<footer class="site-footer" id="cv">[\s\S]*?<\/footer>/,
    `<footer class="site-footer" id="cv">
  <h2 class="sr-only">السيرة الذاتية وقنوات التواصل الموثقة</h2>
  <div class="footer-grid">
    <div class="cv-dossier">
      <div class="kicker" id="footer-cv-kicker">${AR.cvKicker}</div>
      <p class="cv-dossier__copy" id="footer-cv-copy">${AR.cvCopy}</p>
      <div class="cv-dossier__actions">
        <a class="cv-btn" id="footer-cv-btn" href="../assets/docs/Arqam-Rashed-CV.pdf" download="Arqam-Rashed-CV.pdf" data-download data-cursor="DOWNLOAD" data-sfx="download-ok">
          <span id="footer-cv-label">${AR.cvBtnLabel}</span>
          <span class="vcard-btn__meta" id="footer-cv-meta">${AR.cvMeta}</span>
        </a>
      </div>
    </div>
    <div>
      <div class="kicker">${AR.channelsLabel}</div>
      <nav class="footer-links" aria-label="${escAttr(AR.footerNavLabel)}">
        <a href="https://github.com/arkamrashed97" target="_blank" rel="noopener noreferrer" data-cursor="OPEN">${AR.footerLinkGh}</a>
        <a href="https://www.linkedin.com/in/arqam-m-aa5327ba" target="_blank" rel="noopener noreferrer" data-cursor="OPEN">${AR.footerLinkLi}</a>
        <a href="https://tawfeektours.com" target="_blank" rel="noopener noreferrer" data-cursor="OPEN">${AR.footerLinkTawfeek}</a>
        <a href="https://rtsupplements.vercel.app" target="_blank" rel="noopener noreferrer" data-cursor="OPEN">${AR.footerLinkRt}</a>
        <a href="https://github.com/arkamrashed97/ArkoClick" target="_blank" rel="noopener noreferrer" data-cursor="VIEW CODE">${AR.footerLinkArko}</a>
        <a href="mailto:me@arqamrashed.com" data-cursor="OPEN">${AR.footerLinkEmail}</a>
      </nav>
    </div>
  </div>
  <div class="footer-meta">
    <span>${AR.footerMeta1}</span>
    <a href="/" lang="en" hreflang="en" data-cursor="OPEN">ENGLISH EDITION</a>
    <span>THREE.JS / GSAP / LENIS / GLSL</span>
    <a href="#top" data-cursor="TOP">${AR.backToTop}</a>
  </div>
</footer>`,
    'footer'
  );

  html = replacePattern(
    html,
    /<nav class="mobile-nav"[\s\S]*?<\/nav>/,
    `<nav class="mobile-nav" aria-label="${escAttr(AR.sectionsLabel)}">
  <a href="#act-1" data-act-link="0" class="is-active"><span>${AR.mobileCore}</span></a>
  <a href="#work" data-act-link="1"><span>${AR.mobileWork}</span></a>
  <a href="#architecture" data-act-link="2"><span>${AR.mobileSystem}</span></a>
  <a href="#contact" data-act-link="3"><span>${AR.mobileSignal}</span></a>
  <a href="#inquiry" data-act-link="4"><span>${AR.mobileInquiry}</span></a>
</nav>`,
    'mobile-nav'
  );

  // Modal default copy in Arabic
  html = replacePattern(
    html,
    /<div class="project-modal__index" id="modal-index">[^<]*<\/div>\s*<button class="project-modal__close" id="modal-close" type="button" aria-label="[^"]*"/,
    `<div class="project-modal__index" id="modal-index">01 / دراسة معمارية النظام</div>\n      <button class="project-modal__close" id="modal-close" type="button" aria-label="إغلاق النافذة"`,
    'modal header'
  );
  html = replacePattern(
    html,
    /<h4 id="modal-arch-title">[^<]*<\/h4>/,
    '<h4 id="modal-arch-title">القرارات المعمارية والتقنية</h4>',
    'modal-arch-title'
  );
  html = replacePattern(
    html,
    /<a id="modal-link"[^>]*>[^<]*<\/a>/,
    '<a id="modal-link" href="#" target="_blank" rel="noopener noreferrer" class="cta">معاينة المنصة الحية ↗</a>',
    'modal-link'
  );

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`Built ar/index.html (${sizeKb} KB, static RTL Arabic SEO edition)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildArabicPage(DEFAULT_ROOT);
}
