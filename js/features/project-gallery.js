import { sound } from '../audio/index.js';

function toThumbSrc(src) {
  if (!src || src.startsWith('data:')) return src || '';
  if (src.includes('-sm.webp')) return src;
  return src.replace(/\.webp(\?.*)?$/i, '-sm.webp$1');
}

/**
 * Interactive multi-screenshot gallery inside each Desktop Act II project card.
 * Keeps every screenshot uncropped (`object-fit: contain`), uses lightweight `-sm.webp`
 * thumbnails, skips building hidden thumbnail DOM on mobile viewports, and syncs
 * accessible labels across EN / AR switches.
 */
function buildGalleryForMedia(mediaEl, caseBtn) {
  const shots = Array.from(mediaEl.querySelectorAll('img.project__img, img.project__img-extra'));
  if (!shots.length) return null;

  mediaEl.classList.add('has-gallery');
  let activeIndex = 0;
  let barMounted = false;
  let prevBtn = null;
  let nextBtn = null;

  const setActive = (idx, withSfx = false) => {
    const next = (idx + shots.length) % shots.length;
    activeIndex = next;
    shots.forEach((img, i) => {
      img.classList.toggle('is-active-shot', i === next);
    });
    if (barMounted) {
      const thumbs = mediaEl.querySelectorAll('.project__thumb');
      thumbs.forEach((btn, i) => {
        btn.classList.toggle('is-active', i === next);
        btn.setAttribute('aria-pressed', i === next ? 'true' : 'false');
      });
      const countEl = mediaEl.querySelector('.project__shot-count');
      if (countEl) {
        countEl.textContent = `${String(next + 1).padStart(2, '0')} / ${String(shots.length).padStart(2, '0')}`;
      }
    }
    if (withSfx) sound.play('btn-act2');
  };

  const syncLabelsAndThumbs = () => {
    if (!barMounted) return;
    const isAr = document.documentElement.lang === 'ar';
    if (prevBtn) prevBtn.setAttribute('aria-label', isAr ? 'الصورة السابقة' : 'Previous screenshot');
    if (nextBtn) nextBtn.setAttribute('aria-label', isAr ? 'الصورة التالية' : 'Next screenshot');

    const thumbBtns = mediaEl.querySelectorAll('.project__thumb');
    thumbBtns.forEach((btn, i) => {
      const srcShot = shots[i];
      if (!srcShot) return;
      btn.setAttribute('aria-label', srcShot.alt || (isAr ? `لقطة ${i + 1}` : `Screenshot ${i + 1}`));
      const tImg = btn.querySelector('img');
      if (tImg) {
        const nextSrc = toThumbSrc(srcShot.getAttribute('src') || '');
        if (nextSrc && tImg.getAttribute('src') !== nextSrc) {
          tImg.setAttribute('src', nextSrc);
        }
      }
    });
  };

  const mountBarIfNeeded = () => {
    if (barMounted || shots.length <= 1 || window.innerWidth <= 900) return;
    barMounted = true;

    const bar = document.createElement('div');
    bar.className = 'project__gallery-bar';

    const thumbsWrap = document.createElement('div');
    thumbsWrap.className = 'project__thumbs';

    shots.forEach((img, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `project__thumb${i === activeIndex ? ' is-active' : ''}`;
      btn.setAttribute('aria-label', img.alt || `Screenshot ${i + 1}`);
      btn.setAttribute('aria-pressed', i === activeIndex ? 'true' : 'false');
      btn.setAttribute('data-sfx', 'none');
      btn.setAttribute('data-lenis-prevent', '');

      const thumbImg = document.createElement('img');
      thumbImg.src = toThumbSrc(img.getAttribute('src') || '');
      thumbImg.alt = '';
      thumbImg.loading = 'lazy';
      thumbImg.decoding = 'async';
      btn.appendChild(thumbImg);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setActive(i, true);
      });
      thumbsWrap.appendChild(btn);
    });

    const controls = document.createElement('div');
    controls.className = 'project__gallery-nav';

    const countEl = document.createElement('span');
    countEl.className = 'project__shot-count';
    countEl.dir = 'ltr';
    countEl.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(shots.length).padStart(2, '0')}`;

    prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'project__shot-btn';
    prevBtn.textContent = '‹';
    prevBtn.setAttribute('data-sfx', 'none');
    prevBtn.setAttribute('data-lenis-prevent', '');
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setActive(activeIndex - 1, true);
    });

    nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'project__shot-btn';
    nextBtn.textContent = '›';
    nextBtn.setAttribute('data-sfx', 'none');
    nextBtn.setAttribute('data-lenis-prevent', '');
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setActive(activeIndex + 1, true);
    });

    controls.append(prevBtn, countEl, nextBtn);
    bar.append(thumbsWrap, controls);
    mediaEl.appendChild(bar);
    syncLabelsAndThumbs();
  };

  shots[0].classList.add('is-active-shot');
  mountBarIfNeeded();

  // Clicking the active stage image opens the full case study modal on Desktop
  shots.forEach((img) => {
    img.addEventListener('click', () => {
      if (window.innerWidth > 900 && caseBtn) {
        caseBtn.click();
      }
    });
  });

  setActive(0, false);
  return { mountBarIfNeeded, syncLabelsAndThumbs };
}

export function initProjectGalleries() {
  const cards = document.querySelectorAll('.project');
  const instances = [];

  cards.forEach((card) => {
    const mediaEl = card.querySelector('.project__media');
    const caseBtn = card.querySelector('[data-case]');
    if (!mediaEl) return;
    const inst = buildGalleryForMedia(mediaEl, caseBtn);
    if (inst) instances.push(inst);
  });

  window.addEventListener('arqam:lang', () => {
    instances.forEach((inst) => inst.syncLabelsAndThumbs());
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      instances.forEach((inst) => inst.mountBarIfNeeded());
    }
  }, { passive: true });
}
