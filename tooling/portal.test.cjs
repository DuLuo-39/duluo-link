const { test } = require('node:test');
const assert = require('node:assert/strict');
const { shareMatches } = require('../themes/journal/source/js/share.js');
const { normalizeGallery, featuredArtworks, galleryStep, normalizeArtwork } = require('../themes/journal/source/js/gallery.js');

const items = [
  { name: 'Hexo 官方文档', summary: '静态博客框架', category: '开发文档', tags: ['博客', '静态站点'] },
  { name: 'Netlify Docs', summary: '部署与预览', category: '部署托管', tags: ['部署'] },
  { name: 'MDN', summary: 'Web 文档', category: '开发文档', tags: ['HTML', 'CSS'] }
];

test('multiple keywords must all match across name, summary and tags', () => {
  assert.deepEqual(shareMatches(items, '静态 博客', '').map(item => item.name), ['Hexo 官方文档']);
  assert.deepEqual(shareMatches(items, '静态 部署', ''), []);
  assert.deepEqual(shareMatches(items, 'NETLIFY', '').map(item => item.name), ['Netlify Docs']);
});

test('category and keywords narrow the list together', () => {
  assert.deepEqual(shareMatches(items, '文档', '开发文档').map(item => item.name), ['Hexo 官方文档', 'MDN']);
  assert.deepEqual(shareMatches(items, '部署', '开发文档'), []);
});

test('blank query keeps every item in the selected category', () => {
  assert.equal(shareMatches(items, '   ', '部署托管').length, 1);
  assert.equal(shareMatches(items, '', '').length, 3);
});

