'use strict';

function galleryText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function galleryHttp(value) {
  const raw = galleryText(value);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function galleryImage(value) {
  const raw = galleryText(value);
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return galleryHttp(raw);
}

function positiveSize(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

function normalizeArtwork(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const image = galleryImage(entry.image);
  if (!image) return null;
  const title = galleryText(entry.title);
  return {
    image,
    width: positiveSize(entry.width),
    height: positiveSize(entry.height),
    title,
    character: galleryText(entry.character),
    name_en: galleryText(entry.name_en),
    series: galleryText(entry.series),
    artist: galleryText(entry.artist),
    source_url: galleryHttp(entry.source_url),
    artist_url: galleryHttp(entry.artist_url),
    alt: galleryText(entry.alt) || title,
    featured: entry.featured !== false,
    note: galleryText(entry.note)
  };
}

function normalizeGallery(source, fallbackArtwork) {
  const data = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
  const items = (Array.isArray(data.items) ? data.items : []).flatMap(entry => {
    const item = normalizeArtwork(entry);
    return item ? [item] : [];
  });
  const fallback = normalizeArtwork(fallbackArtwork);
  return {
    title: galleryText(data.title) || '爱弥斯画廊',
    eyebrow: galleryText(data.eyebrow) || 'AEMEATH GALLERY',
    description: galleryText(data.description) || '收集喜欢的爱弥斯同人插画，每一张都保留完整构图与画师署名。',
    items: items.length ? items : (fallback ? [{ ...fallback, featured: true, series: fallback.series || '鸣潮' }] : [])
  };
}

function featuredArtworks(items, fallbackArtwork) {
  const featured = (Array.isArray(items) ? items : []).filter(item => item && item.image && item.featured !== false);
  if (featured.length) return featured;
  const fallback = normalizeArtwork(fallbackArtwork);
  return fallback ? [{ ...fallback, featured: true, series: fallback.series || '鸣潮' }] : [];
}

function galleryStep(current, total, step) {
  const count = Math.floor(Number(total));
  if (!Number.isFinite(count) || count <= 0) return 0;
  const index = Number.isFinite(Number(current)) ? Math.trunc(Number(current)) : 0;
  const delta = Number.isFinite(Number(step)) ? Math.trunc(Number(step)) : 0;
  return ((index + delta) % count + count) % count;
}

if (typeof module === 'object' && module.exports) module.exports = { normalizeGallery, featuredArtworks, galleryStep, normalizeArtwork };

if (typeof document !== 'undefined') {
  const galleryPage = document.querySelector('[data-gallery-page]');
  const dialog = galleryPage && galleryPage.querySelector('[data-gallery-dialog]');
  const dataNode = document.getElementById('gallery-data');
  if (galleryPage && dialog && dataNode && typeof dialog.showModal === 'function') {
    let items = [];
    try { items = JSON.parse(dataNode.textContent || '[]'); }
    catch { items = []; }
    let index = 0;
    const image = dialog.querySelector('[data-gallery-image]');
    const title = dialog.querySelector('[data-gallery-title]');
    const note = dialog.querySelector('[data-gallery-note]');
    const source = dialog.querySelector('[data-gallery-source]');
    const artist = dialog.querySelector('[data-gallery-artist]');
    const credit = dialog.querySelector('[data-gallery-credit]');
    const previous = dialog.querySelector('[data-gallery-prev]');
    const next = dialog.querySelector('[data-gallery-next]');
    function show(nextIndex) {
      if (!items.length) return;
      index = galleryStep(nextIndex, items.length, 0);
      const item = items[index];
      image.src = item.image;
      image.alt = item.alt || item.title || '';
      title.textContent = item.title ? `《${item.title}》` : item.character || '插画';
      credit.textContent = [item.character, item.series].filter(Boolean).join(' · ');
      note.textContent = item.note || '';
      note.hidden = !item.note;
      source.hidden = !item.source_url;
      if (item.source_url) source.href = item.source_url;
      artist.hidden = !item.artist_url;
      if (item.artist_url) {
        artist.href = item.artist_url;
        artist.textContent = `${item.artist || '画师'} ↗`;
      }
      const single = items.length < 2;
      previous.disabled = single;
      next.disabled = single;
    }
    function open(nextIndex) {
      show(nextIndex);
      if (!dialog.open) dialog.showModal();
    }
    galleryPage.addEventListener('click', event => {
      const opener = event.target.closest('[data-gallery-open]');
      if (opener && galleryPage.contains(opener)) {
        event.preventDefault();
        open(Number(opener.dataset.galleryOpen));
        return;
      }
      if (event.target.closest('[data-gallery-close]')) dialog.close();
      if (event.target.closest('[data-gallery-prev]')) show(galleryStep(index, items.length, -1));
      if (event.target.closest('[data-gallery-next]')) show(galleryStep(index, items.length, 1));
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(galleryStep(index, items.length, -1)); }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(galleryStep(index, items.length, 1)); }
    });
  }
}
