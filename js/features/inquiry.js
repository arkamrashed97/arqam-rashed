import { CONFIG } from '../config.js';
import { t } from '../i18n/i18n.js';
import { sound } from '../audio/index.js';

/**
 * Act V inquiry form.
 * POSTs JSON to CONFIG.formEndpoint. On network or server failure the visitor gets a
 * ready-made mailto link so no inquiry is ever lost.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initInquiry() {
  const form = document.getElementById('inquiry-form');
  if (!form) return;
  const feedback = document.getElementById('form-feedback');
  const submit = document.getElementById('form-submit-btn');
  const field = (id) => document.getElementById(id);

  function say(kind, message, html) {
    feedback.hidden = false;
    feedback.className = 'form-feedback' + (kind ? ' is-' + kind : '');
    if (html) feedback.innerHTML = html;
    else feedback.textContent = message;
  }

  function mark(input, bad) {
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = field('form-name');
    const email = field('form-email');
    const domain = field('form-domain');
    const message = field('form-message');

    const badName = !name.value.trim();
    const badEmail = !EMAIL_RE.test(email.value.trim());
    const badMessage = !message.value.trim();
    mark(name, badName);
    mark(email, badEmail);
    mark(message, badMessage);
    if (badName || badMessage) {
      say('error', t('formFill'));
      sound.play('form-error');
      (badName ? name : message).focus();
      return;
    }
    if (badEmail) {
      say('error', t('formBadEmail'));
      sound.play('form-error');
      email.focus();
      return;
    }

    const payload = {
      name: name.value.trim(),
      email: email.value.trim(),
      domain: domain.value,
      message: message.value.trim(),
      _subject: `Portfolio inquiry from ${name.value.trim()} [${domain.value}]`,
      _template: 'table',
      _captcha: 'false',
      _honey: ''
    };

    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    say('', t('formSending'));
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 15000);
      const response = await fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      window.clearTimeout(timer);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      say('success', t('formOk'));
      sound.play('form-success');
      form.reset();
    } catch (err) {
      const subject = encodeURIComponent('Project inquiry: ' + payload.domain);
      const body = encodeURIComponent(
        `Name: ${payload.name}\nEmail: ${payload.email}\nDomain: ${payload.domain}\n\n${payload.message}`
      );
      const link = `<a href="mailto:${CONFIG.email}?subject=${subject}&body=${body}">${t('formFailLink')} ↗</a>`;
      say('error', '', `${t('formFail')} ${link}`);
      sound.play('form-error');
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
    }
  });

  form.addEventListener('input', (event) => {
    if (event.target instanceof HTMLElement) event.target.setAttribute('aria-invalid', 'false');
  });
}
