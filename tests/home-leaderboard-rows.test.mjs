import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAtHomeLeaderboardRows, isHomeLeaderboardScoreRow } from '../src/lib/homeLeaderboardRows.js';
import { getProgramLeaderboardRows } from '../src/lib/programDrillScoring.js';

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
