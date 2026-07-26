import test from 'node:test';
import assert from 'node:assert/strict';

import { deriveActivityFeedItems } from '../src/lib/activityFeed.js';
import {
  buildCoachPlayerDevelopmentProfile,
  filterActiveTeamLeaderboardRows,
  filterActiveTeamPlayerRows,
  getActiveTeamPlayerIdentity,
  getCoachRosterPlayers,
  resolveMigratedRosterTeamId,
} from '../src/lib/playerDataManagement.js';
import { getProgramLeaderboardRows } from '../src/lib/programDrillScoring.js';

const teamId = 'team-a';
const coach = { email: 'coach@team.test', role: 'coach', teamId };

const activePlayer = { email: 'active@team.test', playerId: 'player-active', name: 'Active Player', role: 'player', teamId };
const activeProfile = { id: 'profile-active', userId: 'active@team.test', teamId, firstName: 'Active', lastName: 'Player' };
const removedProfile = { id: 'profile-removed', userId: 'removed@team.test', teamId, firstName: 'Removed', lastName: 'Player' };

const buildRosterForInactiveStatus = (status, extra = {}) => getCoachRosterPlayers({
  teamId,
  players: [
    activePlayer,
    {
      email: 'removed@team.test',
      playerId: 'player-removed',
      name: 'Removed Player',
      role: 'player',
      teamId: null,
      removedFromTeamId: teamId,
      rosterStatus: status,
      hideFromLeaderboards: true,
      ...extra,
    },
  ],
  playerProfiles: [activeProfile, removedProfile],
});

test('inactive player rows suppress matching profile rows from coach roster', () => {
  const statuses = [
    ['removed', {}],
    ['team_local_data_deleted', { teamLocalDataDeleted: true }],
    ['deleted', { deleted: true }],
    ['archived', { archived: true, teamId }],
  ];

  statuses.forEach(([status, extra]) => {
    const roster = buildRosterForInactiveStatus(status, extra);
    assert.deepEqual(roster.map((player) => player.email), ['active@team.test'], `${status} player profile should not rehydrate roster`);
  });
});

test('removed player is excluded from all team-facing surfaces while active player remains visible', () => {
  const roster = buildRosterForInactiveStatus('removed');
  const activeIdentity = getActiveTeamPlayerIdentity(roster, teamId);

  const leaderboardRows = filterActiveTeamLeaderboardRows([
    { id: 'removed-leaderboard', teamId, email: 'removed@team.test', playerId: 'player-removed', player_display_name: 'Removed Player', total_home_shots: 999 },
    { id: 'active-leaderboard', teamId, email: 'active@team.test', playerId: 'player-active', player_display_name: 'Active Player', total_home_shots: 25 },
  ], activeIdentity.keySet, activeIdentity.emailSet, activeIdentity.nameSet);

  const eventRsvps = filterActiveTeamPlayerRows([
    { id: 'removed-rsvp', teamId, eventId: 'event-1', email: 'removed@team.test' },
    { id: 'active-rsvp', teamId, eventId: 'event-1', email: 'active@team.test' },
  ], activeIdentity.emailSet, activeIdentity.keySet);

  const scRsvps = filterActiveTeamPlayerRows([
    { id: 'removed-sc-rsvp', teamId, sessionId: 'sc-1', email: 'removed@team.test' },
    { id: 'active-sc-rsvp', teamId, sessionId: 'sc-1', email: 'active@team.test' },
  ], activeIdentity.emailSet, activeIdentity.keySet);

  const programRows = getProgramLeaderboardRows([
    { id: 'removed-program', teamId, drillId: 'form', email: 'removed@team.test', playerId: 'player-removed', score: 100 },
    { id: 'active-program', teamId, drillId: 'form', email: 'active@team.test', playerId: 'player-active', score: 10 },
  ], { id: 'form', teamId }, roster);

  const feed = deriveActivityFeedItems({
    view: 'coach',
    user: coach,
    events: [{ id: 'event-1', teamId, title: 'Practice', date: '2026-07-04' }],
    rsvps: [
      { teamId, eventId: 'event-1', email: 'removed@team.test', name: 'Removed Player', date: '2026-07-04' },
      { teamId, eventId: 'event-1', email: 'active@team.test', name: 'Active Player', date: '2026-07-04' },
    ],
    shotLogs: [
      { teamId, email: 'removed@team.test', name: 'Removed Player', made: 99, date: '2026-07-04' },
      { teamId, email: 'active@team.test', name: 'Active Player', made: 5, date: '2026-07-04' },
    ],
    scores: [
      { teamId, email: 'removed@team.test', name: 'Removed Player', score: 99, date: '2026-07-04' },
      { teamId, email: 'active@team.test', name: 'Active Player', score: 5, date: '2026-07-04' },
    ],
    players: roster,
    today: '2026-07-04',
    activeTeamPlayerEmails: activeIdentity.emailSet,
    activeTeamPlayerKeys: activeIdentity.keySet,
  });

  const developmentProfiles = roster.map((player) => buildCoachPlayerDevelopmentProfile({
    player,
    teamId,
    today: '2026-07-04',
    scores: [{ teamId, email: 'active@team.test', score: 10, date: '2026-07-04' }],
    programScores: [{ teamId, drillId: 'form', email: 'active@team.test', score: 10, date: '2026-07-04' }],
    rsvps: [{ teamId, email: 'active@team.test', eventId: 'event-1', date: '2026-07-04' }],
    scRsvps: [{ teamId, email: 'active@team.test', sessionId: 'sc-1', date: '2026-07-04' }],
  }));

  assert.deepEqual(roster.map((player) => player.email), ['active@team.test']);
  assert.deepEqual(leaderboardRows.map((row) => row.id), ['active-leaderboard']);
  assert.deepEqual(eventRsvps.map((row) => row.id), ['active-rsvp']);
  assert.deepEqual(scRsvps.map((row) => row.id), ['active-sc-rsvp']);
  assert.deepEqual(programRows.map((row) => row.email), ['active@team.test']);
  assert.match(feed.map((item) => item.text).join(' | '), /Active Player/);
  assert.doesNotMatch(feed.map((item) => item.text).join(' | '), /Removed Player/);
  assert.deepEqual(developmentProfiles.map((profile) => profile.identity.email), ['active@team.test']);
});


test('hidden unassigned account row suppresses a stale team profile after hydration', () => {
  const roster = getCoachRosterPlayers({
    teamId,
    players: [
      activePlayer,
      {
        id: 'player-removed',
        email: 'removed@team.test',
        name: 'Removed Player',
        role: 'player',
        teamId: null,
        hideFromLeaderboards: true,
      },
    ],
    playerProfiles: [activeProfile, removedProfile],
  });

  assert.deepEqual(roster.map((player) => player.email), ['active@team.test']);
});


test("migration preserves removed tombstone null team ids instead of reassigning the first team", () => {
  assert.equal(resolveMigratedRosterTeamId({
    row: { email: "removed@team.test", teamId: null, hideFromLeaderboards: true, rosterStatus: "removed" },
    mappedTeamId: "team-a",
    fallbackTeamId: "team-fallback",
  }), null);
  assert.equal(resolveMigratedRosterTeamId({
    row: { email: "unassigned@team.test", role: "player" },
    mappedTeamId: "team-a",
    fallbackTeamId: "team-fallback",
  }), "team-a");
});