test('gallery keeps safe images and drops unsafe ones', () => {
  const gallery = normalizeGallery({
    items: [
      { image: '/images/aemeath.webp', title: 'o_<', source_url: 'https://www.pixiv.net/artworks/141188192', artist_url: 'not a url', featured: true },
      { image: '//evil.example/a.webp', title: '拒绝' },
      { image: 'javascript:alert(1)', title: '拒绝' },
      null
    ]
  }, null);
  assert.deepEqual(gallery.items.map(item => item.title), ['o_<']);
  assert.equal(gallery.items[0].artist_url, '');
  assert.equal(gallery.items[0].source_url, 'https://www.pixiv.net/artworks/141188192');
  assert.equal(gallery.items[0].platform, 'pixiv');
  assert.deepEqual(gallery.items[0].mood, []);
});
test('missing gallery falls back to the theme artwork and stays featured', () => {
  const artwork = { image: '/images/aemeath.webp', title: 'o_<', alt: '爱弥斯', artist: '/ /', source_url: 'https://www.pixiv.net/artworks/141188192' };
  const gallery = normalizeGallery(undefined, artwork);
  assert.equal(gallery.title, '画廊');
  assert.equal(gallery.eyebrow, 'GALLERY');
  assert.equal(gallery.items.length, 1);
  assert.equal(gallery.items[0].image, '/images/aemeath.webp');
  assert.equal(gallery.items[0].series, '');
  assert.equal(gallery.items[0].platform, 'pixiv');
  assert.deepEqual(featuredArtworks(gallery.items, artwork).map(item => item.image), ['/images/aemeath.webp']);
  const fallback = featuredArtworks([{ image: '/images/other.webp', featured: false }], artwork);
  assert.deepEqual(fallback.map(item => item.image), ['/images/aemeath.webp']);
  assert.equal(fallback[0].series, '');
});
test('platform is inferred from x.com, twitter.com and pixiv.net', () => {
  assert.equal(normalizeArtwork({ image: '/a.webp', source_url: 'https://x.com/artist/status/1' }).platform, 'x');
  assert.equal(normalizeArtwork({ image: '/a.webp', source_url: 'https://twitter.com/artist/status/1' }).platform, 'x');
  assert.equal(normalizeArtwork({ image: '/a.webp', artist_url: 'https://mobile.twitter.com/artist' }).platform, 'x');
  assert.equal(normalizeArtwork({ image: '/a.webp', source_url: 'https://www.pixiv.net/artworks/141188192' }).platform, 'pixiv');
  assert.equal(normalizeArtwork({ image: '/a.webp', artist_url: 'https://pixiv.net/users/1' }).platform, 'pixiv');
  assert.equal(normalizeArtwork({ image: '/a.webp', source_url: 'https://example.com/a' }).platform, 'other');
  assert.equal(normalizeArtwork({ image: '/a.webp', platform: 'x', source_url: 'https://www.pixiv.net/artworks/1' }).platform, 'x');
  assert.equal(normalizeArtwork({ image: '/a.webp', platform: 'other', source_url: 'https://x.com/a/status/1' }).platform, 'other');
});
test('x artist_handle derives the profile url and drops illegal handles', () => {
  const derived = normalizeArtwork({ image: '/a.webp', platform: 'x', artist_handle: '@DuLuo_39' });
  assert.equal(derived.artist_handle, '@DuLuo_39');
  assert.equal(derived.artist_url, 'https://x.com/DuLuo_39');
  const inferred = normalizeArtwork({ image: '/a.webp', source_url: 'https://twitter.com/someone/status/9', artist_handle: 'someone' });
  assert.equal(inferred.platform, 'x');
  assert.equal(inferred.artist_handle, '@someone');
  assert.equal(inferred.artist_url, 'https://x.com/someone');
  assert.equal(inferred.source_url, 'https://twitter.com/someone/status/9');
  const illegal = normalizeArtwork({ image: '/a.webp', platform: 'x', artist_handle: '@bad handle' });
  assert.equal(illegal.artist_handle, '');
  assert.equal(illegal.artist_url, '');
  assert.equal(normalizeArtwork({ image: '/a.webp', platform: 'x', artist_handle: '@no-dash' }).artist_handle, '');
  assert.equal(normalizeArtwork({ image: '/a.webp', platform: 'x', artist_handle: '@' }).artist_url, '');
  const kept = normalizeArtwork({ image: '/a.webp', platform: 'x', artist_handle: '@someone', artist_url: 'https://x.com/other' });
  assert.equal(kept.artist_handle, '@someone');
  assert.equal(kept.artist_url, 'https://x.com/other');
  assert.equal(normalizeArtwork({ image: '/a.webp', platform: 'pixiv', artist_handle: '@someone' }).artist_url, '');
});
test('mood keeps legal 6-digit hex colors and drops an incomplete palette', () => {
  assert.deepEqual(normalizeArtwork({
    image: '/a.webp',
    mood: ['#F6DFEB', 'pink', '#e9e2f7', '#abc', '#gggggg', '#11223344', ' #ddedf7 ']
  }).mood, ['#f6dfeb', '#e9e2f7', '#ddedf7']);
  assert.deepEqual(normalizeArtwork({ image: '/a.webp', mood: ['#112233', 'red', '#aabbcc', '#ddeeff', '#445566'] }).mood, ['#112233', '#aabbcc', '#ddeeff', '#445566']);
  assert.deepEqual(normalizeArtwork({ image: '/a.webp', mood: ['#f6dfeb', '#e9e2f7'] }).mood, []);
  assert.deepEqual(normalizeArtwork({ image: '/a.webp' }).mood, []);
  assert.deepEqual(normalizeArtwork({ image: '/a.webp', mood: 'not-a-list' }).mood, []);
});
test('gallery index wraps in both directions', () => {
  assert.equal(galleryStep(0, 3, 1), 1);
  assert.equal(galleryStep(2, 3, 1), 0);
  assert.equal(galleryStep(0, 3, -1), 2);
  assert.equal(galleryStep(1, 0, 1), 0);
});
test('missing, empty and malformed collections stay empty instead of throwing', () => {
  assert.deepEqual(shareMatches(null, 'hexo', '开发文档'), []);
  assert.deepEqual(shareMatches(undefined, '', ''), []);
  assert.deepEqual(shareMatches([null, 'bad', { name: 'Hexo' }], '', '').map(item => item.name), ['Hexo']);
});
