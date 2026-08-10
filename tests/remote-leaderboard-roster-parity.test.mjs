import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildActiveRosterIdentity,
  filterActiveRosterLeaderboardRows,
} from '../src/lib/rosterIdentity.js';

const TEAM_ID = 'team-parity-2026';

function selfOnlyIdentity() {
  return buildActiveRosterIdentity([
    {
      id: 'player-demo-primary',
      email: 'paid.player@shotlab.app',
      name: 'Demo Player',
      role: 'player',
      teamId: TEAM_ID,
    },
  ], TEAM_ID);
}

test('authorized remote leaderboard summaries survive a self-scoped player roster', () => {
  const identity = selfOnlyIdentity();
  const rows = filterActiveRosterLeaderboardRows([
    {
      rank: 1,
      player_display_name: 'Ava Brooks',
      total_home_shots: 160,
      leaderboard_source: 'remote',
    },
    {
      rank: 2,
      player_display_name: 'Demo Player',
      total_home_shots: 125,
      leaderboard_source: 'remote',
    },
  ], identity.keySet, identity.emailSet, identity.nameSet);

  assert.deepEqual(rows.map((row) => row.player_display_name), ['Ava Brooks', 'Demo Player']);
  assert.deepEqual(rows.map((row) => row.rank), [1, 2]);
});

test('unmarked identity-less leaderboard rows are still rejected when local roster cannot validate them', () => {
  const identity = selfOnlyIdentity();
  const rows = filterActiveRosterLeaderboardRows([
    {
      rank: 1,
      player_display_name: 'Ava Brooks',
      total_home_shots: 160,
    },
    {
      rank: 2,
      player_display_name: 'Demo Player',
      total_home_shots: 125,
    },
  ], identity.keySet, identity.emailSet, identity.nameSet);

  assert.deepEqual(rows.map((row) => row.player_display_name), ['Demo Player']);
  assert.deepEqual(rows.map((row) => row.rank), [1]);
});
