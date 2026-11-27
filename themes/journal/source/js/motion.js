'use strict';

function clamp(value, min, max) {
  const low = Number(min);
  const high = Number(max);
  const floor = Number.isFinite(low) && Number.isFinite(high) ? Math.min(low, high) : 0;
  const ceil = Number.isFinite(low) && Number.isFinite(high) ? Math.max(low, high) : 0;
  const number = Number(value);
  if (!Number.isFinite(number)) return floor;
  return Math.min(ceil, Math.max(floor, number));
}

function lerp(start, end, factor) {
  const from = Number(start);
  const to = Number(end);
  const origin = Number.isFinite(from) ? from : 0;
  const target = Number.isFinite(to) ? to : origin;
  return origin + (target - origin) * clamp(factor, 0, 1);
}

function tiltAngles(normX, normY, maxDeg) {
  const max = clamp(Math.abs(Number(maxDeg)), 0, 3.5);
  const x = clamp(normX, -0.5, 0.5);
  const y = clamp(normY, -0.5, 0.5);
  return { rotateX: y === 0 ? 0 : -y * 2 * max, rotateY: x === 0 ? 0 : x * 2 * max };
}

function magneticOffset(normX, normY, maxPx) {
  const max = clamp(Math.abs(Number(maxPx)), 0, 6);
  const x = clamp(normX, -0.5, 0.5);
  const y = clamp(normY, -0.5, 0.5);
  return { x: x * 2 * max, y: y * 2 * max };
}

function pointerInfluence(distance, radius) {
  if (!Number.isFinite(distance) || !Number.isFinite(radius) || distance < 0 || radius <= 0) return 0;
  return Math.max(0, 1 - distance / radius);
}

if (typeof module === 'object' && module.exports) module.exports = { clamp, lerp, tiltAngles, magneticOffset, pointerInfluence };

