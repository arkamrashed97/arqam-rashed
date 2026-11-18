import EN from './en.js';
import AR from './ar.js';
import { BINDINGS } from './bindings.js';
import { assetPath } from '../core/utils.js';

/**
 * Language layer.
 *
 * - `lang`/`dir` on <html> are primed by the inline script in index.html <head> (no flash).
 * - `initLanguage()` applies the stored language, or leaves the onboarding gate pending.
 * - Every language change dispatches `arqam:lang` so live widgets (HUD, cluster labels...) re-render.
 */
const STORE_KEY = 'arqam-lang';
const SESSION_OVERRIDE_KEY = 'arqam-route-override';
const root = document.documentElement;

export const I18N = { en: EN, ar: AR };

const CURSOR_AR = {
  VIEW: 'عرض',
  'VIEW CODE': 'عرض الكود',
  OPEN: 'فتح',
  COPY: 'نسخ',
  EXPLORE: 'استكشاف',
  SCROLL: 'تمرير',
  TOP: 'أعلى',
  JUMP: 'انتقال',
  SELECT: 'اختيار',
  SAVE: 'حفظ',
  CHAT: 'محادثة',
  DEEP: 'تفاصيل',
  DOWNLOAD: 'تحميل',
  IDENTITY: 'الهوية'
};

export function currentLang() {
  return root.lang === 'ar' ? 'ar' : 'en';
}

export function t(key, lang = currentLang()) {
  const table = I18N[lang] || I18N.en;
  if (table[key] != null) return table[key];
  return I18N.en[key] != null ? I18N.en[key] : key;
}

export function cursorLabel(label) {
  return currentLang() === 'ar' ? CURSOR_AR[label] || label : label;
}

export function readStoredLang() {
  try {
    const value = localStorage.getItem(STORE_KEY);
    return value === 'ar' || value === 'en' ? value : null;
  } catch (err) {
    return null;
  }
}

function writeStoredLang(value) {
  try {
    localStorage.setItem(STORE_KEY, value);
  } catch (err) {
    /* storage is optional */
  }
}

function applyBindings(code) {
  for (const binding of BINDINGS) {
    const nodes = document.querySelectorAll(binding.sel);
    nodes.forEach((node, index) => {
      const key = binding.keys ? binding.keys[index] : binding.key;
      if (!key) return;
      const value = t(key, code);
      if (binding.prop) node.setAttribute(binding.prop, value);
      else if (binding.html) node.innerHTML = value;
      else node.textContent = value;
    });
  }
}

function applyCursorLabels(code) {
  document.querySelectorAll('[data-cursor]').forEach((el) => {
    if (!el.hasAttribute('data-cursor-en')) el.setAttribute('data-cursor-en', el.getAttribute('data-cursor'));
    const base = el.getAttribute('data-cursor-en');
    el.setAttribute('data-cursor', code === 'ar' ? CURSOR_AR[base] || base : base);
  });
}

function updateLangToggle(code) {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;
  const sym = code === 'en' ? 'ع' : 'EN';
  toggle.textContent = sym;
  toggle.setAttribute('lang', code === 'en' ? 'ar' : 'en');
  toggle.setAttribute('aria-label', `${sym} — ${t(code === 'en' ? 'switchToAr' : 'switchToEn', code)}`);
  toggle.setAttribute('title', code === 'en' ? 'العربية' : 'English');
}

export function applyLanguage(lang, persist) {
  const code = lang === 'ar' ? 'ar' : 'en';
  root.lang = code;
  root.dir = code === 'ar' ? 'rtl' : 'ltr';
  root.classList.remove('lang-pending');
  if (persist) writeStoredLang(code);
  applyBindings(code);
  root.classList.remove('i18n-hydrating');
  applyCursorLabels(code);
  updateLangToggle(code);
  const arkoImg = document.getElementById('img-arko');
  const arkoExtra = document.getElementById('img-arko-extra');
  if (arkoImg) {
    const sm = assetPath(code === 'ar' ? 'assets/img/project-arko-dark-sm.webp' : 'assets/img/project-arko-light-sm.webp');
    const full = assetPath(code === 'ar' ? 'assets/img/project-arko-dark.webp' : 'assets/img/project-arko-light.webp');
    arkoImg.src = full;
    arkoImg.srcset = `${sm} 660w, ${full} 976w`;
    arkoImg.alt = code === 'ar' ? 'واجهة برنامج أركوكليك لأتمتة سطح المكتب' : 'ArkoClick desktop automation interface';
  }
  if (arkoExtra) {
    const sm = assetPath(code === 'ar' ? 'assets/img/project-arko-light-sm.webp' : 'assets/img/project-arko-dark-sm.webp');
    const full = assetPath(code === 'ar' ? 'assets/img/project-arko-light.webp' : 'assets/img/project-arko-dark.webp');
    arkoExtra.src = full;
    arkoExtra.srcset = `${sm} 660w, ${full} 976w`;
    arkoExtra.alt = code === 'ar' ? 'الوضع الفاتح لبرنامج أركوكليك' : 'ArkoClick dark mode Arabic interface';
  }
  document.title = t('pageTitle', code);
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', t('metaDesc', code));
  const canonicalUrl = code === 'ar' ? 'https://arqamrashed.com/ar/' : 'https://arqamrashed.com/';
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', canonicalUrl);
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);
  window.dispatchEvent(new CustomEvent('arqam:lang', { detail: { lang: code } }));
}

/** Applies the stored language (or forces the page's route language). Returns true while the gate must stay open. */
export function initLanguage() {
  if (root.dataset.pageLang === 'ar') {
    let override = null;
    try { override = sessionStorage.getItem(SESSION_OVERRIDE_KEY); } catch (err) { override = null; }
    applyLanguage(override === 'en' ? 'en' : 'ar', false);
    root.classList.add('lang-set');
    return false;
  }
  const stored = readStoredLang();
  if (stored) {
    applyLanguage(stored, false);
    root.classList.add('lang-set');
    return false;
  }
  return true;
}

export function toggleLanguage() {
  const next = currentLang() === 'en' ? 'ar' : 'en';
  if (root.dataset.pageLang === 'ar') {
    try {
      if (next === 'en') sessionStorage.setItem(SESSION_OVERRIDE_KEY, 'en');
      else sessionStorage.removeItem(SESSION_OVERRIDE_KEY);
    } catch (err) {
      /* sessionStorage is optional */
    }
  }
  applyLanguage(next, true);
}
