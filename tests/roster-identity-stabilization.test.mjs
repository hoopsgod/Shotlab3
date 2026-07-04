import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveActivityFeedItems } from '../src/lib/activityFeed.js';
import { filterActiveTeamLeaderboardRows, filterActiveTeamPlayerRows, getActiveTeamPlayerIdentity } from '../src/lib/playerDataManagement.js';
import { getProgramLeaderboardRows } from '../src/lib/programDrillScoring.js';

const teamId = 'team-a';
const activeRoster = [
  { teamId, email: 'active@team.test', playerId: 'player-active', userId: 'user-active', profileId: 'profile-active', name: 'Active Player', role: 'player' },
  { teamId, email: 'registered@team.test', player_id: 'player-registered', user_id: 'user-registered', name: 'Registered Player', role: 'player', joinedViaCoachCode: true },
  { teamId, email: 'deleted@team.test', playerId: 'player-deleted', name: 'Deleted Player', role: 'player', rosterStatus: 'deleted' },
  { teamId, email: 'removed@team.test', playerId: 'player-removed', name: 'Removed Player', role: 'player', rosterStatus: 'removed' },
  { teamId, email: 'archived@team.test', playerId: 'player-archived', name: 'Archived Player', role: 'player', archived: true },
  { teamId, email: 'hidden@team.test', playerId: 'player-hidden', name: 'Hidden Player', role: 'player', hidden: true },
  { teamId, email: 'local-deleted@team.test', playerId: 'player-local-deleted', name: 'Local Deleted Player', role: 'player', rosterStatus: 'team_local_data_deleted' },
];

const identity = () => getActiveTeamPlayerIdentity(activeRoster, teamId);

test('non-roster and deleted players never appear on coach/player leaderboards', () => {
  const active = identity();
  const homeRows = filterActiveTeamLeaderboardRows([
    { teamId, email: 'active@team.test', total_home_shots: 25, player_display_name: 'Active Player' },
    { teamId, email: 'outsider@team.test', total_home_shots: 999, player_display_name: 'Outsider' },
    { teamId, email: 'deleted@team.test', total_home_shots: 888, player_display_name: 'Deleted Player' },
    { teamId: 'team-b', email: 'active@team.test', total_home_shots: 777, player_display_name: 'Cross Team Active' },
  ], active.keySet, active.emailSet, active.nameSet);
  assert.deepEqual(homeRows.map((row) => row.email), ['active@team.test']);

  const programRows = getProgramLeaderboardRows([
    { teamId, drillId: 'form', email: 'active@team.test', playerId: 'player-active', score: 10 },
    { teamId, drillId: 'form', email: 'outsider@team.test', playerId: 'player-outsider', score: 99 },
    { teamId, drillId: 'form', email: 'removed@team.test', playerId: 'player-removed', score: 98 },
  ], { id: 'form', teamId }, activeRoster);
  assert.deepEqual(programRows.map((row) => row.email), ['active@team.test']);
});

test('non-roster players never appear in the activity feed', () => {
  const active = identity();
  const items = deriveActivityFeedItems({
    view: 'coach',
    user: { email: 'coach@team.test', teamId, role: 'coach' },
    events: [{ id: 'event-1', teamId, title: 'Practice', date: '2026-07-03' }],
    rsvps: [
      { teamId, eventId: 'event-1', email: 'active@team.test', name: 'Active Player', date: '2026-07-03' },
      { teamId, eventId: 'event-1', email: 'outsider@team.test', name: 'Outsider', date: '2026-07-03' },
      { teamId, eventId: 'event-1', email: 'deleted@team.test', name: 'Deleted Player', date: '2026-07-03' },
    ],
    shotLogs: [
      { teamId, email: 'active@team.test', name: 'Active Player', made: 5, date: '2026-07-03' },
      { teamId, email: 'outsider@team.test', name: 'Outsider', made: 99, date: '2026-07-03' },
    ],
    players: activeRoster,
    scores: [],
    today: '2026-07-03',
    activeTeamPlayerEmails: active.emailSet,
    activeTeamPlayerKeys: active.keySet,
  });
  const feedText = items.map((item) => item.text).join(' | ');
  assert.match(feedText, /Active Player/);
  assert.doesNotMatch(feedText, /Outsider|Deleted Player/);
});

test('non-roster players never appear in RSVP and S&C views', () => {
  const active = identity();
  const rsvpRows = filterActiveTeamPlayerRows([
    { teamId, email: 'active@team.test', eventId: 'event-1' },
    { teamId, email: 'outsider@team.test', eventId: 'event-1' },
    { teamId, email: 'hidden@team.test', eventId: 'event-1' },
  ], active.emailSet, active.keySet);
  const scRows = filterActiveTeamPlayerRows([
    { teamId, player_id: 'player-active', sessionId: 'sc-1' },
    { teamId, player_id: 'player-outsider', sessionId: 'sc-1' },
    { teamId, player_id: 'player-local-deleted', sessionId: 'sc-1' },
  ], active.emailSet, active.keySet);
  assert.deepEqual(rsvpRows.map((row) => row.email), ['active@team.test']);
  assert.deepEqual(scRows.map((row) => row.player_id), ['player-active']);
});

test('active roster players appear correctly after registration under coach code', () => {
  const active = identity();
  const rows = filterActiveTeamPlayerRows([
    { teamId, user_id: 'user-registered', email: 'registered@team.test', eventId: 'event-2' },
  ], active.emailSet, active.keySet);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, 'registered@team.test');
});

test('deleted and removed players are excluded everywhere by shared roster identity', () => {
  const active = identity();
  assert.deepEqual([...active.emailSet].sort(), ['active@team.test', 'registered@team.test']);
  const rows = filterActiveTeamPlayerRows([
    { teamId, email: 'deleted@team.test' },
    { teamId, email: 'removed@team.test' },
    { teamId, email: 'archived@team.test' },
    { teamId, email: 'local-deleted@team.test' },
    { teamId, email: 'active@team.test' },
  ], active.emailSet, active.keySet);
  assert.deepEqual(rows.map((row) => row.email), ['active@team.test']);
});
