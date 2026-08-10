import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildActiveRosterIdentity,
  filterActiveRosterLeaderboardRows,
} from '../src/lib/rosterIdentity.js';

const TEAM_ID = 'team-parity-2026';
const homeShotsSource = await readFile(new URL('../functions/v1/leaderboards/home-shots.js', import.meta.url), 'utf8');

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

test('authorized home-shots API marks privacy-minimal leaderboard summaries as remote', () => {
  assert.match(homeShotsSource, /leaderboard_source:\s*["']remote["']/);
});

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

test('unmarked identity-less leaderboard rows remain rejected when local roster cannot validate them', () => {
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

test('remote marker does not authorize malformed or inactive leaderboard rows', () => {
  const identity = selfOnlyIdentity();
  const rows = filterActiveRosterLeaderboardRows([
    {
      player_display_name: 'Missing Total',
      leaderboard_source: 'remote',
    },
    {
      player_display_name: 'Empty Total',
      total_home_shots: '',
      leaderboard_source: 'remote',
    },
    {
      player_display_name: 'Negative Total',
      total_home_shots: -1,
      leaderboard_source: 'remote',
    },
    {
      player_display_name: 'Archived Player',
      total_home_shots: 90,
      leaderboard_source: 'remote',
      archived: true,
    },
    {
      player_display_name: 'Valid Remote Player',
      total_home_shots: 0,
      leaderboard_source: 'remote',
    },
  ], identity.keySet, identity.emailSet, identity.nameSet);

  assert.deepEqual(rows.map((row) => row.player_display_name), ['Valid Remote Player']);
  assert.deepEqual(rows.map((row) => row.rank), [1]);
});
