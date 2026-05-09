import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);

async function appSource() {
  return readFile(APP_PATH, 'utf8');
}

test('player dashboard program date is clickable and routes to the Program events tab', async () => {
  const source = await appSource();

  assert.match(source, /onClick=\{\(event\)=>\{event\.stopPropagation\(\);switchTab\("program"\);\}\}/);
  assert.match(source, /aria-label="View all events"/);
});

test('player dashboard still renders next event date text', async () => {
  const source = await appSource();

  assert.match(source, /\{nextEvent\.date\.slice\(5\)\}/);
});
