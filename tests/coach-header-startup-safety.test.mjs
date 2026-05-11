import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);
const HERO_PATH = new URL('../src/components/CoachHero.jsx', import.meta.url);

test('coach header teamName wiring does not reference out-of-scope myTeam in Coach render', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /teamName=\{team\?\.name \?\? "Titans Program"\}/);
  assert.doesNotMatch(source, /teamName=\{myTeam\?\.name\}/);
});

test('coach header has safe fallback labels for startup and missing team data', async () => {
  const source = await readFile(HERO_PATH, 'utf8');
  assert.match(source, /const coachLabel = userName \|\| "Demo Coach";/);
  assert.match(source, /const programLabel = branding\?\.teamName \?\? teamName \?\? "Titans Program";/);
});
