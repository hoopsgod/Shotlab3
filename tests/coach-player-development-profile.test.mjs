import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCoachPlayerDevelopmentProfile, getCoachRosterPlayers } from '../src/lib/playerDataManagement.js';
import { buildAtHomeLeaderboardRows } from '../src/lib/homeLeaderboardRows.js';

const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const teamId = 'team-dev';
const programDrills = [{ id: 'form', name: 'Form Shooting' }, { id: 'arc', name: 'Arc 3s' }];

test('coach can open player detail for a registered player from normalized roster', () => {
  const [player] = getCoachRosterPlayers({ teamId, players: [{ id: 'p1', userId: 'u1', email: 'reg@test.com', name: 'Registered Player', role: 'player', teamId }], playerProfiles: [] });
  assert.equal(player.name, 'Registered Player');
  assert.match(source, /onClick=\{\(\)=>setSelP\(p\)\}/);
  assert.match(source, /data-testid="coach-player-development-profile"/);
});

test('coach can open player detail for a manual profile-only player', () => {
  const [player] = getCoachRosterPlayers({ teamId, players: [], playerProfiles: [{ id: 'profile-1', teamId, firstName: 'Manual', lastName: 'Only', jerseyNumber: '12' }] });
  const profile = buildCoachPlayerDevelopmentProfile({ player, teamId });
  assert.equal(player.source, 'profile');
  assert.equal(profile.identity.name, 'Manual Only');
});

test('Program drill attempts are counted correctly by drill and best score is shown', () => {
  const profile = buildCoachPlayerDevelopmentProfile({
    teamId,
    player: { email: 'reg@test.com', playerId: 'p1', name: 'Registered Player' },
    programDrills,
    programScores: [
      { teamId, email: 'reg@test.com', playerId: 'p1', drillId: 'form', drillName: 'Form Shooting', score: 7, date: '2026-06-01' },
      { teamId, email: 'reg@test.com', playerId: 'p1', drillId: 'form', drillName: 'Form Shooting', score: 11, date: '2026-06-02' },
      { teamId, email: 'reg@test.com', playerId: 'p1', drillId: 'arc', drillName: 'Arc 3s', score: 5, date: '2026-06-03' },
    ],
  });
  assert.equal(profile.totalProgramAttempts, 3);
  assert.deepEqual(profile.programByDrill.map((row) => [row.name, row.attempts, row.bestScore]), [['Form Shooting', 2, 11], ['Arc 3s', 1, 5]]);
  assert.equal(profile.programByDrill[0].recentScores[0].score, 11);
});

test('At Home leaderboard total matches Coach Player Development Profile At Home Makes', () => {
  const player = { email: 'reg@test.com', playerId: 'p1', userId: 'u1', profileId: 'profile-1', name: 'Registered Player' };
  const scores = [
    { teamId, email: 'reg@test.com', playerId: 'p1', score: 8, src: 'home' },
    { teamId, player_id: 'p1', score: 7 },
    { teamId, email: 'reg@test.com', playerId: 'p1', score: 99, src: 'program', drillId: 'form' },
  ];
  const shotLogs = [
    { teamId, email: 'reg@test.com', playerId: 'p1', made: 20 },
    { teamId, player_id: 'p1', score: 6 },
    { teamId, userId: 'u1', total_home_shots: 5 },
    { teamId, email: 'reg@test.com', playerId: 'p1', made: 88, src: 'program', drillId: 'form' },
  ];
  const leaderboardRow = buildAtHomeLeaderboardRows({ scores, shotLogs, programDrills, players: [player], profiles: [player] }).find((row) => row.email === 'reg@test.com');
  const profile = buildCoachPlayerDevelopmentProfile({ teamId, player, programDrills, scores, shotLogs, programScores: [{ teamId, email: 'reg@test.com', playerId: 'p1', drillId: 'form', score: 30 }] });
  assert.equal(leaderboardRow.total_home_shots, 46);
  assert.equal(profile.totalAtHomeMakes, leaderboardRow.total_home_shots);
  assert.equal(profile.totalProgramAttempts, 1);
});

test('inactive players receive Needs Follow-Up or No Recent Activity state', () => {
  assert.equal(buildCoachPlayerDevelopmentProfile({ teamId, player: { email: 'none@test.com' }, today: '2026-06-30' }).statusLabel, 'No Recent Activity');
  assert.equal(buildCoachPlayerDevelopmentProfile({ teamId, player: { email: 'old@test.com' }, shotLogs: [{ teamId, email: 'old@test.com', made: 1, date: '2026-06-15' }], today: '2026-06-30' }).statusLabel, 'Needs Follow-Up');
});

test('archived/removed/deleted players do not show in active player detail lists', () => {
  const roster = getCoachRosterPlayers({ teamId, players: [
    { email: 'active@test.com', name: 'Active', role: 'player', teamId },
    { email: 'archived@test.com', name: 'Archived', role: 'player', teamId, rosterStatus: 'archived' },
    { email: 'removed@test.com', name: 'Removed', role: 'player', teamId, rosterStatus: 'removed' },
    { email: 'deleted@test.com', name: 'Deleted', role: 'player', teamId, rosterStatus: 'team_local_data_deleted' },
  ], playerProfiles: [] });
  assert.deepEqual(roster.map((row) => row.email), ['active@test.com']);
});
