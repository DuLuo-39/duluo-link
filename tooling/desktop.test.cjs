const { test } = require('node:test');
const assert = require('node:assert/strict');
const { beijingTime, greeting, calendarDays, pickPost, formatDuration, nextTrackIndex } = require('../themes/journal/source/js/desktop.js');

test('Beijing time rolls over at UTC 16:00, including month and year boundaries', () => {
  assert.deepEqual(beijingTime(new Date('2026-12-31T15:59:59Z')), { year:2026, month:12, day:31, hour:23, minute:'59', weekday:'四' });
  assert.deepEqual(beijingTime(new Date('2026-12-31T16:00:00Z')), { year:2027, month:1, day:1, hour:0, minute:'00', weekday:'五' });
  assert.deepEqual(beijingTime(new Date('2026-09-30T16:00:00Z')), { year:2026, month:10, day:1, hour:0, minute:'00', weekday:'四' });
});
test('greetings switch at each defined boundary', () => {
  for (const [hour, expected] of [[0,'夜半微光'],[5,'夜半微光'],[6,'晨雾未散'],[10,'晨雾未散'],[11,'正午静流'],[13,'正午静流'],[14,'午后漂移'],[17,'午后漂移'],[18,'日暮余晖'],[23,'日暮余晖']]) assert.equal(greeting(hour), expected);
});
test('calendar begins Monday and pads all weeks, including six-week months', () => {
  const september = calendarDays(2026, 9);
  assert.deepEqual(september.slice(0,7), [null,1,2,3,4,5,6]);
  assert.equal(september.filter(Boolean).length, 30);
  assert.equal(september.length % 7, 0);
  assert.equal(calendarDays(2026, 3).length, 42);
  assert.deepEqual(calendarDays(2026, 3).slice(0,7), [null,null,null,null,null,null,1]);
  assert.equal(calendarDays(2027, 2).length, 28);
});
test('calendar observes Gregorian leap years, including century exceptions', () => {
  assert.equal(calendarDays(2024,2).filter(Boolean).length,29);
  assert.equal(calendarDays(2026,2).filter(Boolean).length,28);
  assert.equal(calendarDays(2000,2).filter(Boolean).length,29);
  assert.equal(calendarDays(2100,2).filter(Boolean).length,28);
});
test('duration formats whole minutes and seconds', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(5), '00:05');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(59.9), '00:59');
});
test('duration rejects NaN, negatives and infinity', () => {
  assert.equal(formatDuration(NaN), '00:00');
  assert.equal(formatDuration(-4), '00:00');
  assert.equal(formatDuration(Infinity), '00:00');
  assert.equal(formatDuration('nope'), '00:00');
});
test('track index wraps forward and backward', () => {
  assert.equal(nextTrackIndex(0, 3, 1), 1);
  assert.equal(nextTrackIndex(2, 3, 1), 0);
  assert.equal(nextTrackIndex(0, 3, -1), 2);
  assert.equal(nextTrackIndex(1, 4, -3), 2);
});
test('track index stays at zero when there is no playlist', () => {
  assert.equal(nextTrackIndex(4, 0, 1), 0);
  assert.equal(nextTrackIndex(1, -2, -1), 0);
});
test('zero, one and multiple recommendations; changing never repeats current post', () => {
  const posts = [{url:'/a/'},{url:'/b/'},{url:'/c/'}];
  assert.equal(pickPost([],null),null);
  assert.equal(pickPost([posts[0]],'/a/'),posts[0]);
  assert.equal(pickPost(posts,'/a/',()=>0),posts[1]);
  assert.equal(pickPost(posts,'/a/',()=>0.9999),posts[2]);
  assert.equal(pickPost(posts,null,()=>0),posts[0]);
  assert.equal(pickPost(posts,null,()=>0.9999),posts[2]);
});
