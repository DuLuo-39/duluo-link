'use strict';

const defaults = { accent: '#78619c', ink: '#39364b', muted: '#726b83', pink: '#f6dfeb', lavender: '#e9e2f7', blue: '#ddedf7' };
hexo.extend.helper.register('desktop_palette', function () {
  return Object.entries(defaults).map(([key, fallback]) => {
    const value = this.theme.palette?.[key];
    return `--${key}:${/^#[\da-f]{6}$/i.test(value || '') ? value : fallback}`;
  }).join(';');
});

const iconShapes = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  archive: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16m-12 4h4"/>',
  category: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  tag: '<path d="M3 3h9l9 9-9 9-9-9z"/><circle cx="8" cy="8" r="1"/>',
  about: '<circle cx="12" cy="12" r="9"/><path d="M8 14q4 5 8 0M8 9h.01M16 9h.01"/>',
  shuffle: '<path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3-2 4-4m4-4c1-2 2-4 4-4h3m-4-4 4 4-4 4"/>',
  star: '<path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7z"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  bilibili: '<path d="M7 7 5 4m12 3 2-3"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 13h.01M15.5 13h.01M9 16.5h6"/>',
  qq: '<path d="M12 3.5c-3 0-5 2.2-5 5.2 0 1.5.5 2.6 1.2 3.4-.8.5-1.7 1.5-1.7 2.8 0 2 2.2 3.1 5.5 3.1s5.5-1.1 5.5-3.1c0-1.3-.9-2.3-1.7-2.8.7-.8 1.2-1.9 1.2-3.4 0-3-2-5.2-5-5.2z"/><path d="M9.2 9h.01M14.8 9h.01M8.2 7.4 6.2 5.4m9.6 2 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  projects: '<path d="M3 8a2 2 0 0 1 2-2h3l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  share: '<circle cx="6" cy="12" r="2"/><circle cx="17" cy="6" r="2"/><circle cx="17" cy="18" r="2"/><path d="m8 11 7-4M8 13l7 4"/>',
  bloggers: '<circle cx="9" cy="8" r="3"/><path d="M4 19c.4-2.6 2.4-4 5-4s4.6 1.4 5 4"/><circle cx="17" cy="9" r="2"/><path d="M16 15c1.5.4 2.6 1.3 3 3"/>',
  music: '<path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  external: '<path d="M15 5h4v4M19 5l-8 8"/><path d="M16 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h5"/>'
};

function iconSvg(name) {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconShapes[name] || iconShapes.star}</svg>`;
}

hexo.extend.helper.register('journal_icon', name => iconSvg(name));

function plain(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function socialEntries(theme) {
  const list = Array.isArray(theme?.socials) ? theme.socials : [];
  return list.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const url = plain(item.url);
    const copy = plain(item.copy);
    if (!url && !copy) return [];
    const key = plain(item.key);
    const label = plain(item.label) || key;
    const text = plain(item.text) || label || copy || url;
    return [{ key, label, text, url, copy }];
  });
}

function renderSocials(theme) {
  const items = socialEntries(theme);
  if (!items.length) return '';
  const rows = items.map(item => {
    const body = `${iconSvg(item.key)}<span class="social-label">${escapeHtml(item.label)}</span><span class="social-text">${escapeHtml(item.text)}</span>`;
    if (item.url) {
      const external = /^https?:\/\//i.test(item.url) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<li><a href="${escapeHtml(item.url)}"${external}>${body}</a></li>`;
    }
    const value = escapeHtml(item.copy);
    return `<li><span class="social-copy">${body}<button type="button" data-copy-value="${value}" aria-label="复制${escapeHtml(item.label)}：${value}">复制</button><span class="sr-only" role="status" data-copy-status></span></span></li>`;
  });
  return `<ul class="social-list">${rows.join('')}</ul>`;
}

function renderSocialBar(theme) {
  const items = socialEntries(theme);
  if (!items.length) return '';
  const chips = items.map(item => {
    const icon = iconSvg(item.key);
    const label = escapeHtml(item.label);
    if (item.url) {
      const external = /^https?:\/\//i.test(item.url) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a class="social-chip" href="${escapeHtml(item.url)}"${external}>${icon}<span>${label}</span></a>`;
    }
    const value = escapeHtml(item.copy);
    return `<button class="social-chip" type="button" data-copy-value="${value}" aria-label="复制${label}：${value}">${icon}<span data-copy-label>${label}</span><span class="sr-only" role="status" data-copy-status></span></button>`;
  });
  return `<div class="social-bar">${chips.join('')}</div>`;
}

function musicTracks(theme) {
  const tracks = Array.isArray(theme?.music?.tracks) ? theme.music.tracks : [];
  return tracks.flatMap(track => {
    if (!track || typeof track !== 'object') return [];
    const title = plain(track.title);
    const src = plain(track.src);
    const local = src.startsWith('/') && !src.startsWith('//');
    if (!title || (!local && !/^https?:\/\//i.test(src))) return [];
    return [{ title, artist: plain(track.artist), src }];
  });
}

hexo.extend.helper.register('journal_socials', function () {
  return renderSocials(this.theme);
});

hexo.extend.helper.register('journal_social_bar', function () {
  return renderSocialBar(this.theme);
});

hexo.extend.helper.register('journal_music_tracks', function () {
  return musicTracks(this.theme);
});

hexo.extend.helper.register('journal_github_url', function () {
  const github = socialEntries(this.theme).find(item => item.key === 'github' && item.url);
  return github ? github.url : plain(this.theme?.github_url);
});

hexo.extend.tag.register('socials', () => renderSocials(hexo.theme.config));
