'use strict';

const { normalizeGallery, featuredArtworks } = require('../source/js/gallery.js');

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function ratingOf(value) {
  if (typeof value === 'boolean' || value == null || value === '') return 5;
  const number = typeof value === 'number' ? value : (typeof value === 'string' && value.trim() ? Number(value) : NaN);
  return Number.isInteger(number) && number >= 1 && number <= 5 ? number : 5;
}

function httpUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function normalizeItem(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const name = text(entry.name);
  const url = httpUrl(entry.url);
  if (!name || !url) return null;
  const tags = Array.isArray(entry.tags) ? entry.tags.map(text).filter(Boolean) : [];
  return {
    name,
    url,
    category: text(entry.category) || '其他',
    rating: ratingOf(entry.rating),
    tags,
    summary: text(entry.summary)
  };
}

function normalizeShare(source) {
  const data = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
  const items = (Array.isArray(data.items) ? data.items : []).flatMap(entry => {
    const item = normalizeItem(entry);
    return item ? [item] : [];
  });
  const counts = new Map();
  for (const item of items) counts.set(item.category, (counts.get(item.category) || 0) + 1);
  return {
    title: text(data.title) || '推荐分享',
    eyebrow: text(data.eyebrow) || 'RESOURCES',
    description: text(data.description) || '文档与工具。',
    items,
    categories: [...counts.entries()].map(([name, count]) => ({ name, count }))
  };
}

function listOf(value) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function normalizeProject(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const name = text(entry.name);
  if (!name) return null;
  return {
    name,
    status: text(entry.status) || '实验中',
    summary: text(entry.summary),
    stack: listOf(entry.stack),
    repo: httpUrl(entry.repo),
    demo: httpUrl(entry.demo),
    highlight: entry.highlight === true
  };
}

function normalizeBlogger(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const name = text(entry.name);
  const url = httpUrl(entry.url);
  if (!name || !url) return null;
  const avatar = text(entry.avatar);
  return {
    name,
    url,
    avatar: avatar.startsWith('/') || /^https?:\/\//i.test(avatar) ? avatar : '',
    avatar_text: (text(entry.avatar_text) || [...name][0] || '友').slice(0, 2),
    tag: text(entry.tag),
    summary: text(entry.summary)
  };
}

function portalPage(source, defaults, normalize) {
  const data = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
  return {
    title: text(data.title) || defaults.title,
    eyebrow: text(data.eyebrow) || defaults.eyebrow,
    description: text(data.description) || defaults.description,
    items: (Array.isArray(data.items) ? data.items : []).flatMap(entry => {
      const item = normalize(entry);
      return item ? [item] : [];
    })
  };
}

hexo.extend.generator.register('journal-portal', function () {
  const data = this.locals.get('data') || {};
  return [
    { path: 'share/index.html', layout: 'share', data: normalizeShare(data.share) },
    {
      path: 'projects/index.html',
      layout: 'projects',
      data: portalPage(data.projects, {
        title: '我的项目',
        eyebrow: 'PROJECTS',
        description: ''
      }, normalizeProject)
    },
    {
      path: 'bloggers/index.html',
      layout: 'bloggers',
      data: portalPage(data.bloggers, {
        title: '优秀博客',
        eyebrow: 'BLOGROLL',
        description: ''
      }, normalizeBlogger)
    },
    { path: 'gallery/index.html', layout: 'gallery', data: normalizeGallery(data.gallery, this.theme.config.artwork) }
  ];
});

hexo.extend.helper.register('journal_featured_artworks', function () {
  const stored = this.site && this.site.data ? this.site.data.gallery : undefined;
  const gallery = normalizeGallery(stored, this.theme && this.theme.artwork);
  return featuredArtworks(gallery.items, this.theme && this.theme.artwork);
});
