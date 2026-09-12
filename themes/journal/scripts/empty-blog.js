'use strict';

// Keep the navigation usable even after the last example post is removed.
hexo.extend.generator.register('empty-blog', function (locals) {
  if (locals.posts.length) return [];
  return [{
    path: 'index.html',
    layout: 'index',
    data: { __index: true, posts: locals.posts, total: 1, current: 1 }
  }, {
    path: this.config.archive_dir.replace(/\/$/, '') + '/index.html',
    layout: 'archive',
    data: { archive: true, posts: locals.posts, total: 1, current: 1 }
  }];
});
