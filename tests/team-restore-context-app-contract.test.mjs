import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('app restores team context from backend after auth restore/login', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /\/v1\/teams\/restore-context/);
  assert.match(src, /Team context could not be restored\./);
  assert.match(src, /CoachCommandCenter/);
});
