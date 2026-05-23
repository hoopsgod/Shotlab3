import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);

test('player/coach dashboards do not reference removed player leaderboard status symbol', async () => {
  const source = await readFile(APP_PATH, 'utf8');

  assert.doesNotMatch(source, new RegExp(`\\b${["leaderboard","Status","For","Player"].join("")}\\b`));
  assert.match(source, /HomeShotsLeaderboardCard/);
  assert.match(source, /status=\{leaderboardBlocked\?"idle":\(homeShotsLeaderboard\?\.status\|\|"idle"\)\}/);
  assert.match(source, /rows=\{leaderboardRows\}/);
  assert.match(source, /error=\{leaderboardErrorForPlayer\}/);

  assert.match(source, /COACH GUIDANCE/);
  assert.match(source, /TOP 10 PLAYER HOME SHOTS/);
});
