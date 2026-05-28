import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('player home leaderboard render uses safe shared values and avoids undefined legacy vars', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.equal(appSource.includes('leaderboardStatusForPlayer'), false, 'legacy undefined leaderboardStatusForPlayer should not exist');
  assert.equal(appSource.includes('leaderboardBlocked'), false, 'legacy undefined leaderboardBlocked should not exist');
  assert.equal(appSource.includes('const rows=Array.isArray(homeShotsLeaderboard?.rows)?homeShotsLeaderboard.rows:[];'), true);
  assert.equal(appSource.includes('status={homeShotsLeaderboard?.status||"idle"}'), true);
  assert.equal(appSource.includes('rows={homeShotsLeaderboard?.rows||[]}'), true);
  assert.equal(appSource.includes('refreshHomeShotsLeaderboard={()=>fetchHomeShotsLeaderboard(user?.teamId,"players")}'), true, 'player refresh should always use players scope');
});
