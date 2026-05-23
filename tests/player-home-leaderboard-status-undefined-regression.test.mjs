import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('player home leaderboard render does not reference removed status variable', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.equal(appSource.includes('leaderboardStatusForPlayer'), false, 'legacy undefined leaderboardStatusForPlayer should not exist');
  assert.equal(appSource.includes('const playerLeaderboardRows=Array.isArray(homeShotsLeaderboard?.rows)?homeShotsLeaderboard.rows:[];'), true);
  assert.equal(appSource.includes('const hasPlayerLeaderboardData=playerLeaderboardRows.length>0;'), true);
  assert.equal(appSource.includes('status={playerLeaderboardStatus}'), true);
  assert.equal(appSource.includes('rows={playerLeaderboardRows}'), true);
});
