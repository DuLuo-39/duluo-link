const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const output = path.resolve('public');
const required = ['index.html', 'about/index.html', 'archives/index.html', 'categories/index.html', 'tags/index.html', '404.html', 'css/style.css', 'js/site.js', 'search.json', 'favicon.svg', 'sitemap.xml'];
for (const file of required) assert.ok(fs.existsSync(path.join(output, file)), `Missing output: ${file}`);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const home = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
const canonical = home.match(/<link rel="canonical" href="([^"]+)"/);
assert.ok(canonical, 'Home page needs a canonical URL');
const origin = new URL(canonical[1]).origin;
if (process.env.NETLIFY) assert.ok(!/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(origin), 'Netlify output must use the deployed URL');

const pages = walk(output).filter(file => file.endsWith('.html'));
for (const file of pages) {
  const relative = path.relative(output, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /<html lang="zh-CN">/, `${relative}: missing document language`);
  assert.match(html, /<title>[^<]+<\/title>/, `${relative}: missing title`);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${relative}: expected one main heading`);
  assert.match(html, /<main id="main"/, `${relative}: missing main landmark`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = match[1].replaceAll('&amp;', '&');
    if (/^(?:mailto:|tel:|data:|javascript:|#)/i.test(raw)) continue;
    const link = new URL(raw, `${origin}/${relative}`);
    if (link.origin !== origin) continue;
    const target = path.resolve(output, '.' + decodeURIComponent(link.pathname));
    assert.ok(target === output || target.startsWith(output + path.sep), `${relative}: path escapes output`);
    const exists = fs.existsSync(target) && fs.statSync(target).isFile();
    assert.ok(exists || fs.existsSync(path.join(target, 'index.html')), `${relative}: broken link ${raw}`);
  }
}
const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
assert.match(sitemap, /<urlset\b/, 'Invalid sitemap');
assert.ok(!sitemap.includes('/404.html'), '404 page should not be listed in the sitemap');
const index = JSON.parse(fs.readFileSync(path.join(output, 'search.json'), 'utf8'));
assert.ok(Array.isArray(index), 'Search index must be an array');
const postPages = pages.filter(file => path.relative(output, file).split(path.sep)[0] === 'posts');
assert.equal(index.length, postPages.length, 'Search must index every published article exactly once');
assert.equal(new Set(index.map(post => post.url)).size, index.length, 'Duplicate search results');
for (const post of index) {
  assert.ok(post.title && typeof post.text === 'string', 'Search article needs a title and text');
  assert.ok(Array.isArray(post.tags) && Array.isArray(post.categories), 'Search needs taxonomy labels');
  const target = new URL(post.url, origin);
  assert.equal(target.origin, origin, 'Search result must stay on this website');
  assert.ok(fs.existsSync(path.join(output, decodeURIComponent(target.pathname), 'index.html')), `Broken search result: ${post.url}`);
}
for (const file of postPages) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/class="toc-link" href="#([^"]+)"/g)) {
    const id = decodeURIComponent(match[1]);
    assert.ok(html.includes(`id="${id}"`), `${path.relative(output, file)}: broken TOC target ${id}`);
  }
}
console.log(`Verified ${pages.length} HTML pages, ${index.length} searchable articles, TOC targets, internal links, assets, metadata and sitemap.`);
