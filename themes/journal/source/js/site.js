'use strict';

(() => {
  const dialog = document.querySelector('#site-search');
  const trigger = document.querySelector('[data-search-open]');
  if (dialog && trigger && typeof dialog.showModal === 'function') {
    const input = dialog.querySelector('input');
    const status = dialog.querySelector('.search-status');
    const results = dialog.querySelector('.search-results');
    const retry = dialog.querySelector('.search-retry');
    const normalize = text => String(text).normalize('NFKC').toLocaleLowerCase();
    let indexPromise;
    let debounce;
    let revision = 0;

    function loadIndex() {
      if (!indexPromise) {
        indexPromise = fetch(dialog.dataset.searchUrl).then(response => {
          if (!response.ok) throw new Error('Search index unavailable');
          return response.json();
        }).then(posts => posts.map(post => ({
          ...post,
          titleKey: normalize(post.title),
          labelsKey: normalize([...post.tags, ...post.categories].join(' ')),
          haystack: normalize([post.title, post.description, post.text, ...post.tags, ...post.categories].join(' '))
        }))).catch(error => {
          indexPromise = null;
          throw error;
        });
      }
      return indexPromise;
    }

    async function search() {
      const current = ++revision;
      const query = normalize(input.value.trim());
      results.replaceChildren();
      retry.hidden = true;
      if (!query) {
        status.textContent = '输入关键词，找回那些灵光一闪。';
        return;
      }
      status.textContent = '正在寻找…';
      try {
        const posts = await loadIndex();
        if (current !== revision) return;
        const tokens = query.split(/\s+/);
        const matches = posts.filter(post => tokens.every(token => post.haystack.includes(token)))
          .map(post => ({ ...post, score: tokens.reduce((score, token) => score + (post.titleKey.includes(token) ? 4 : 0) + (post.labelsKey.includes(token) ? 2 : 0), 0) }))
          .sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
        status.textContent = matches.length ? `找到 ${matches.length} 篇文章${matches.length > 30 ? '，显示前 30 篇' : ''}` : '暂时没有找到，试试更短的关键词吧。';
        const fragment = document.createDocumentFragment();
        for (const post of matches.slice(0, 30)) {
          const url = new URL(post.url, window.location.origin);
          if (url.origin !== window.location.origin) continue;
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = url.pathname + url.search + url.hash;
          const title = document.createElement('h3');
          title.textContent = post.title;
          const excerpt = document.createElement('p');
          const text = post.text || post.description;
          const position = normalize(text).indexOf(tokens[0]);
          const start = Math.max(0, position - 36);
          excerpt.textContent = `${start ? '…' : ''}${text.slice(start, start + 130)}${text.length > start + 130 ? '…' : ''}`;
          const meta = document.createElement('span');
          meta.className = 'search-result-meta';
          meta.textContent = [post.date, ...post.tags].join(' · ');
          link.append(title, excerpt, meta);
          item.append(link);
          fragment.append(item);
        }
        results.append(fragment);
      } catch {
        if (current !== revision) return;
        status.textContent = '搜索暂时无法加载，请重试。也可以从归档浏览文章。';
        retry.hidden = false;
      }
    }

    function openSearch() {
      if (!dialog.open) dialog.showModal();
      document.body.classList.add('search-open');
      input.focus();
      search();
    }
    trigger.hidden = false;
    if (/Mac|iPhone|iPad/.test(navigator.platform)) trigger.querySelector('kbd').textContent = '⌘ K';
    trigger.addEventListener('click', openSearch);
    dialog.querySelector('[data-search-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => document.body.classList.remove('search-open'));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dialog.close();
      }
    });
    dialog.addEventListener('click', event => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
    });
    input.addEventListener('input', () => {
      ++revision;
      clearTimeout(debounce);
      debounce = setTimeout(search, 100);
    });
    retry.addEventListener('click', search);
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !event.altKey && !event.isComposing) {
        event.preventDefault();
        openSearch();
      }
    });
  }

  document.querySelectorAll('.prose figure.highlight, .prose > pre').forEach(block => {
    const code = block.querySelector('.code pre') || block.querySelector('pre') || block;
    // Hexo wraps each visual line in a span without literal newline separators.
    const lines = [...code.querySelectorAll('.line')];
    const text = lines.length ? lines.map(line => line.textContent).join('\n') : code.textContent;
    const header = document.createElement('div');
    header.className = 'code-toolbar';
    const language = document.createElement('span');
    language.textContent = [...block.classList].find(name => name !== 'highlight') || 'code';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '复制代码';
    button.setAttribute('aria-label', '复制这段代码');
    const feedback = document.createElement('span');
    feedback.className = 'sr-only';
    feedback.setAttribute('role', 'status');
    header.append(language, button, feedback);
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    block.before(wrapper);
    wrapper.append(header, block);
    let timer;
    button.addEventListener('click', async () => {
      clearTimeout(timer);
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = '已复制 ✓';
        feedback.textContent = '代码已复制到剪贴板';
      } catch {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent = '请按 Ctrl/Cmd+C';
        feedback.textContent = '无法自动复制，已选中代码，请按 Ctrl 或 Command 加 C 复制';
      }
      timer = setTimeout(() => { button.textContent = '复制代码'; feedback.textContent = ''; }, 2500);
    });
  });

  const article = document.querySelector('[data-article-content]');
  if (article) {
    const progress = document.querySelector('[data-reading-progress]');
    const links = [...document.querySelectorAll('.toc-content a')];
    const headings = links.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1))));
    let scheduled = false;
    function updateReading() {
      scheduled = false;
      const box = article.getBoundingClientRect();
      const distance = box.height - window.innerHeight + 140;
      const fraction = distance > 0 ? Math.min(1, Math.max(0, (140 - box.top) / distance)) : (box.top < window.innerHeight ? 1 : 0);
      if (progress) progress.style.transform = `scaleX(${fraction})`;
      let active = 0;
      headings.forEach((heading, index) => { if (heading && heading.getBoundingClientRect().top <= 150) active = index; });
      links.forEach((link, index) => {
        if (index === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(updateReading); } }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    updateReading();
  }
})();
