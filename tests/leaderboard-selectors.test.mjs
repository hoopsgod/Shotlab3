import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLeaderboardDecisionSurface,
  resolveLeaderboardDataState,
  selectLeaderboardRows,
} from '../src/lib/leaderboardSelectors.js';

const TEAM_ID = 'team-selectors';
const activePlayers = [
  { id: 'p-ava', playerId: 'p-ava', email: 'ava@example.com', name: 'Ava Longname', role: 'player', teamId: TEAM_ID },
  { id: 'p-bryn', playerId: 'p-bryn', email: 'bryn@example.com', name: 'Bryn', role: 'player', teamId: TEAM_ID },
  { id: 'p-hidden', playerId: 'p-hidden', email: 'hidden@example.com', name: 'Hidden', role: 'player', teamId: TEAM_ID, hideFromLeaderboards: true },
  { id: 'p-archived', playerId: 'p-archived', email: 'archived@example.com', name: 'Archived', role: 'player', teamId: TEAM_ID, archived: true },
  { id: 'p-other', playerId: 'p-other', email: 'other@example.com', name: 'Other Team', role: 'player', teamId: 'another-team' },
];

test('selector filters malformed, inactive, hidden, unrelated, and duplicated current rows without inflating totals', () => {
  const rows = [
    null,
    { player_id: 'p-ava', player_display_name: 'Ava Longname', total_home_shots: 24 },
    { player_id: 'p-ava', player_display_name: 'Ava Longname', total_home_shots: 7 },
    { player_id: 'p-bryn', player_display_name: 'Bryn', total_home_shots: 24 },
    { player_id: 'p-hidden', player_display_name: 'Hidden', total_home_shots: 999 },
    { player_id: 'p-archived', player_display_name: 'Archived', total_home_shots: 998 },
    { player_id: 'p-other', player_display_name: 'Other Team', total_home_shots: 997, team_id: 'another-team' },
    { player_display_name: 'No identity', total_home_shots: 22 },
    { player_id: 'p-bryn', player_display_name: 'Bryn', total_home_shots: 0 },
  ];

  const selected = selectLeaderboardRows({ rows, players: activePlayers, teamId: TEAM_ID });

  assert.deepEqual(selected.map((row) => [row.player_id, row.metricValue, row.rank]), [
    ['p-ava', 24, 1],
    ['p-bryn', 24, 1],
  ]);
  assert.equal(selected.some((row) => row.player_id === 'p-hidden' || row.player_id === 'p-archived'), false);
});

test('selector permits only identity-bearing service-authoritative rows when a player has a self-scoped roster', () => {
  const selfOnlyRoster = [activePlayers[0]];
  const selected = selectLeaderboardRows({
    teamId: TEAM_ID,
    players: selfOnlyRoster,
    rows: [
      { player_id: 'server-verified-bryn', player_display_name: 'Bryn', total_home_shots: 18, leaderboard_source: 'remote' },
      { player_display_name: 'Unverifiable remote', total_home_shots: 19, leaderboard_source: 'remote' },
      { player_id: 'unverified-local', player_display_name: 'Unverified local', total_home_shots: 20 },
    ],
  });

  assert.deepEqual(selected.map((row) => row.player_id), ['server-verified-bryn']);
});

test('all-time rows retain archived identities without cross-team leakage or duplicate summing', () => {
  const selected = selectLeaderboardRows({
    teamId: TEAM_ID,
    players: activePlayers,
    includeArchivedPlayers: true,
    rows: [
      { player_id: 'p-archived', player_display_name: 'Archived', metricValue: 80 },
      { player_id: 'p-archived', player_display_name: 'Archived', metricValue: 18 },
      { player_id: 'alumni-1', player_display_name: 'Alumni', metricValue: 90 },
      { player_id: 'other', player_display_name: 'Other Team', metricValue: 101, team_id: 'another-team' },
    ],
  });

  assert.deepEqual(selected.map((row) => [row.player_id, row.metricValue, row.rank]), [
    ['alumni-1', 90, 1],
    ['p-archived', 80, 2],
  ]);
});

test('selector provides a safe display name when an active roster record has no name', () => {
  const selected = selectLeaderboardRows({
    teamId: TEAM_ID,
    players: [{ id: 'p-unnamed', playerId: 'p-unnamed', email: 'unnamed@example.com', role: 'player', teamId: TEAM_ID }],
    rows: [{ player_id: 'p-unnamed', total_home_shots: 4 }],
  });

  assert.equal(selected.length, 1);
  assert.equal(selected[0].player_display_name, 'Player');
});

test('state selector distinguishes loading, empty, recovery states, and safe stale data', () => {
  const rows = [{ player_id: 'p-ava', total_home_shots: 24 }];
  assert.equal(resolveLeaderboardDataState({ status: 'loading', rows: [], teamId: TEAM_ID }).kind, 'loading');
  assert.equal(resolveLeaderboardDataState({ status: 'refreshing', rows, teamId: TEAM_ID }).kind, 'refreshing');
  assert.equal(resolveLeaderboardDataState({ status: 'success', rows: [], teamId: TEAM_ID }).kind, 'empty');
  assert.equal(resolveLeaderboardDataState({ status: 'permission', rows: [], teamId: TEAM_ID }).kind, 'permission');
  assert.equal(resolveLeaderboardDataState({ status: 'unavailable', rows: [], teamId: TEAM_ID }).kind, 'unavailable');
  assert.equal(resolveLeaderboardDataState({ status: 'error', rows, teamId: TEAM_ID }).kind, 'stale');
  assert.equal(resolveLeaderboardDataState({ status: 'success', rows, teamId: '' }).kind, 'missing_context');
});

test('decision surface reports player rank, gap, and current-week makes without inline ranking work', () => {
  const rows = [
    { player_id: 'p-ava', player_display_name: 'Ava Longname', total_home_shots: 31 },
    { player_id: 'p-bryn', player_display_name: 'Bryn', total_home_shots: 26 },
  ];
  const player = buildLeaderboardDecisionSurface({
    rows,
    players: activePlayers,
    teamId: TEAM_ID,
    userEmail: 'bryn@example.com',
    shotLogs: [
      { team_id: TEAM_ID, email: 'bryn@example.com', made: 4, date: '2026-09-19' },
      { team_id: TEAM_ID, email: 'bryn@example.com', made: 3, date: '2026-09-21' },
      { team_id: TEAM_ID, email: 'bryn@example.com', made: 99, date: '2026-09-01' },
    ],
    now: new Date('2026-09-21T12:00:00Z'),
  });
  const coach = buildLeaderboardDecisionSurface({ rows, players: activePlayers, teamId: TEAM_ID, viewerRole: 'coach', now: new Date('2026-09-21T12:00:00Z') });

  assert.deepEqual(player.metrics, [
    { label: 'Your rank', value: '#2', detail: '26 recorded' },
    { label: 'Gap to next', value: 5, detail: 'Makes or points needed' },
    { label: 'This week', value: 7, detail: 'Home-shot makes' },
  ]);
  assert.deepEqual(coach.metrics.slice(0, 2), [
    { label: 'Leader', value: 31, detail: 'Ava Longname' },
    { label: 'Lead margin', value: 5, detail: 'Over second place' },
  ]);
});
