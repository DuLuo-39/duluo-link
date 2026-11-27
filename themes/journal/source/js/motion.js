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

if (typeof module === 'object' && module.exports) module.exports = { clamp, lerp, tiltAngles, magneticOffset };
if (typeof document !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function pointerNorm(event, element) {
  const rect = element.getBoundingClientRect();
  const x = rect.width ? (event.clientX - rect.left) / rect.width - 0.5 : 0;
  const y = rect.height ? (event.clientY - rect.top) / rect.height - 0.5 : 0;
  return { x, y };
}

if (finePointer) {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.append(glow);
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let frame = 0;
  let primed = false;
  const half = 84;
  function follow() {
    x = lerp(x, targetX, 0.18);
    y = lerp(y, targetY, 0.18);
    if (Math.abs(x - targetX) < 0.35 && Math.abs(y - targetY) < 0.35) {
      x = targetX;
      y = targetY;
      glow.style.transform = `translate3d(${x - half}px, ${y - half}px, 0)`;
      frame = 0;
      return;
    }
    glow.style.transform = `translate3d(${x - half}px, ${y - half}px, 0)`;
    frame = requestAnimationFrame(follow);
  }
  function wake() {
    if (!frame) frame = requestAnimationFrame(follow);
  }
  window.addEventListener('pointermove', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    if (!primed) { primed = true; x = event.clientX; y = event.clientY; }
    targetX = event.clientX;
    targetY = event.clientY;
    glow.classList.add('is-on');
    wake();
  }, { passive: true });
  window.addEventListener('pointerout', event => {
    if (event.relatedTarget) return;
    glow.classList.remove('is-on');
  });
  window.addEventListener('blur', () => glow.classList.remove('is-on'));

  document.querySelectorAll('[data-magnetic]').forEach(element => {
    element.addEventListener('pointerenter', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      element.classList.add('is-magnet');
    });
    element.addEventListener('pointermove', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const point = pointerNorm(event, element);
      const offset = magneticOffset(point.x, point.y, 6);
      element.style.transform = `translate3d(${offset.x.toFixed(2)}px, ${offset.y.toFixed(2)}px, 0)`;
    });
    element.addEventListener('pointerleave', () => {
      element.classList.remove('is-magnet');
      element.style.transform = 'translate3d(0, 0, 0)';
    });
  });

  document.querySelectorAll('[data-tilt]').forEach(element => {
    element.addEventListener('pointermove', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const point = pointerNorm(event, element);
      const angles = tiltAngles(point.x, point.y, 3.5);
      element.classList.add('is-tilting');
      element.style.transform = `perspective(900px) rotateX(${angles.rotateX.toFixed(2)}deg) rotateY(${angles.rotateY.toFixed(2)}deg)`;
      element.style.setProperty('--glare-x', `${((point.x + 0.5) * 100).toFixed(1)}%`);
      element.style.setProperty('--glare-y', `${((point.y + 0.5) * 100).toFixed(1)}%`);
    });
    element.addEventListener('pointerleave', () => {
      element.classList.remove('is-tilting');
      element.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });
  });
}

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
  requestAnimationFrame(() => {
    revealNodes.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight * 0.92) element.classList.add('is-shown');
      else observer.observe(element);
    });
  });
}

const hero = document.querySelector('.stage-hero');
if (hero) {
  const layers = [
    [document.querySelector('.stage-artwork'), -14],
    [document.querySelector('.stage-music'), 8],
    [document.querySelector('.stage-socials'), 12]
  ].filter(([element]) => element);
  let ticking = false;
  const applyParallax = () => {
    ticking = false;
    const progress = clamp(window.scrollY / Math.max(hero.offsetHeight, 1), 0, 1);
    layers.forEach(([element, distance]) => {
      element.style.translate = `0 ${(distance * progress).toFixed(2)}px`;
    });
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(applyParallax);
  }, { passive: true });
}
}
