const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const output = path.resolve('public');
const required = ['index.html', 'about/index.html', 'archives/index.html', '404.html', 'css/style.css', 'favicon.svg', 'sitemap.xml'];
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
console.log(`Verified ${pages.length} HTML pages, internal links, assets, metadata and sitemap.`);
