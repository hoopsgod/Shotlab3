import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAtHomeLeaderboardRows, isHomeLeaderboardScoreRow } from '../src/lib/homeLeaderboardRows.js';
import { getProgramLeaderboardRows } from '../src/lib/programDrillScoring.js';
import { filterActiveTeamLeaderboardRows, filterActiveTeamPlayerRows, getActiveTeamPlayerIdentity } from '../src/lib/playerDataManagement.js';

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



test('Player View At Home leaderboard excludes non-roster players and keeps active roster matches', () => {
  const activeRoster = [{ email: 'active@team.test', name: 'Active Player', teamId: 'team-a', playerId: 'active-player', profileId: 'active-profile' }];
  const identity = getActiveTeamPlayerIdentity(activeRoster, 'team-a');
  const rawRows = buildAtHomeLeaderboardRows({
    scores: [
      { email: 'active@team.test', playerId: 'active-player', score: 12, src: 'home' },
      { email: 'lori@team.test', score: 99, src: 'home' },
      { email: 'active@team.test', score: 100, src: 'program', drillId: 'program-drill-a' },
    ],
    shotLogs: [
      { email: 'active@team.test', profileId: 'active-profile', total_home_shots: 4 },
      { email: 'grayson@team.test', total_home_shots: 30 },
    ],
    programDrills,
    players: activeRoster,
  });
  const rows = filterActiveTeamLeaderboardRows(rawRows, identity.keySet, identity.emailSet, identity.nameSet);

  assert.deepEqual(rows.map((row) => [row.email, row.total_home_shots]), [['active@team.test', 16]]);
});

test('Player View Program Drills leaderboard excludes non-roster players and At Home rows', () => {
  const activeRoster = [{ email: 'active@team.test', name: 'Active Player', teamId: 'team-a', userId: 'active-user' }];
  const identity = getActiveTeamPlayerIdentity(activeRoster, 'team-a');
  const programRows = [
    { email: 'active@team.test', userId: 'active-user', drillId: 'program-drill-a', teamId: 'team-a', src: 'program', score: 18 },
    { email: 'active@team.test', userId: 'active-user', drillId: 'program-drill-a', teamId: 'team-a', src: 'program', score: 22 },
    { email: 'lori@team.test', drillId: 'program-drill-a', teamId: 'team-a', src: 'program', score: 99 },
    { email: 'active@team.test', drillId: 'home-drill', teamId: 'team-a', src: 'home', score: 100 },
  ];
  const rows = getProgramLeaderboardRows(filterActiveTeamPlayerRows(programRows, identity.emailSet, identity.keySet), programDrills[0], activeRoster);

  assert.deepEqual(rows.map((row) => [row.email, row.score, row.attempts]), [['active@team.test', 22, 2]]);
});
