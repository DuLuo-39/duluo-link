'use strict';

(() => {
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  function beijingTime(now = new Date()) {
    const parts = Object.fromEntries(formatter.formatToParts(now).map(part => [part.type, part.value]));
    return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: parts.minute, second: parts.second, weekday: weekdays[new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))).getUTCDay()] };
  }
  function greeting(hour) {
    if (hour < 6) return '夜半微光';
    if (hour < 11) return '晨雾未散';
    if (hour < 14) return '正午静流';
    if (hour < 18) return '午后漂移';
    return '日暮余晖';
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
  function formatDuration(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value) || value < 0) return '00:00';
    const total = Math.floor(value);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
  function nextTrackIndex(current, total, step) {
    const count = Math.floor(Number(total));
    if (!Number.isFinite(count) || count <= 0) return 0;
    const index = Number.isFinite(Number(current)) ? Math.trunc(Number(current)) : 0;
    const delta = Number.isFinite(Number(step)) ? Math.trunc(Number(step)) : 0;
    return ((index + delta) % count + count) % count;
  }
  // Export the date and selection logic for boundary tests without a browser clock override.
  if (typeof module === 'object' && module.exports) module.exports = { beijingTime, greeting, calendarDays, pickPost, formatDuration, nextTrackIndex };
  if (typeof document === 'undefined') return;

  const clock = document.querySelector('[data-clock]');
  const clockMain = clock?.querySelector('.clock-main');
  const clockSec = clock?.querySelector('.clock-sec');
  const clockDate = document.querySelector('[data-clock-date]');
  const hello = document.querySelector('[data-greeting]');
  const calendar = document.querySelector('[data-calendar]');
  let renderedDay;
  function updateTime() {
    const date = beijingTime();
    const dayKey = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    if (clock) {
      const main = `${String(date.hour).padStart(2, '0')}:${date.minute}`;
      if (clockMain.textContent !== main) clockMain.textContent = main;
      clockSec.textContent = `:${date.second}`;
      clock.dateTime = `${dayKey}T${main}:${date.second}+08:00`;
      if (clockDate && renderedDay !== dayKey) clockDate.textContent = `${String(date.month).padStart(2, '0')}.${String(date.day).padStart(2, '0')} · 周${date.weekday}`;
    }
    if (hello && hello.textContent !== greeting(date.hour)) hello.textContent = greeting(date.hour);
    if (calendar && renderedDay !== dayKey) {
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
    renderedDay = dayKey;
  }
  if (clock || calendar || hello) {
    let timer;
    function syncTime() {
      clearInterval(timer);
      if (document.hidden) return;
      updateTime();
      timer = setInterval(updateTime, clock ? 1000 : 15000);
    }
    syncTime();
    document.addEventListener('visibilitychange', syncTime);
  }

  const calendarToggle = document.querySelector('[data-calendar-toggle]');
  const calendarPanel = document.getElementById('stage-calendar');
  if (calendarToggle && calendarPanel) {
    function setCalendarOpen(open) {
      calendarPanel.hidden = !open;
      calendarToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    calendarToggle.addEventListener('click', event => {
      event.stopPropagation();
      setCalendarOpen(calendarPanel.hidden);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !calendarPanel.hidden) setCalendarOpen(false);
    });
    document.addEventListener('click', event => {
      if (!calendarPanel.hidden && !calendarPanel.contains(event.target) && !calendarToggle.contains(event.target)) setCalendarOpen(false);
    });
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

  const player = document.querySelector('[data-music-player]');
  const audio = player && player.querySelector('[data-music-audio]');
  if (player && audio) {
    let tracks = [];
    try { tracks = JSON.parse(player.querySelector('[data-music-tracks]').textContent || '[]'); }
    catch { tracks = []; }
    if (tracks.length) {
      let index = 0;
      const title = player.querySelector('[data-music-title]');
      const artist = player.querySelector('[data-music-artist]');
      const toggle = player.querySelector('[data-music-toggle]');
      const previous = player.querySelector('[data-music-prev]');
      const next = player.querySelector('[data-music-next]');
      const progress = player.querySelector('[data-music-progress]');
      const currentTime = player.querySelector('[data-music-current]');
      const totalTime = player.querySelector('[data-music-duration]');
      const error = player.querySelector('[data-music-error]');
      let seeking = false;
      function setPlaying(playing) {
        toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
        toggle.setAttribute('aria-label', playing ? '暂停' : '播放');
        toggle.textContent = playing ? 'Ⅱ' : '▶';
        player.classList.toggle('is-playing', playing);
      }
      function showError() {
        if (error) error.hidden = false;
        setPlaying(false);
      }
      function showTrack(nextIndex, shouldPlay) {
        index = nextTrackIndex(nextIndex, tracks.length, 0);
        const track = tracks[index];
        if (error) error.hidden = true;
        title.textContent = track.title;
        artist.textContent = track.artist || '未署名';
        progress.value = '0';
        currentTime.textContent = '00:00';
        totalTime.textContent = '00:00';
        audio.src = track.src;
        if (!shouldPlay) { setPlaying(false); return; }
        audio.play().then(() => setPlaying(true)).catch(showError);
      }
      toggle.addEventListener('click', () => {
        if (audio.paused) audio.play().then(() => setPlaying(true)).catch(showError);
        else { audio.pause(); setPlaying(false); }
      });
      previous.addEventListener('click', () => { if (!previous.disabled) showTrack(nextTrackIndex(index, tracks.length, -1), !audio.paused); });
      next.addEventListener('click', () => { if (!next.disabled) showTrack(nextTrackIndex(index, tracks.length, 1), !audio.paused); });
      audio.addEventListener('timeupdate', () => {
        currentTime.textContent = formatDuration(audio.currentTime);
        if (!seeking && Number.isFinite(audio.duration) && audio.duration > 0) progress.value = String(Math.round(audio.currentTime / audio.duration * 1000));
      });
      audio.addEventListener('loadedmetadata', () => { totalTime.textContent = formatDuration(audio.duration); });
      audio.addEventListener('ended', () => {
        if (tracks.length > 1) showTrack(nextTrackIndex(index, tracks.length, 1), true);
        else setPlaying(false);
      });
      audio.addEventListener('error', showError);
      progress.addEventListener('blur', () => { seeking = false; });
      progress.addEventListener('pointerdown', () => { seeking = true; });
      progress.addEventListener('pointerup', () => { seeking = false; });
      progress.addEventListener('pointercancel', () => { seeking = false; });
      progress.addEventListener('change', () => { seeking = false; });
      progress.addEventListener('input', () => {
        seeking = true;
        if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = audio.duration * Number(progress.value) / 1000;
      });
    }
  }

  const moodFallbacks = ['#f6dfeb', '#e9e2f7', '#ddedf7'];
  function paintMood(mood) {
    const colors = Array.isArray(mood) ? mood : [];
    const root = document.documentElement;
    [0, 1, 2].forEach(slot => {
      const value = typeof colors[slot] === 'string' ? colors[slot].trim() : '';
      root.style.setProperty(`--mood-${slot + 1}`, /^#[\da-f]{6}$/i.test(value) ? value : moodFallbacks[slot]);
    });
  }
  const artwork = document.querySelector('[data-artwork]');
  if (artwork) {
    let pieces = [];
    try { pieces = JSON.parse((artwork.querySelector('[data-artwork-data]') || {}).textContent || '[]'); }
    catch { pieces = []; }
    if (pieces[0]) paintMood(pieces[0].mood);
    if (artwork.hasAttribute('data-artwork-switch') && pieces.length > 1) {
      let index = 0;
      const image = artwork.querySelector('[data-artwork-image]');
      const source = artwork.querySelector('[data-artwork-source]');
      const title = artwork.querySelector('[data-artwork-title]');
      const character = artwork.querySelector('[data-artwork-character]');
      const series = artwork.querySelector('[data-artwork-series]');
      const seriesWrap = artwork.querySelector('[data-artwork-series-wrap]');
      const artist = artwork.querySelector('[data-artwork-artist]');
      const counter = artwork.querySelector('[data-artwork-index]');
      const pad = value => String(value).padStart(2, '0');
      let fadeId = 0;
      function showArtwork(nextIndex) {
        const count = pieces.length;
        if (count < 2 || !image) return;
        index = ((nextIndex % count) + count) % count;
        const item = pieces[index];
        const render = () => {
          image.src = item.image;
          image.alt = item.alt || item.title || '';
          if (item.width) image.width = item.width;
          if (item.height) image.height = item.height;
          source.href = item.source_url || item.image;
          source.setAttribute('aria-label', `查看《${item.title || item.character || '插画'}》原作`);
          if (title) title.textContent = item.title ? `《${item.title}》` : (item.character || '插画');
          if (character) character.textContent = item.character || '';
          if (series) series.textContent = item.series || '';
          if (seriesWrap) seriesWrap.hidden = !item.series;
          const credit = item.artist_handle || item.artist || '';
          artist.href = item.artist_url || item.source_url || item.image;
          artist.textContent = credit ? `${credit} ↗` : '原作 ↗';
          if (counter) counter.textContent = `${pad(index + 1)} / ${pad(count)}`;
          paintMood(item.mood);
        };
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) { render(); return; }
        const id = ++fadeId;
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          image.removeEventListener('transitionend', onEnd);
          if (id !== fadeId) return;
          render();
          image.classList.remove('is-leaving');
        };
        const onEnd = event => {
          if (event.target === image && (event.propertyName === 'opacity' || event.propertyName === 'transform')) finish();
        };
        image.addEventListener('transitionend', onEnd);
        image.classList.remove('is-leaving');
        void image.offsetWidth;
        image.classList.add('is-leaving');
        setTimeout(finish, 360);
      }
      artwork.addEventListener('click', event => {
        if (event.target.closest('[data-artwork-prev]')) showArtwork(index - 1);
        if (event.target.closest('[data-artwork-next]')) showArtwork(index + 1);
      });
      document.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        if (document.querySelector('dialog[open]')) return;
        if (pieces.length < 2) return;
        const active = document.activeElement;
        if (active && active.closest('input, textarea, select, dialog[open], [contenteditable="true"]')) return;
        event.preventDefault();
        showArtwork(index + (event.key === 'ArrowRight' ? 1 : -1));
      });
    }
  }
})();
