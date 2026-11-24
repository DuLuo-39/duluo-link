const { test } = require('node:test');
const assert = require('node:assert/strict');
const { shareMatches } = require('../themes/journal/source/js/share.js');

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

test('missing, empty and malformed collections stay empty instead of throwing', () => {
  assert.deepEqual(shareMatches(null, 'hexo', '开发文档'), []);
  assert.deepEqual(shareMatches(undefined, '', ''), []);
  assert.deepEqual(shareMatches([null, 'bad', { name: 'Hexo' }], '', '').map(item => item.name), ['Hexo']);
});
