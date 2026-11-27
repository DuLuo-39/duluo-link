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
    platformLabel: platform === 'x' ? 'X' : (platform === 'pixiv' ? 'Pixiv' : (galleryHttp(entry.source_url) ? '其他来源' : '')),
    tags: Array.isArray(entry.tags) ? [...new Set(entry.tags.map(galleryText).filter(Boolean))] : [],
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
  if (!items.length && fallback) items.push({ ...fallback, featured:true });
  const labels = [...new Set(items.flatMap(item => [item.platformLabel, ...item.tags]).filter(Boolean))];
  return {
    title: galleryText(data.title) || '画廊',
    eyebrow: galleryText(data.eyebrow) || 'GALLERY',
    description: galleryText(data.description) || '收集来自 X 与 Pixiv 的光影与线条。',
    items,
    filters: items.length > 1 && labels.length > 1 && items.some(item => item.tags.length) ? labels : []
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

function initGallery(page) {
  const dialog = page.querySelector('[data-gallery-dialog]');
  if (!dialog) return;
  const items = JSON.parse(page.querySelector('#gallery-data').textContent);
  const frames = [...page.querySelectorAll('.gallery-frame')];
  const filters = page.querySelector('[data-gallery-filters]');
  const count = page.querySelector('[data-gallery-count]');
  let visible = items.map((_, index) => index);
  let position = 0;

  function setMood(item) {
    const style = document.documentElement.style;
    for (let slot = 0; slot < 3; slot++) {
      const key = `--mood-${slot + 1}`;
      if (item?.mood[slot]) style.setProperty(key, item.mood[slot]);
      else style.removeProperty(key);
    }
  }

  if (filters) {
    filters.hidden = false;
    filters.addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      const label = button.dataset.filter;
      visible = items.flatMap((item, index) => {
        const match = !label || item.platformLabel === label || item.tags.includes(label);
        frames[index].hidden = !match;
        return match ? [index] : [];
      });
      for (const option of filters.querySelectorAll('button')) {
        option.setAttribute('aria-pressed', String(option === button));
      }
      count.textContent = `共 ${visible.length} 幅`;
      setMood();
    });
  }

  frames.forEach((frame, index) => {
    frame.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && !dialog.open) setMood(items[index]);
    });
    frame.addEventListener('pointerleave', () => { if (!dialog.open) setMood(); });
  });

  if (typeof dialog.showModal !== 'function') return;
  const image = dialog.querySelector('[data-gallery-image]');
  const title = dialog.querySelector('[data-gallery-title]');
  const credit = dialog.querySelector('[data-gallery-credit]');
  const note = dialog.querySelector('[data-gallery-note]');
  const source = dialog.querySelector('[data-gallery-source]');
  const artist = dialog.querySelector('[data-gallery-artist]');
  const previous = dialog.querySelector('[data-gallery-prev]');
  const next = dialog.querySelector('[data-gallery-next]');
  const counter = dialog.querySelector('[data-gallery-index]');
  function link(element, href, label) {
    element.hidden = !href;
    if (href) element.href = href;
    else element.removeAttribute('href');
    element.textContent = label;
  }
  function show(at) {
    position = galleryStep(at, visible.length, 0);
    const item = items[visible[position]];
    image.src = item.image;
    image.alt = item.alt || item.character || '';
    title.textContent = item.title || item.character || '未题名';
    credit.textContent = [item.artist_handle || item.artist, item.series, item.platformLabel].filter(Boolean).join(' · ');
    credit.hidden = !credit.textContent;
    note.textContent = item.note;
    note.hidden = !item.note;
    link(source, item.source_url, sourceLabel(item.platform));
    link(artist, item.artist_url, '画师主页 ↗');
    counter.textContent = [position + 1, visible.length].map(n => String(n).padStart(2, '0')).join(' / ');
    previous.hidden = next.hidden = visible.length < 2;
    setMood(item);
  }

  page.addEventListener('click', event => {
    const opener = event.target.closest('[data-gallery-open]');
    if (!opener || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const at = visible.indexOf(Number(opener.dataset.galleryOpen));
    if (at < 0) return;
    dialog.showModal();
    show(at);
  });
  previous.addEventListener('click', () => show(position - 1));
  next.addEventListener('click', () => show(position + 1));
  dialog.querySelector('[data-gallery-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => { touch = null; setMood(); });
  dialog.addEventListener('keydown', event => {
    if (visible.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    show(position + (event.key === 'ArrowLeft' ? -1 : 1));
  });

  const stage = dialog.querySelector('.gallery-lightbox-stage');
  let touch = null;
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || visible.length < 2) return;
    touch = event.isPrimary ? { id:event.pointerId, x:event.clientX, y:event.clientY } : null;
  });
  stage.addEventListener('pointercancel', () => { touch = null; });
  stage.addEventListener('pointerup', event => {
    if (!touch || touch.id !== event.pointerId) return;
    const dx = event.clientX - touch.x, dy = event.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      show(position + (dx < 0 ? 1 : -1));
    }
  });
}

if (typeof document !== 'undefined') {
  const page = document.querySelector('[data-gallery-page]');
  if (page) initGallery(page);
}
