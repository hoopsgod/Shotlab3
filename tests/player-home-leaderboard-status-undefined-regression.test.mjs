import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('player home leaderboard render uses safe derived values and avoids undefined legacy vars', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.equal(appSource.includes('leaderboardStatusForPlayer'), false, 'legacy undefined leaderboardStatusForPlayer should not exist');
  assert.equal(appSource.includes('leaderboardBlocked'), false, 'legacy undefined leaderboardBlocked should not exist');
  assert.equal(appSource.includes('const playerLeaderboardState=useMemo(()=>{'), true);
  assert.equal(appSource.includes('const rows=Array.isArray(homeShotsLeaderboard?.rows)?homeShotsLeaderboard.rows:[];'), true);
  assert.equal(appSource.includes('status={playerDashboardLeaderboardStatus}'), true);
  assert.equal(appSource.includes('rows={playerDashboardLeaderboardRows}'), true);
  assert.equal(appSource.includes('const playerDashboardHomeLeaderboardRows=useMemo(()=>buildAtHomeLeaderboardRows({scores,shotLogs,programDrills,players:playerLeaderboardPlayers,limit:3})'), true);
  assert.equal(appSource.includes('emptyMessage="No leaderboard data yet. Log shots to enter the rankings."'), true);
  assert.equal(appSource.includes('currentUser={u}'), true, 'player leaderboard hub should receive current user identity');
  assert.equal(appSource.includes('playerLeaderboardPlayers=useMemo'), true, 'player leaderboard should include a current-user identity fallback');
  assert.equal(appSource.includes('refreshHomeShotsLeaderboard={()=>fetchHomeShotsLeaderboard(user?.teamId,"players")}'), true, 'player refresh should always use players scope');
});
