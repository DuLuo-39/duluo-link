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

function galleryHost(value) {
  const href = galleryHttp(value);
  if (!href) return '';
  try {
    return new URL(href).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function hostPlatform(host) {
  if (!host) return '';
  if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) return 'x';
  if (host === 'pixiv.net' || host.endsWith('.pixiv.net')) return 'pixiv';
  return '';
}

function artworkPlatform(entry) {
  const explicit = galleryText(entry.platform).toLowerCase();
  if (explicit === 'x' || explicit === 'pixiv' || explicit === 'other') return explicit;
  for (const raw of [entry.source_url, entry.artist_url]) {
    const found = hostPlatform(galleryHost(raw));
    if (found) return found;
  }
  return 'other';
}

function artworkHandle(value) {
  const raw = galleryText(value).replace(/^@+/, '');
  if (!/^[A-Za-z0-9_]+$/.test(raw)) return '';
  return `@${raw}`;
}

function artworkArtistUrl(platform, handle, value) {
  const explicit = galleryHttp(value);
  if (explicit) return explicit;
  if (platform === 'x' && handle) return `https://x.com/${encodeURIComponent(handle.slice(1))}`;
  return '';
}

function artworkMood(value) {
  if (!Array.isArray(value)) return [];
  const colors = value.flatMap(entry => {
    const raw = galleryText(entry);
    return /^#[0-9a-fA-F]{6}$/.test(raw) ? [raw.toLowerCase()] : [];
  });
  return colors.length >= 3 ? colors : [];
}

function sourceLabel(platform) {
  if (platform === 'x') return 'X 原推 ↗';
  if (platform === 'pixiv') return 'Pixiv 原作 ↗';
  return '查看原作 ↗';
}

function normalizeArtwork(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const image = galleryImage(entry.image);
  if (!image) return null;
  const title = galleryText(entry.title);
  const platform = artworkPlatform(entry);
  const artist_handle = artworkHandle(entry.artist_handle);
  return {
    image,
    width: positiveSize(entry.width),
    height: positiveSize(entry.height),
    title,
    character: galleryText(entry.character),
    name_en: galleryText(entry.name_en),
    series: galleryText(entry.series),
    platform,
    artist: galleryText(entry.artist),
    artist_handle,
    source_url: galleryHttp(entry.source_url),
    artist_url: artworkArtistUrl(platform, artist_handle, entry.artist_url),
    alt: galleryText(entry.alt) || title,
    featured: entry.featured !== false,
    mood: artworkMood(entry.mood),
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
    title: galleryText(data.title) || '画廊',
    eyebrow: galleryText(data.eyebrow) || 'GALLERY',
    description: galleryText(data.description) || '收集来自 X 与 Pixiv 的光影与线条。',
    items: items.length ? items : (fallback ? [{ ...fallback, featured: true }] : [])
  };
}

function featuredArtworks(items, fallbackArtwork) {
  const featured = (Array.isArray(items) ? items : []).filter(item => item && item.image && item.featured !== false);
  if (featured.length) return featured;
  const fallback = normalizeArtwork(fallbackArtwork);
  return fallback ? [{ ...fallback, featured: true }] : [];
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
      if (item.source_url) {
        source.href = item.source_url;
        source.textContent = sourceLabel(item.platform);
      }
      artist.hidden = !item.artist_url;
      if (item.artist_url) {
        artist.href = item.artist_url;
        artist.textContent = `${item.artist || item.artist_handle || '画师'} ↗`;
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
      if (items.length >= 2 && event.target.closest('[data-gallery-prev]')) show(galleryStep(index, items.length, -1));
      if (items.length >= 2 && event.target.closest('[data-gallery-next]')) show(galleryStep(index, items.length, 1));
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', event => {
      if (items.length < 2) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(galleryStep(index, items.length, -1)); }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(galleryStep(index, items.length, 1)); }
    });
  }
}
