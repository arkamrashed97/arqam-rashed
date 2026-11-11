import EN from './en.js';
import AR from './ar.js';
import { BINDINGS } from './bindings.js';

/**
 * Language layer.
 *
 * - `lang`/`dir` on <html> are primed by the inline script in index.html <head> (no flash).
 * - `initLanguage()` applies the stored language, or leaves the onboarding gate pending.
 * - Every language change dispatches `arqam:lang` so live widgets (HUD, cluster labels...) re-render.
 */
const STORE_KEY = 'arqam-lang';
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
  DOWNLOAD: 'تحميل'
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
  toggle.textContent = code === 'en' ? 'ع' : 'EN';
  toggle.setAttribute('lang', code === 'en' ? 'ar' : 'en');
  toggle.setAttribute('aria-label', t(code === 'en' ? 'switchToAr' : 'switchToEn', code));
  toggle.setAttribute('title', code === 'en' ? 'العربية' : 'English');
}

export function applyLanguage(lang, persist) {
  const code = lang === 'ar' ? 'ar' : 'en';
  root.lang = code;
  root.dir = code === 'ar' ? 'rtl' : 'ltr';
  root.classList.remove('lang-pending');
  if (persist) writeStoredLang(code);
  applyBindings(code);
  applyCursorLabels(code);
  updateLangToggle(code);
  const arkoImg = document.getElementById('img-arko');
  if (arkoImg) {
    arkoImg.src = code === 'ar' ? 'assets/img/project-arko-dark.jpg' : 'assets/img/project-arko-light.jpg';
    arkoImg.alt = code === 'ar' ? 'واجهة برنامج أركوكليك لأتمتة سطح المكتب' : 'ArkoClick desktop automation interface';
  }
  document.title = t('pageTitle', code);
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', t('metaDesc', code));
  window.dispatchEvent(new CustomEvent('arqam:lang', { detail: { lang: code } }));
}

/** Applies the stored language. Returns true while the onboarding gate must stay open. */
export function initLanguage() {
  const stored = readStoredLang();
  if (stored) {
    applyLanguage(stored, false);
    root.classList.add('lang-set');
    return false;
  }
  return true;
}

export function toggleLanguage() {
  applyLanguage(currentLang() === 'en' ? 'ar' : 'en', true);
}
