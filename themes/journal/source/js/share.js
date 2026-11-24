'use strict';

function shareText(value) {
  return String(value == null ? '' : value).normalize('NFKC').toLocaleLowerCase();
}

function shareMatches(items, query, category) {
  const list = Array.isArray(items) ? items.filter(item => item && typeof item === 'object') : [];
  const tokens = shareText(query).split(/\s+/).filter(Boolean);
  const selected = shareText(category);
  return list.filter(item => {
    if (selected && shareText(item.category) !== selected) return false;
    if (!tokens.length) return true;
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const haystack = shareText([item.name, item.summary, item.category, ...tags].join(' '));
    return tokens.every(token => haystack.includes(token));
  });
}

if (typeof module === 'object' && module.exports) module.exports = { shareMatches };

if (typeof document !== 'undefined') {
const sharePage = document.querySelector('[data-share-page]');
const shareData = document.getElementById('share-data');
if (sharePage && shareData) {
  let items = [];
  try { items = JSON.parse(shareData.textContent || '[]'); }
  catch { items = []; }
  const cards = [...sharePage.querySelectorAll('[data-share-item]')];
  const input = sharePage.querySelector('[data-share-query]');
  const status = sharePage.querySelector('[data-share-status]');
  const empty = sharePage.querySelector('[data-share-empty]');
  const buttons = [...sharePage.querySelectorAll('[data-share-category]')];
  let category = '';
  function renderShare() {
    const matched = new Set(shareMatches(items, input ? input.value : '', category));
    let visible = 0;
    items.forEach((item, index) => {
      const show = matched.has(item);
      if (cards[index]) cards[index].hidden = !show;
      if (show) visible += 1;
    });
    if (status) status.textContent = visible === items.length ? `共 ${items.length} 条资源` : `显示 ${visible} / ${items.length} 条`;
    if (empty) empty.hidden = visible !== 0;
  }
  function selectCategory(next) {
    category = next || '';
    buttons.forEach(button => button.setAttribute('aria-pressed', (button.getAttribute('data-share-category') || '') === category ? 'true' : 'false'));
    renderShare();
  }
  sharePage.addEventListener('click', event => {
    const categoryButton = event.target.closest('[data-share-category]');
    if (categoryButton && sharePage.contains(categoryButton)) {
      selectCategory(categoryButton.getAttribute('data-share-category') || '');
      return;
    }
    if (event.target.closest('[data-share-reset]')) {
      if (input) input.value = '';
      selectCategory('');
    }
  });
  sharePage.addEventListener('submit', event => {
    if (event.target.closest('.share-search')) event.preventDefault();
  });
  if (input) input.addEventListener('input', renderShare);
}
}
