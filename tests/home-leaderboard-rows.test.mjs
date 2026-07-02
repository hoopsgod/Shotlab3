import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAtHomeLeaderboardRows, isHomeLeaderboardScoreRow } from '../src/lib/homeLeaderboardRows.js';
import { getProgramLeaderboardRows } from '../src/lib/programDrillScoring.js';
import { filterActiveTeamLeaderboardRows, getActiveTeamPlayerIdentity } from '../src/lib/playerDataManagement.js';

const programDrills = [{ id: 'program-drill-a', name: 'Program Drill A' }];
const players = [{ email: 'active@team.test', name: 'Active Player', id: 'player-1', teamId: 'team-a' }];

test('At Home leaderboard includes legacy missing-src and explicit home rows while excluding Program rows', () => {
  const rows = buildAtHomeLeaderboardRows({
    programDrills,
    scores: [
      { email: 'active@team.test', name: 'Active Player', drillId: 'home-drill-legacy', score: 10 },
      { email: 'active@team.test', name: 'Active Player', drillId: 'home-drill-explicit', src: 'home', score: 15 },
      { email: 'active@team.test', name: 'Active Player', drillId: 'program-drill-a', src: 'program', score: 25 },
      { email: 'active@team.test', name: 'Active Player', drillId: 'program-drill-a', score: 30 },
    ],
    shotLogs: [{ email: 'active@team.test', name: 'Active Player', made: 5 }],
  });

  assert.equal(isHomeLeaderboardScoreRow({ drillId: 'home-drill-legacy' }, programDrills), true);
  assert.equal(isHomeLeaderboardScoreRow({ src: 'home', drillId: 'home-drill-explicit' }, programDrills), true);
  assert.equal(isHomeLeaderboardScoreRow({ src: 'program', drillId: 'program-drill-a' }, programDrills), false);
  assert.equal(isHomeLeaderboardScoreRow({ drillId: 'program-drill-a' }, programDrills), false);
  assert.deepEqual(rows.map((row) => [row.rank, row.name, row.total_home_shots, row.score, row.total]), [[1, 'Active Player', 30, 30, 30]]);
});

test('Program Drill leaderboard remains separate and repeated attempts aggregate by best score', () => {
  const programScores = [
    { email: 'active@team.test', name: 'Active Player', drillId: 'program-drill-a', teamId: 'team-a', src: 'program', score: 20 },
    { email: 'active@team.test', name: 'Active Player', drillId: 'program-drill-a', teamId: 'team-a', src: 'program', score: 25 },
  ];
  const homeRows = buildAtHomeLeaderboardRows({ scores: programScores, programDrills });
  const programRows = getProgramLeaderboardRows(programScores, programDrills[0], players);

  assert.deepEqual(homeRows, []);
  assert.deepEqual(programRows.map((row) => [row.rank, row.name, row.score, row.attempts]), [[1, 'Active Player', 25, 2]]);
});

test('At Home leaderboard resolves player names from roster/profile data when rows only have email', () => {
  const rows = buildAtHomeLeaderboardRows({
    scores: [{ email: 'roster@team.test', score: 12 }],
    players: [{ email: 'roster@team.test', name: 'Roster Name' }],
  });

  assert.deepEqual(rows.map((row) => [row.rank, row.name, row.total_home_shots]), [[1, 'Roster Name', 12]]);
});


test('Player View At Home leaderboard excludes non-roster players and keeps active roster identity matches', () => {
  const roster = [
    { email: 'active@team.test', name: 'Active Email', id: 'active-id', teamId: 'team-a', role: 'player' },
    { email: 'id-match@team.test', name: 'ID Match', playerId: 'player-id-match', teamId: 'team-a', role: 'player' },
    { email: 'archived@team.test', name: 'Archived', id: 'archived-id', teamId: 'team-a', role: 'player', rosterStatus: 'archived' },
  ];
  const identity = getActiveTeamPlayerIdentity(roster, 'team-a');
  const rawRows = buildAtHomeLeaderboardRows({
    scores: [
      { email: 'active@team.test', score: 9, teamId: 'team-a' },
      { playerId: 'player-id-match', email: 'different@team.test', score: 12, src: 'home', teamId: 'team-a' },
      { email: 'nonroster@team.test', score: 99, teamId: 'team-a' },
      { email: 'archived@team.test', score: 44, teamId: 'team-a' },
      { email: 'active@team.test', score: 99, src: 'program', drillId: 'program-drill-a', teamId: 'team-a' },
    ],
    shotLogs: [{ email: 'active@team.test', total_home_shots: 4, teamId: 'team-a' }],
    programDrills,
    players: roster,
  });
  const rows = filterActiveTeamLeaderboardRows(rawRows, identity.keySet, identity.emailSet, identity.nameSet);

  assert.deepEqual(rows.map((row) => [row.email, row.name, row.total_home_shots]), [
    ['active@team.test', 'Active Email', 13],
    ['id-match@team.test', 'ID Match', 12],
  ]);
});

test('Player View Program Drills leaderboard excludes non-roster players and keeps active roster identity matches', () => {
  const roster = [
    { email: 'active@team.test', name: 'Active Email', id: 'active-id', teamId: 'team-a', role: 'player' },
    { email: 'profile@team.test', name: 'Profile Match', profileId: 'profile-match', teamId: 'team-a', role: 'player' },
    { email: 'removed@team.test', name: 'Removed', id: 'removed-id', teamId: 'team-a', role: 'player', rosterStatus: 'removed' },
  ];
  const identity = getActiveTeamPlayerIdentity(roster, 'team-a');
  const rawRows = getProgramLeaderboardRows([
    { email: 'active@team.test', drillId: 'program-drill-a', teamId: 'team-a', src: 'program', score: 18 },
    { profileId: 'profile-match', email: 'other@team.test', drillId: 'program-drill-a', teamId: 'team-a', src: 'program', score: 22 },
    { email: 'nonroster@team.test', drillId: 'program-drill-a', teamId: 'team-a', src: 'program', score: 100 },
    { email: 'removed@team.test', drillId: 'program-drill-a', teamId: 'team-a', src: 'program', score: 80 },
    { email: 'active@team.test', drillId: 'home-drill', teamId: 'team-a', src: 'home', score: 100 },
  ], programDrills[0], roster);
  const rows = filterActiveTeamLeaderboardRows(rawRows, identity.keySet, identity.emailSet, identity.nameSet);

  assert.deepEqual(rows.map((row) => [row.email, row.name, row.score, row.attempts]), [
    ['profile@team.test', 'Profile Match', 22, 1],
    ['active@team.test', 'Active Email', 18, 1],
  ]);
});
