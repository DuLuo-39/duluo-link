'use strict';

const { stripHTML, unescapeHTML } = require('hexo-util');
const plain = value => unescapeHTML(stripHTML(value || '')).replace(/\s+/g, ' ').trim();

hexo.extend.helper.register('reading_minutes', function (post) {
  const text = plain(post.content);
  const chinese = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const words = (text.replace(/[\u3400-\u9fff]/g, ' ').match(/\S+/g) || []).length;
  return Math.max(1, Math.ceil(chinese / 350 + words / 200));
});

// Use the same published locals as the homepage: drafts and future posts stay out.
hexo.extend.generator.register('journal-reading', function (locals) {
  const routes = [];
  for (const [kind, collection, directory, title] of [
    ['category', locals.categories, this.config.category_dir, '文章分类'],
    ['tag', locals.tags, this.config.tag_dir, '文章标签']
  ]) {
    const terms = collection.sort('name', 1).toArray().filter(term => term.posts.length > 0);
    routes.push({
      path: `${directory.replace(/\/$/, '')}/index.html`,
      layout: 'taxonomy',
      data: { title, taxonomy_kind: kind, terms, description: kind === 'category' ? '按主题整理，一点点积累。' : '沿着一个关键词，发现更多记录。' }
    });
    for (const term of terms) {
      routes.push({
        path: `${term.path}index.html`,
        layout: 'collection',
        data: {
          title: `${kind === 'category' ? '分类' : '标签'}：${term.name}`,
          taxonomy_kind: kind, term_name: term.name,
          posts: term.posts.sort('-date'),
          description: `关于「${term.name}」的文章。`
        }
      });
    }
  }
  const posts = locals.posts.sort('-date').map(post => ({
    title: post.title,
    url: `${this.config.root}${post.path}`,
    date: post.date.format('YYYY-MM-DD'),
    description: plain(post.description),
    text: plain(post.content),
    tags: post.tags.map(tag => tag.name),
    categories: post.categories.map(category => category.name)
  }));
  routes.push({ path: 'search.json', data: JSON.stringify(posts) });
  return routes;
});
