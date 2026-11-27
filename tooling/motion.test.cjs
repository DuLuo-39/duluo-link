const { test } = require('node:test');
const assert = require('node:assert/strict');
const { clamp, lerp, tiltAngles, magneticOffset, pointerInfluence } = require('../themes/journal/source/js/motion.js');

test('pointer influence fades from the cursor to the interaction radius', () => {
  assert.equal(pointerInfluence(0, 170), 1);
  assert.equal(pointerInfluence(85, 170), 0.5);
  assert.equal(pointerInfluence(170, 170), 0);
  assert.equal(pointerInfluence(250, 170), 0);
});

test('invalid distances and radii exert no influence', () => {
  for (const invalid of [NaN, Infinity, -Infinity, -1, null, undefined, '12']) {
    assert.equal(pointerInfluence(invalid, 170), 0);
    assert.equal(pointerInfluence(0, invalid), 0);
  }
  assert.equal(pointerInfluence(0, 0), 0);
});

test('clamp clips to the closed range and accepts inverted bounds', () => {
  assert.equal(clamp(2, 0, 1), 1);
  assert.equal(clamp(-4, 0, 1), 0);
  assert.equal(clamp(0.25, 0, 1), 0.25);
  assert.equal(clamp(9, 4, -2), 4);
  assert.equal(clamp(Number.NaN, 0, 1), 0);
});

test('lerp stays on the segment and repeated steps converge on the target', () => {
  assert.equal(lerp(0, 10, 0), 0);
  assert.equal(lerp(0, 10, 1), 10);
  assert.equal(lerp(0, 10, 0.5), 5);
  assert.equal(lerp(0, 10, 2), 10);
  assert.equal(lerp(0, 10, -1), 0);
  let value = 0;
  for (let step = 0; step < 16; step += 1) value = lerp(value, 10, 0.5);
  assert.ok(Math.abs(value - 10) < 0.001);
});

test('tiltAngles is zero at the center and symmetric at opposite edges', () => {
  assert.deepEqual(tiltAngles(0, 0, 3.5), { rotateX: 0, rotateY: 0 });
  const right = tiltAngles(0.5, 0, 3.5);
  const left = tiltAngles(-0.5, 0, 3.5);
  assert.equal(right.rotateY, 3.5);
  assert.equal(left.rotateY, -right.rotateY);
  assert.equal(right.rotateX, 0);
  const down = tiltAngles(0, 0.5, 3.5);
  const up = tiltAngles(0, -0.5, 3.5);
  assert.equal(down.rotateX, -3.5);
  assert.equal(up.rotateX, -down.rotateX);
  assert.equal(tiltAngles(4, -4, 12).rotateY, 3.5);
  assert.equal(Math.abs(tiltAngles(4, -4, 12).rotateX), 3.5);
});

test('magneticOffset is zero at the center and never exceeds six pixels', () => {
  assert.deepEqual(magneticOffset(0, 0, 6), { x: 0, y: 0 });
  assert.deepEqual(magneticOffset(0.5, -0.5, 6), { x: 6, y: -6 });
  assert.deepEqual(magneticOffset(-0.5, 0.5, 6), { x: -6, y: 6 });
  const overshot = magneticOffset(3, -3, 40);
  assert.equal(overshot.x, 6);
  assert.equal(overshot.y, -6);
  assert.ok(Math.abs(overshot.x) <= 6 && Math.abs(overshot.y) <= 6);
});
