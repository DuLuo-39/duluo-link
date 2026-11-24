const { test } = require('node:test');
const assert = require('node:assert/strict');
const { shareMatches } = require('../themes/journal/source/js/share.js');
const { normalizeGallery, featuredArtworks, galleryStep } = require('../themes/journal/source/js/gallery.js');

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
});
test('missing gallery falls back to the theme artwork and stays featured', () => {
  const artwork = { image: '/images/aemeath.webp', title: 'o_<', alt: '爱弥斯', artist: '/ /', source_url: 'https://www.pixiv.net/artworks/141188192' };
  const gallery = normalizeGallery(undefined, artwork);
  assert.equal(gallery.title, '爱弥斯画廊');
  assert.equal(gallery.items.length, 1);
  assert.equal(gallery.items[0].image, '/images/aemeath.webp');
  assert.deepEqual(featuredArtworks(gallery.items, artwork).map(item => item.image), ['/images/aemeath.webp']);
  assert.deepEqual(featuredArtworks([{ image: '/images/other.webp', featured: false }], artwork).map(item => item.image), ['/images/aemeath.webp']);
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
