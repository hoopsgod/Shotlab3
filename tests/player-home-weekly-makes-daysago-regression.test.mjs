import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);

test('player home weekly makes uses local seven-day helper instead of undefined daysAgo', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /const isWithinLastSevenDays=\(dateValue\)=>\{/);
  assert.match(source, /const weeklyMakes=shotLogs\.filter\(s=>s\.email===u\.email&&isWithinLastSevenDays\(s\.date\)\)\.reduce\(\(a,s\)=>a\+s\.made,0\);/);
  assert.doesNotMatch(source, /const weeklyMakes=shotLogs\.filter\(s=>s\.email===u\.email&&daysAgo\(s\.date\)<=6\)\.reduce\(\(a,s\)=>a\+s\.made,0\);/);
});
