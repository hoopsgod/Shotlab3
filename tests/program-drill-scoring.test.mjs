import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildProgramDrillLeaderboardRows, buildProgramScoreRow, validateProgramDrillScore } from '../src/lib/programDrillScoring.js';
import { normalizeScoreRowForDb } from '../src/lib/remotePersistence.js';

const players = [
  { email: 'active@team.test', id: 'player:team_active', player_id: 'player:team_active', teamId: 'team-a', role: 'player', name: 'Active Player' },
  { email: 'other@team.test', id: 'player:team_other', player_id: 'player:team_other', teamId: 'team-a', role: 'player', name: 'Other Player' },
  { email: 'archived@team.test', id: 'player:team_archived', player_id: 'player:team_archived', teamId: 'team-a', role: 'player', name: 'Archived Player', archived: true, hideFromLeaderboards: true },
];

test('player can type a numeric score into a Program Log drill score input and save is disabled only when invalid', () => {
  const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /type="number" inputMode="decimal" pattern="\[0-9\]\*"/);
  assert.match(source, /disabled=\{submitting\|\|activeScoreInvalid\}/);
  assert.equal(validateProgramDrillScore('', { id: 'drill-a' }).ok, false);
  assert.equal(validateProgramDrillScore('12', { id: 'drill-a' }).ok, true);
  assert.equal(validateProgramDrillScore('0', { id: 'drill-a' }).ok, false);
  assert.equal(validateProgramDrillScore('0', { id: 'drill-a', allowZeroScore: true }).ok, true);
});

test('saving creates a normalized program score row with roster player_id and stable drill identity', () => {
  const appRow = buildProgramScoreRow({
    drill: { id: 'demo-program-warm-up-shooting-4-minute', name: '4 MINUTE WARM UP SHOOTING' },
    score: 17,
    user: { email: 'active@team.test', teamId: 'team-a', name: 'Active Player' },
    players,
    id: 'score-fixed',
    now: 123456,
    date: '2026-06-16',
  });
  assert.equal(appRow.player_id, 'player:team_active');
  assert.notEqual(appRow.player_id, 'active@team.test');
  const dbRow = normalizeScoreRowForDb(appRow);
  assert.deepEqual({
    id: dbRow.id,
    email: dbRow.email,
    player_id: dbRow.player_id,
    team_id: dbRow.team_id,
    score: dbRow.score,
    date: dbRow.date,
    ts: dbRow.ts,
    src: dbRow.src,
  }, {
    id: 'score-fixed',
    email: 'active@team.test',
    player_id: 'player:team_active',
    team_id: 'team-a',
    score: 17,
    date: '2026-06-16',
    ts: 123456,
    src: 'program',
  });
});

test('program drill leaderboard is drill-specific, filters inactive players, and ranks without gaps', () => {
  const warmup = { id: 'demo-program-warm-up-shooting-4-minute', name: '4 MINUTE WARM UP SHOOTING' };
  const calipari = { id: 'demo-program-calipari-shooting', name: 'CALIPARI SHOOTING' };
  const scores = [
    { src: 'program', drillId: warmup.id, email: 'active@team.test', player_id: 'player:team_active', name: 'Active Player', score: 4 },
    { src: 'program', drillId: warmup.id, email: 'other@team.test', player_id: 'player:team_other', name: 'Other Player', score: 9 },
    { src: 'program', drillId: calipari.id, email: 'active@team.test', player_id: 'player:team_active', name: 'Active Player', score: 99 },
    { src: 'program', drillId: warmup.id, email: 'archived@team.test', player_id: 'player:team_archived', name: 'Archived Player', score: 1000 },
  ];
  const warmupRows = buildProgramDrillLeaderboardRows({ scores, drill: warmup, players });
  assert.deepEqual(warmupRows.map((r) => [r.rank, r.player_id, r.total]), [[1, 'player:team_other', 9], [2, 'player:team_active', 4]]);
  assert.equal(warmupRows.some((r) => r.total === 99 || r.email === 'archived@team.test'), false);
  const calipariRows = buildProgramDrillLeaderboardRows({ scores, drill: calipari, players });
  assert.deepEqual(calipariRows.map((r) => [r.rank, r.player_id, r.total]), [[1, 'player:team_active', 99]]);
});

test('program score DB normalization strips app-only fields and invalid string drill_id', () => {
  const appRow = buildProgramScoreRow({
    drill: { id: 'demo-program-calipari-shooting', name: 'CALIPARI SHOOTING' },
    score: 22,
    user: { email: 'active@team.test', teamId: 'team-a', name: 'Active Player' },
    players,
    id: 'score-program-safe',
    now: 987,
    date: '2026-06-17',
  });
  const dbRow = normalizeScoreRowForDb({ ...appRow, drillName: 'CALIPARI SHOOTING', hideFromLeaderboards: true });
  assert.deepEqual(Object.keys(dbRow).sort(), ['date', 'email', 'id', 'name', 'player_id', 'score', 'src', 'team_id', 'ts'].sort());
  assert.equal(Object.hasOwn(dbRow, 'drill_id'), false);
  assert.equal(Object.hasOwn(dbRow, 'drillId'), false);
  assert.equal(Object.hasOwn(dbRow, 'drillName'), false);
});

test('program drill completion waits for successful save result', () => {
  const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /const handleLog=async\(\)=>/);
  assert.match(source, /const saveResult=await addScore\(active\.id,v,activeMode\);/);
  assert.match(source, /if\(!saveResult\?\.ok\)\{setSubmitting\(false\);return;\}/);
  assert.match(source, /setSaved\(true\)/);
});
