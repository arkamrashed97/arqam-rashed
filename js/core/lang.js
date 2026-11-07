import { t as translate } from '../i18n/i18n.js';

export const langCode = () => (document.documentElement.lang === 'ar' ? 'ar' : 'en');
export const langText = (key) => (
  translate(key, langCode())
);

export function whenLanguageReady() {
  return new Promise((resolve) => {
    if (!document.documentElement.classList.contains('lang-pending')) {
      resolve();
      return;
    }
    window.addEventListener('arqam:lang', () => resolve(), { once: true });
    // Resolve background scene prep after 250ms so Three.js renders under gate without stalling
    window.setTimeout(() => resolve(), 250);
  });
}
