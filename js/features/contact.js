import { CONFIG } from '../config.js';
import { sound } from '../audio/index.js';

/**
 * Contact helpers that must follow the active language.
 * The CV (PDF) and the contact card (VCF) are plain static files in assets/docs/,
 * served through <a download>. Nothing is generated in JavaScript any more.
 */
const WA_TEXT = {
  en: 'Hello Arqam, I viewed your portfolio and would like to discuss a project with you.',
  ar: 'مرحباً أرقم، اطلعت على معرض أعمالك وأرغب في مناقشة مشروع برمجي معك.'
};

function localiseWhatsApp() {
  const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(WA_TEXT[lang])}`;
  document.querySelectorAll('#cta-wa, #form-wa-btn').forEach((a) => a.setAttribute('href', href));
}

export function initContact() {
  localiseWhatsApp();
  window.addEventListener('arqam:lang', localiseWhatsApp);

  document.querySelectorAll('[data-download]').forEach((a) => {
    a.addEventListener('click', () => sound.play('download-ok'));
  });
}
