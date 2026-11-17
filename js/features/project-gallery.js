import { sound } from '../audio/index.js';

/**
 * Interactive multi-screenshot gallery inside each Desktop Act II project card.
 * Keeps every screenshot uncropped (`object-fit: contain`) and lets visitors flip through
 * all screens directly inside the card without opening a modal.
 */
function buildGalleryForMedia(mediaEl, caseBtn) {
  const shots = Array.from(mediaEl.querySelectorAll('img.project__img, img.project__img-extra'));
  if (!shots.length) return null;

  mediaEl.classList.add('has-gallery');
  let activeIndex = 0;

  const setActive = (idx, withSfx = false) => {
    const next = (idx + shots.length) % shots.length;
    activeIndex = next;
    shots.forEach((img, i) => {
      img.classList.toggle('is-active-shot', i === next);
    });
    const thumbs = mediaEl.querySelectorAll('.project__thumb');
    thumbs.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === next);
      btn.setAttribute('aria-pressed', i === next ? 'true' : 'false');
    });
    const countEl = mediaEl.querySelector('.project__shot-count');
    if (countEl) {
      countEl.textContent = `${String(next + 1).padStart(2, '0')} / ${String(shots.length).padStart(2, '0')}`;
    }
    if (withSfx) sound.play('btn-act2');
  };

  shots[0].classList.add('is-active-shot');

  if (shots.length > 1) {
    const bar = document.createElement('div');
    bar.className = 'project__gallery-bar';

    const thumbsWrap = document.createElement('div');
    thumbsWrap.className = 'project__thumbs';

    shots.forEach((img, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `project__thumb${i === 0 ? ' is-active' : ''}`;
      btn.setAttribute('aria-label', img.alt || `Screenshot ${i + 1}`);
      btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      btn.setAttribute('data-sfx', 'none');
      btn.setAttribute('data-lenis-prevent', '');

      const thumbImg = document.createElement('img');
      thumbImg.src = img.currentSrc || img.getAttribute('src') || '';
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
    countEl.textContent = `01 / ${String(shots.length).padStart(2, '0')}`;

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'project__shot-btn';
    prevBtn.textContent = '‹';
    prevBtn.setAttribute('aria-label', 'Previous screenshot');
    prevBtn.setAttribute('data-sfx', 'none');
    prevBtn.setAttribute('data-lenis-prevent', '');
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setActive(activeIndex - 1, true);
    });

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'project__shot-btn';
    nextBtn.textContent = '›';
    nextBtn.setAttribute('aria-label', 'Next screenshot');
    nextBtn.setAttribute('data-sfx', 'none');
    nextBtn.setAttribute('data-lenis-prevent', '');
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setActive(activeIndex + 1, true);
    });

    controls.append(prevBtn, countEl, nextBtn);
    bar.append(thumbsWrap, controls);
    mediaEl.appendChild(bar);
  }

  // Clicking the active stage image opens the full case study modal on Desktop
  shots.forEach((img) => {
    img.addEventListener('click', () => {
      if (window.innerWidth > 900 && caseBtn) {
        caseBtn.click();
      }
    });
  });

  const syncThumbSources = () => {
    const thumbImgs = mediaEl.querySelectorAll('.project__thumb img');
    thumbImgs.forEach((tImg, i) => {
      const srcShot = shots[i];
      if (!srcShot) return;
      const nextSrc = srcShot.getAttribute('src') || '';
      if (nextSrc && tImg.getAttribute('src') !== nextSrc) {
        tImg.setAttribute('src', nextSrc);
      }
    });
  };

  setActive(0, false);
  return { syncThumbSources };
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
    instances.forEach((inst) => inst.syncThumbSources());
  });
}
