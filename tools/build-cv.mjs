import fs from 'node:fs';
import path from 'node:path';
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
const OUT_PDF = path.join(ROOT, 'assets/docs/Arqam-Rashed-CV.pdf');
const CHROME_PATH = process.env.CHROME_PATH || '/root/.cache/ms-playwright/chromium-1254/chrome-linux-arm64/chrome';

const CV_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Arqam Rashed — CV (Full-Stack Architect & Systems Developer)</title>
<style>
  @page {
    size: A4;
    margin: 14mm 15mm 14mm 15mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 10.2pt;
    line-height: 1.48;
    color: #111827;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  a {
    color: #0f172a;
    text-decoration: none;
    border-bottom: 1px solid #cbd5e1;
  }
  header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  h1 {
    font-size: 21pt;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #090d16;
    line-height: 1.1;
  }
  .subtitle {
    margin-top: 4px;
    font-size: 10.4pt;
    font-weight: 600;
    color: #334155;
    letter-spacing: 0.01em;
  }
  .contact {
    margin-top: 7px;
    font-size: 9.4pt;
    color: #334155;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
  }
  .contact span::after {
    content: "";
  }
  section {
    margin-bottom: 13px;
  }
  h2 {
    font-size: 9.5pt;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #0f172a;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 3px;
    margin-bottom: 7px;
  }
  p.summary {
    color: #1f2937;
    text-align: left;
  }
  .skills-grid {
    display: grid;
    grid-template-columns: 148px 1fr;
    row-gap: 4px;
    column-gap: 10px;
    font-size: 9.7pt;
  }
  .skills-grid dt {
    font-weight: 700;
    color: #0f172a;
  }
  .skills-grid dd {
    color: #1f2937;
  }
  .item {
    margin-bottom: 10px;
    page-break-inside: avoid;
  }
  .item:last-child {
    margin-bottom: 0;
  }
  .item-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
  }
  .item-title {
    font-size: 10.4pt;
    font-weight: 700;
    color: #090d16;
  }
  .item-meta {
    font-size: 9.2pt;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
  }
  .item-stack {
    font-size: 9.2pt;
    color: #475569;
    margin: 1px 0 4px;
    font-weight: 500;
  }
  ul {
    padding-left: 16px;
    color: #1f2937;
  }
  li {
    margin-bottom: 2.5px;
    font-size: 9.8pt;
  }
