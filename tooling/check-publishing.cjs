const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Hexo = require('hexo');
const yaml = require('js-yaml');

(async () => {
  const root = process.cwd();
  fs.mkdirSync(path.join(root, '.netlify'), {recursive:true});
  const base = fs.mkdtempSync(path.join(root, '.netlify', 'reading-fixture-'));
  const source = path.join(base, 'source');
  const config = yaml.load(fs.readFileSync('_config.yml', 'utf8'));
  fs.cpSync(path.join(root, 'themes', 'journal'), path.join(base, 'themes', 'journal'), {recursive:true});
  fs.mkdirSync(path.join(source, '_posts'), {recursive:true});
  fs.mkdirSync(path.join(source, '_drafts'), {recursive:true});
  fs.writeFileSync(path.join(base, '_config.json'), JSON.stringify(config));
  fs.copyFileSync('package.json', path.join(base, 'package.json'));

  async function generate() {
    const hexo = new Hexo(base, {config:'_config.json',silent:true});
    hexo.plugin_dir = path.join(root, 'node_modules') + path.sep;
    try {
      await hexo.init();
      await hexo.call('generate');
    } finally { await hexo.exit(); }
    return JSON.parse(fs.readFileSync(path.join(base, 'public', 'search.json'), 'utf8'));
  }
  assert.deepEqual(await generate(), []);
  const read = file => fs.readFileSync(path.join(base, 'public', file), 'utf8');
  assert.deepEqual(JSON.parse(read('recommendations.json')), []);
  assert.match(read('index.html'), /第一篇记录，正在路上/);
  assert.match(read('index.html'), /data-random-next hidden/);
  for (const file of ['index.html','archives/index.html','categories/index.html','tags/index.html','share/index.html','projects/index.html','bloggers/index.html','gallery/index.html']) {
    assert.ok(fs.existsSync(path.join(base, 'public', file)), `Missing empty-state page: ${file}`);
  }
  assert.match(read('share/index.html'), /<h1>推荐分享<\/h1>/);
  assert.match(read('share/index.html'), /资源库还空着/);
  assert.match(read('projects/index.html'), /<h1>我的项目<\/h1>/);
  assert.match(read('projects/index.html'), /项目还在路上/);
  assert.match(read('bloggers/index.html'), /<h1>优秀博客<\/h1>/);
  assert.match(read('bloggers/index.html'), /还没有收录博客/);
  assert.match(read('gallery/index.html'), /<h1>画廊<\/h1>/);
  assert.match(read('gallery/index.html'), /aemeath\.webp/);
  fs.writeFileSync(path.join(source, '_posts', 'published.md'), '---\ntitle: "中文 <test> 与 C++"\ndate: 2020-01-01\ncategories: [Parent, Child]\ntags: [Hexo, 中文]\n---\n## 第一节\n公开内容\n\n```js\nconst a = 1;\nconst b = 2;\n```\n');
  fs.writeFileSync(path.join(source, '_posts', 'future.md'), '---\ntitle: Future private sentinel\ndate: 2099-01-01\ntags: [hidden-future]\n---\nFUTURE_SECRET_SENTINEL\n');
  fs.writeFileSync(path.join(source, '_drafts', 'draft.md'), '---\ntitle: Draft private sentinel\ntags: [hidden-draft]\n---\nDRAFT_SECRET_SENTINEL\n');
  const index = await generate();
  assert.equal(index.length, 1);
  assert.equal(index[0].title, '中文 <test> 与 C++');
  assert.equal(index[0].url, '/posts/published/');
  assert.ok(!JSON.stringify(index).includes('SECRET_SENTINEL'));
  assert.deepEqual(JSON.parse(read('recommendations.json')), index.map(({title,url,date,description}) => ({title,url,date,description})));
  assert.ok(!read('index.html').includes('SECRET_SENTINEL'));
  assert.match(read('index.html'), /中文 &lt;test&gt; 与 C\+\+/);
  assert.ok(fs.existsSync(path.join(base, 'public', 'categories', 'parent', 'child', 'index.html')));
  assert.ok(!fs.existsSync(path.join(base, 'public', 'tags', 'hidden-future')));
  assert.ok(!fs.existsSync(path.join(base, 'public', 'tags', 'hidden-draft')));
  config.theme_config = {widgets:{greeting:false,clock:false,calendar:false,random_post:false,music:false}};
  fs.writeFileSync(path.join(base, '_config.json'), JSON.stringify(config));
  await generate();
  for (const attribute of ['data-greeting','data-clock','data-calendar','data-random-post','data-music-player']) assert.ok(!read('index.html').includes(attribute), `Disabled widget still rendered: ${attribute}`);
  assert.match(read('index.html'), /aemeath.webp/);
  assert.match(read('share/index.html'), /<h1>推荐分享<\/h1>/);
  assert.match(read('projects/index.html'), /<h1>我的项目<\/h1>/);
  assert.match(read('bloggers/index.html'), /<h1>优秀博客<\/h1>/);
  assert.match(read('gallery/index.html'), /aemeath\.webp/);
  assert.ok(!read('share/index.html').includes('SECRET_SENTINEL'));
  console.log('Passed: empty and single-post blogs, published-only search/recommendations, future/draft exclusion, escaped Unicode titles, nested categories, disabled widgets and the empty portal pages.');
})().catch(error => { console.error(error); process.exitCode = 1; });