function startAmbient(signal, finePointer) {
  const sky = document.querySelector('.aurora-bg');
  const glow = sky.querySelector('.aurora-pointer');
  const canvas = document.querySelector('.ambient-canvas');
  const ctx = canvas.getContext('2d');
  const colors = ['#9177ad', '#709bb5', '#bc829d'];
  const particles = [];
  let width = 0, height = 0, ratio = 0;
  let x = innerWidth / 2, y = innerHeight / 2;
  let targetX = x, targetY = y;
  let active = false, light = 0, frame = 0, last = 0;
  let needsResize = true;
  let following = false;

  function resize() {
    const oldWidth = width, oldHeight = height;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (const p of particles) {
      p.x *= width / oldWidth;
      p.y *= height / oldHeight;
    }
    const count = ctx && width && height ? (width < 760 ? 32 : 60) : 0;
    while (particles.length < count) {
      particles.push({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - .5) * 8, vy: -1 - Math.random() * 4,
        phase: Math.random() * 2 * Math.PI, radius: .9 + Math.random() * 1.1,
        color: colors[particles.length % colors.length]
      });
    }
    particles.length = count;
    needsResize = false;
    following = active || light > 0;
  }

  function thread(ax, ay, bx, by, strength) {
    ctx.globalAlpha = .14 * strength;
    ctx.strokeStyle = '#78619c';
    ctx.lineWidth = .8;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  function draw(now, dt) {
    ctx.clearRect(0, 0, width, height);
    const nearby = [];
    for (const p of particles) {
      p.x = (p.x + p.vx * dt + width) % width;
      p.y = (p.y + p.vy * dt + height) % height;
      const dx = targetX - p.x, dy = targetY - p.y;
      const influence = active ? pointerInfluence(Math.hypot(dx, dy), 170) : 0;
      const px = p.x + dx * influence * .26;
      const py = p.y + dy * influence * .26;
      if (influence > 0) {
        thread(px, py, targetX, targetY, influence);
        for (const other of nearby) {
          const link = pointerInfluence(Math.hypot(px - other.x, py - other.y), 115);
          if (link > 0) thread(px, py, other.x, other.y, link * Math.min(influence, other.influence));
        }
        nearby.push({ x:px, y:py, influence });
      }
      const breath = Math.sin(now * .0009 + p.phase);
      ctx.globalAlpha = .38 + .12 * breath + .43 * influence;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.radius * (1 + .11 * breath + .8 * influence), 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function render(now) {
    frame = requestAnimationFrame(render);
    if (last && now - last < (following ? 15 : 30)) return;
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    if (needsResize || ratio !== Math.min(devicePixelRatio || 1, 2)) resize();
    if (following) {
      const tx = active ? targetX : width / 2;
      const ty = active ? targetY : height / 2;
      const ease = 1 - Math.exp(-8 * dt);
      x = lerp(x, tx, ease);
      y = lerp(y, ty, ease);
      const distance = Math.hypot(tx - x, ty - y);
      const speed = Math.min(distance / 180, 1);
      const brightness = active ? .68 + speed * .24 : 0;
      light = lerp(light, brightness, ease);
      if (distance < .25 && Math.abs(light - brightness) < .002) {
        x = tx; y = ty; light = active ? .68 : 0;
        following = false;
      }
      sky.style.setProperty('--aurora-x', `${(width / 2 - x) * .08}px`);
      sky.style.setProperty('--aurora-y', `${(height / 2 - y) * .06}px`);
      glow.style.transform = `translate3d(${x}px,${y}px,0) scale(${1 + speed * .12})`;
      glow.style.opacity = light;
    }
    if (ctx && width && height) draw(now, dt);
  }

  function leave() {
    following = active || light > 0;
    active = false;
  }
  finePointer.addEventListener('change', leave, { signal });
  window.addEventListener('pointermove', event => {
    if (!finePointer.matches || event.pointerType !== 'mouse') return;
    targetX = event.clientX;
    targetY = event.clientY;
    active = true;
    following = true;
  }, { passive:true, signal });
  window.addEventListener('pointerout', event => { if (!event.relatedTarget) leave(); }, { signal });
  window.addEventListener('blur', leave, { signal });
  window.addEventListener('resize', () => { needsResize = true; }, { passive:true, signal });
  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    if (document.hidden || signal.aborted) leave();
    else frame = requestAnimationFrame(render);
  }
  document.addEventListener('visibilitychange', sync, { signal });
  signal.addEventListener('abort', () => {
    sync();
    sky.style.removeProperty('--aurora-x');
    sky.style.removeProperty('--aurora-y');
    glow.style.removeProperty('transform');
    glow.style.removeProperty('opacity');
    ctx?.clearRect(0, 0, width, height);
  });
  sync();
}

function startMotion(signal) {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  startAmbient(signal, finePointer);

  document.querySelectorAll('[data-tilt], [data-magnetic]').forEach(element => {
    const tilt = element.hasAttribute('data-tilt');
    const activeClass = tilt ? 'is-tilting' : 'is-magnet';
    function reset() {
      element.classList.remove(activeClass);
      element.style.transform = '';
    }
    element.addEventListener('pointermove', event => {
      if (!finePointer.matches || event.pointerType !== 'mouse') return;
      const rect = element.getBoundingClientRect();
      const x = rect.width ? (event.clientX - rect.left) / rect.width - .5 : 0;
      const y = rect.height ? (event.clientY - rect.top) / rect.height - .5 : 0;
      element.classList.add(activeClass);
      if (tilt) {
        const angles = tiltAngles(x, y, 3.5);
        element.style.transform = `perspective(900px) rotateX(${angles.rotateX.toFixed(2)}deg) rotateY(${angles.rotateY.toFixed(2)}deg)`;
        element.style.setProperty('--glare-x', `${((x + .5) * 100).toFixed(1)}%`);
        element.style.setProperty('--glare-y', `${((y + .5) * 100).toFixed(1)}%`);
      } else {
        const offset = magneticOffset(x, y, 6);
        element.style.transform = `translate3d(${offset.x.toFixed(2)}px,${offset.y.toFixed(2)}px,0)`;
      }
    }, { signal });
    element.addEventListener('pointerleave', reset, { signal });
    signal.addEventListener('abort', reset, { once:true });
  });

  const revealNodes = [...document.querySelectorAll('[data-reveal]')];
  if (revealNodes.length && 'IntersectionObserver' in window) {
    const counts = new WeakMap();
    revealNodes.forEach(element => {
      const parent = element.parentElement || document.body;
      const index = counts.get(parent) || 0;
      counts.set(parent, index + 1);
      element.style.setProperty('--reveal-delay', `${Math.min(index * 50, 250)}ms`);
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-shown');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    document.documentElement.classList.add('motion-on');
    const frame = requestAnimationFrame(() => {
      revealNodes.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight * 0.92) element.classList.add('is-shown');
        else observer.observe(element);
      });
    });
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.documentElement.classList.remove('motion-on');
    });
  }

  const hero = document.querySelector('.stage-hero');
  if (hero) {
    const layers = [
      [document.querySelector('.stage-artwork'), -14],
      [document.querySelector('.stage-music'), 8],
      [document.querySelector('.stage-socials'), 12]
    ].filter(([element]) => element);
    let frame = 0;
    const applyParallax = () => {
      frame = 0;
      const progress = clamp(window.scrollY / Math.max(hero.offsetHeight, 1), 0, 1);
      layers.forEach(([element, distance]) => {
        element.style.translate = `0 ${(distance * progress).toFixed(2)}px`;
      });
    };
    window.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(applyParallax);
    }, { passive: true, signal });
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      layers.forEach(([element]) => element.style.removeProperty('translate'));
    });
  }
}

if (typeof document !== 'undefined') {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let controller;
  function syncMotion() {
    controller?.abort();
    if (reduced.matches) return;
    controller = new AbortController();
    startMotion(controller.signal);
  }
  reduced.addEventListener('change', syncMotion);
  syncMotion();
}
