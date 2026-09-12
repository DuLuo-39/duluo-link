const Hexo = require('hexo');

async function build() {
  const hexo = new Hexo(process.cwd(), {});
  try {
    await hexo.init();
    const preview = process.env.CONTEXT && process.env.CONTEXT !== 'production';
    const origin = (preview ? process.env.DEPLOY_PRIME_URL : process.env.SITE_URL)
      || process.env.URL || hexo.config.url;
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password
        || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error('SITE_URL must be an origin such as https://example.com (no path, credentials or query).');
    }
    hexo.config.url = parsed.origin;
    hexo.config.root = '/';
    hexo.config.preview_build = Boolean(preview);
    await hexo.call('clean');
    await hexo.call('generate');
    await hexo.exit();
  } catch (error) {
    await hexo.exit(error);
    process.exitCode = 1;
  }
}

build().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
