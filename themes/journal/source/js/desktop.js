'use strict';

(() => {
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  function beijingTime(now = new Date()) {
    const parts = Object.fromEntries(formatter.formatToParts(now).map(part => [part.type, part.value]));
    return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: parts.minute, weekday: weekdays[new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))).getUTCDay()] };
  }
  function greeting(hour) {
    if (hour < 6) return '夜深了，记得好好休息';
    if (hour < 11) return '早上好，今天也要保持好奇';
    if (hour < 14) return '中午好，给自己一点放松时间';
    if (hour < 18) return '下午好，很高兴遇见你';
    return '晚上好，欢迎来到我的小栈';
  }
  function calendarDays(year, month) {
    const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return Array.from({ length: Math.ceil((offset + total) / 7) * 7 }, (_, i) => i >= offset && i < offset + total ? i - offset + 1 : null);
  }
  function pickPost(posts, currentUrl, random = Math.random) {
    const alternatives = posts.filter(post => post.url !== currentUrl);
    const choices = alternatives.length ? alternatives : posts;
    return choices.length ? choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))] : null;
  }
  // Export the date and selection logic for boundary tests without a browser clock override.
  if (typeof module === 'object' && module.exports) module.exports = { beijingTime, greeting, calendarDays, pickPost };
  if (typeof document === 'undefined') return;

  const clock = document.querySelector('[data-clock]');
  const clockDate = document.querySelector('[data-clock-date]');
  const hello = document.querySelector('[data-greeting]');
  const calendar = document.querySelector('[data-calendar]');
  let renderedDay;
  function updateTime() {
    const date = beijingTime();
    const dayKey = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    if (clock) {
      clock.textContent = `${String(date.hour).padStart(2, '0')}:${date.minute}`;
      clock.dateTime = `${dayKey}T${clock.textContent}:00+08:00`;
      clockDate.textContent = `${date.year} / ${String(date.month).padStart(2, '0')} / ${String(date.day).padStart(2, '0')} · 周${date.weekday}`;
    }
    if (hello) hello.textContent = greeting(date.hour);
    if (calendar && renderedDay !== dayKey) {
      renderedDay = dayKey;
      document.querySelector('[data-calendar-title]').textContent = `${date.year} 年 ${date.month} 月`;
      const table = document.createElement('table');
      table.className = 'calendar-table';
      table.setAttribute('aria-label', `${date.year}年${date.month}月，北京时间`);
      const header = table.createTHead().insertRow();
      ['一', '二', '三', '四', '五', '六', '日'].forEach(day => {
        const th = document.createElement('th');
        th.scope = 'col'; th.textContent = day; header.append(th);
      });
      const body = table.createTBody();
      let row;
      calendarDays(date.year, date.month).forEach((day, index) => {
        if (index % 7 === 0) row = body.insertRow();
        const cell = row.insertCell();
        if (day === null) return;
        const label = document.createElement('span');
        label.textContent = day;
        if (day === date.day) {
          label.className = 'calendar-today';
          label.setAttribute('aria-current', 'date');
          label.setAttribute('aria-label', `${date.month}月${day}日，今天`);
        }
        cell.append(label);
      });
      calendar.replaceChildren(table);
    }
  }
  if (clock || calendar || hello) {
    updateTime();
    setInterval(() => { if (!document.hidden) updateTime(); }, 15000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) updateTime(); });
  }

  const card = document.querySelector('[data-random-post]');
  if (card && card.querySelector('[data-random-link]')) {
    const button = card.querySelector('[data-random-next]');
    const link = card.querySelector('[data-random-link]');
    const status = card.querySelector('[data-random-status]');
    let posts = [];
    let current = link.getAttribute('href');
    function showPost(post) {
      if (!post) return;
      current = post.url;
      link.href = post.url; link.textContent = post.title;
      card.querySelector('[data-random-date]').textContent = post.date.replaceAll('-', '.');
      card.querySelector('[data-random-description]').textContent = post.description || '打开这篇记录，看看有什么新发现。';
    }
    async function loadRecommendations() {
      try {
        const response = await fetch(card.dataset.url);
        if (!response.ok) throw new Error('Recommendations unavailable');
        const data = await response.json();
        posts = data.filter(post => typeof post.title === 'string' && typeof post.date === 'string' && typeof post.url === 'string' && new URL(post.url, location.origin).origin === location.origin);
        if (posts.length) showPost(pickPost(posts, null));
        button.hidden = posts.length < 2;
      } catch {
        // Keep the real, server-rendered article usable when the network is unavailable.
        status.textContent = '暂时无法切换推荐，可以直接阅读当前文章。';
      }
    }
    button.addEventListener('click', () => showPost(pickPost(posts, current)));
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); loadRecommendations(); }
      }, { rootMargin: '200px' });
      observer.observe(card);
    } else loadRecommendations();
  }
})();