</style>
</head>
<body>
  <header>
    <h1>ARQAM MOHAMED RASHED</h1>
    <div class="subtitle">Full-Stack Architect &amp; Systems Developer — Next.js · Astro · React · TypeScript · Flutter · Supabase · Rust · Python</div>
    <div class="contact">
      <span>Luxor, Egypt</span>
      <span>·</span>
      <a href="https://wa.me/201016843477">+20 101 684 3477</a>
      <span>·</span>
      <a href="mailto:me@arqamrashed.com">me@arqamrashed.com</a>
      <span>·</span>
      <a href="https://arqamrashed.com">arqamrashed.com</a>
      <span>·</span>
      <a href="https://www.linkedin.com/in/arqam-m-aa5327ba">linkedin.com/in/arqam-m-aa5327ba</a>
      <span>·</span>
      <a href="https://github.com/arkamrashed97">github.com/arkamrashed97</a>
    </div>
  </header>

  <section>
    <h2>Professional Summary</h2>
    <p class="summary">
      Full-Stack Developer and Systems Architect delivering end-to-end production web platforms, cross-platform mobile apps, native Windows desktop tools, and enterprise management systems (Hotels, Clinics &amp; Retail ERP). Shipped commercial platforms powered by Astro, Next.js, React, TypeScript, Sanity CMS, and Supabase (PostgreSQL), owning schema architecture, RBAC/RLS security, multi-currency workflows, and edge deployment on Cloudflare Pages and Vercel. Creator of ArkoClick, an open-source Rust and Win32 automation utility with cryptographic SHA-256 auto-updates and zero idle CPU overhead. Combines software engineering with operational business development to turn complex real-world workflows into fast, reliable software.
    </p>
  </section>

  <section>
    <h2>Technical Skills</h2>
    <dl class="skills-grid">
      <dt>Web &amp; Frontend</dt>
      <dd>Next.js (App Router), Astro, React, TypeScript, JavaScript (ES2023+), Tailwind CSS, Three.js / WebGL2, Responsive RTL/LTR UI</dd>
      <dt>Mobile &amp; Cross-Platform</dt>
      <dd>Flutter, Dart (iOS &amp; Android), Offline-First State &amp; REST/Realtime Integration</dd>
      <dt>Backend, CMS &amp; Data</dt>
      <dd>Supabase, PostgreSQL, Row-Level Security (RLS) &amp; RBAC, Sanity CMS (Structured Studio), SQLite, Python Data Pipelines</dd>
      <dt>Native Desktop &amp; Systems</dt>
      <dd>Rust, egui, Win32 API (PostMessage / SendMessage / WinEvent Hooks), Min-Heap Scheduling, Inno Setup, SHA-256 Verification</dd>
      <dt>Cloud, DevOps &amp; ERP</dt>
      <dd>Cloudflare Pages &amp; Workers/Functions, Vercel, Custom Production DNS, Git/GitHub CI, Hotel, Clinic &amp; Retail ERP Systems</dd>
    </dl>
  </section>

  <section>
    <h2>Selected Shipped Systems</h2>

    <div class="item">
      <div class="item-head">
        <div class="item-title">TawfeekTours — Tourism Booking Platform &amp; CMS Dashboard · <a href="https://tawfeektours.com">tawfeektours.com</a></div>
        <div class="item-meta">Production</div>
      </div>
      <div class="item-stack">Stack: Astro, Sanity CMS, TypeScript, Tailwind CSS, Cloudflare Pages, Custom Production DNS</div>
      <ul>
        <li>Architected and shipped a high-speed Luxor &amp; Egypt tourism platform covering excursions, sunrise hot-air balloons, Nile cruises, hotels, and flight inquiries.</li>
        <li>Engineered a structured Sanity Studio CMS portal enabling operations staff to manage tour packages, seasonal schedules, and media in real time without code changes.</li>
        <li>Implemented live multi-currency pricing synchronization (USD / EGP / EUR), instant client-side catalog filtering, Schema.org structured SEO metadata, and direct WhatsApp booking flows.</li>
      </ul>
    </div>

    <div class="item">
      <div class="item-head">
        <div class="item-title">ArkoClick — Native Windows Background Automation · <a href="https://github.com/arkamrashed97/ArkoClick">github.com/arkamrashed97/ArkoClick</a></div>
        <div class="item-meta">Open Source · MIT</div>
      </div>
      <div class="item-stack">Stack: Rust, egui, Win32 API, Inno Setup</div>
      <ul>
        <li>Built a native Windows desktop tool that dispatches clicks and keyboard input to minimized or covered windows via Win32 PostMessage without hijacking the physical cursor.</li>
        <li>Designed a single-thread min-heap deadline scheduler achieving 0.00% idle CPU usage across concurrent tasks, paired with persistent window-handle rebinding.</li>
        <li>Delivered a full release pipeline: installer &amp; portable builds, SHA-256 verified in-app auto-updates, global hotkeys, tray mode, and full bilingual English/Arabic RTL shaping.</li>
      </ul>
    </div>

    <div class="item">
      <div class="item-head">
        <div class="item-title">RT Supplements — Retail &amp; Inventory Management System (ERP) · <a href="https://rtsupplements.vercel.app">rtsupplements.vercel.app</a></div>
        <div class="item-meta">Production</div>
      </div>
      <div class="item-stack">Stack: Next.js, React, TypeScript, Supabase (PostgreSQL), Tailwind CSS, Vercel</div>
      <ul>
        <li>Engineered a complete point-of-sale, barcode inventory, and financial reporting platform for dietary supplement retail operations with atomic stock-depletion handling.</li>
        <li>Built an isolated Demo Sandbox mode with simulated in-memory state so staff can train on every workflow without touching live inventory or accounting tables.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2>Professional Experience</h2>

    <div class="item">
      <div class="item-head">
        <div class="item-title">Operations Specialist — Bosta</div>
        <div class="item-meta">Egypt · Aug 2025 – Present</div>
      </div>
      <ul>
        <li>Manage daily shipping and last-mile logistics operations across tracking, exception resolution, and operational reporting.</li>
        <li>Independently designed and built internal web dashboards (Next.js, Supabase) to automate repetitive shipment tracking and reporting workflows, replacing manual spreadsheets with real-time operational visibility.</li>
      </ul>
    </div>

    <div class="item">
      <div class="item-head">
        <div class="item-title">Front Desk Receptionist — Grand Memphis Hotel</div>
        <div class="item-meta">Luxor · Oct 2024 – Jul 2025</div>
      </div>
      <ul>
        <li>Coordinated front-desk hospitality operations, guest check-ins, and high-volume room reservations using hotel property-management (ERP) software.</li>
      </ul>
    </div>

    <div class="item">
      <div class="item-head">
        <div class="item-title">Administrative Assistant / HR — AHE</div>
        <div class="item-meta">Cairo · Sep 2022 – Aug 2024</div>
      </div>
      <ul>
        <li>Managed core HR workflows, personnel records, employee relations, and day-to-day administrative operations.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2>Education &amp; Languages</h2>
    <div class="item">
      <div class="item-head">
        <div class="item-title">Bachelor's Degree in Tourism and Hotels — Luxor University, Egypt</div>
        <div class="item-meta">2017 – 2021</div>
      </div>
      <ul>
        <li><strong>Languages:</strong> Arabic (Native) · English (Professional Working Proficiency)</li>
      </ul>
    </div>
  </section>
</body>
</html>`;

async function buildCvPdf() {
  const browser = await chromium.launch({
    ...(fs.existsSync(CHROME_PATH) ? { executablePath: CHROME_PATH } : {}),
    headless: true
  });
  try {
    const page = await browser.newPage();
    await page.setContent(CV_HTML, { waitUntil: 'load' });
    await page.pdf({
      path: OUT_PDF,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true
    });
    const sizeKb = (fs.statSync(OUT_PDF).size / 1024).toFixed(1);
    console.log(`Built assets/docs/Arqam-Rashed-CV.pdf (${sizeKb} KB)`);
  } finally {
    await browser.close();
  }
}

buildCvPdf().catch((err) => {
  console.error(err);
  process.exit(1);
});
