import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  buildRemoteRows,
  normalizeScoreRowForDb,
  normalizeShotLogRowForDb,
  normalizeEventRowForDb,
  normalizeEventRowForApp,
  buildAppRows,
  mergeHydratedRows,
} from '../src/lib/remotePersistence.js';

test('score rows normalize to db-compatible snake_case fields', () => {
  const row = normalizeScoreRowForDb({
    id: 'score-1',
    email: 'Player@One.com',
    name: 'Player One',
    playerId: 'player-1',
    teamId: 'team-1',
    drillId: 'drill-7',
    score: '73',
    date: '2026-04-27',
    ts: 123,
    hideFromLeaderboards: true,
  });

  assert.deepEqual(row, {
    id: 'score-1',
    email: 'player@one.com',
    name: 'Player One',
    player_id: 'player-1',
    team_id: 'team-1',
    drill_id: 'drill-7',
    score: 73,
    date: '2026-04-27',
    ts: 123,
    src: 'home',
  });
  assert.equal(Object.hasOwn(row, 'playerId'), false);
  assert.equal(Object.hasOwn(row, 'teamId'), false);
  assert.equal(Object.hasOwn(row, 'drillId'), false);
});

test('shot log rows normalize to db-compatible snake_case fields', () => {
  const row = normalizeShotLogRowForDb({
    id: 'shot-1',
    email: 'player@one.com',
    name: 'Player One',
    playerId: 'player-1',
    teamId: 'team-1',
    made: '137',
    date: '2026-04-27',
    ts: 456,
    hideFromLeaderboards: false,
  });

  assert.deepEqual(row, {
    id: 'shot-1',
    email: 'player@one.com',
    name: 'Player One',
    player_id: 'player-1',
    team_id: 'team-1',
    made: 137,
    date: '2026-04-27',
    ts: 456,
    hide_from_leaderboards: false,
  });
  assert.equal(Object.hasOwn(row, 'playerId'), false);
  assert.equal(Object.hasOwn(row, 'teamId'), false);
});

test('player score save shape includes consistent identity fields', () => {
  const [row] = buildRemoteRows('sl:scores', [{
    id: 'score-2',
    email: 'player@one.com',
    playerId: 'player@one.com',
    teamId: 'team-2',
    score: 73,
    drillId: 'drill-2',
  }]);

  assert.equal(row.team_id, 'team-2');
  assert.equal(row.player_id, 'player@one.com');
  assert.equal(row.email, 'player@one.com');
});

test('player home shots save shape includes consistent identity fields', () => {
  const [row] = buildRemoteRows('sl:shotlogs', [{
    id: 'shot-2',
    email: 'player@one.com',
    playerId: 'player@one.com',
    teamId: 'team-2',
    made: 137,
  }]);

  assert.equal(row.team_id, 'team-2');
  assert.equal(row.player_id, 'player@one.com');
  assert.equal(row.email, 'player@one.com');
});

test('buildRemoteRows strips unsupported camelCase fields before upsert payload', () => {
  const [scoreRow] = buildRemoteRows('sl:scores', [{
    id: 'score-3',
    email: 'player@one.com',
    playerId: 'player-3',
    teamId: 'team-3',
    drillId: 'drill-3',
    score: 88,
    extraField: 'drop-me',
  }]);

  assert.equal(Object.hasOwn(scoreRow, 'extraField'), false);
  assert.equal(Object.hasOwn(scoreRow, 'teamId'), false);
  assert.equal(Object.hasOwn(scoreRow, 'playerId'), false);
});

test('coach/team read path remains team-scoped for saved rows', () => {
  const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /const scopedScores=scores\.filter\(s=>s\.teamId===user\?\.teamId\)/);
  assert.match(source, /const scopedShotLogs=shotLogs\.filter\(l=>l\.teamId===user\?\.teamId\);/);
});

test('wrong-team rows are excluded from coach team views', () => {
  const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /const scopedScores=scores;/);
  assert.doesNotMatch(source, /const scopedShotLogs=shotLogs;/);
});


test('event write normalization maps camelCase keys to snake_case keys', () => {
  const row = normalizeEventRowForDb({
    id: 'event-1',
    title: 'Morning Run',
    teamId: 'team-1',
    ownerCoachId: 'coach@team.com',
  });

  assert.equal(row.team_id, 'team-1');
  assert.equal(row.owner_coach_id, 'coach@team.com');
  assert.equal(Object.hasOwn(row, 'teamId'), false);
  assert.equal(Object.hasOwn(row, 'ownerCoachId'), false);
});

test('event read normalization maps snake_case keys to camelCase keys', () => {
  const row = normalizeEventRowForApp({
    id: 'event-2',
    title: 'Lift',
    team_id: 'team-2',
    owner_coach_id: 'coach2@team.com',
  });

  assert.equal(row.teamId, 'team-2');
  assert.equal(row.ownerCoachId, 'coach2@team.com');
  assert.equal(Object.hasOwn(row, 'team_id'), false);
  assert.equal(Object.hasOwn(row, 'owner_coach_id'), false);
});

test('existing local camelCase event rows still normalize for app reads', () => {
  const [row] = buildAppRows('sl:events', [{
    id: 'event-3',
    title: 'Practice',
    teamId: 'team-3',
    ownerCoachId: 'coach3@team.com',
  }]);

  assert.equal(row.teamId, 'team-3');
  assert.equal(row.ownerCoachId, 'coach3@team.com');
});

test('event/rsvp ids remain compatible through normalization', () => {
  const [eventRow] = buildRemoteRows('sl:events', [{
    id: 'event-4',
    title: 'Weights',
    teamId: 'team-4',
    ownerCoachId: 'coach4@team.com',
  }]);
  const [rsvpRow] = buildRemoteRows('sl:rsvps', [{
    id: 'rsvp-4',
    eventId: 'event-4',
    teamId: 'team-4',
    playerId: 'p4@team.com',
    email: 'p4@team.com',
  }]);

  assert.equal(eventRow.id, 'event-4');
  assert.equal(rsvpRow.event_id, eventRow.id);
});

test('coach-created profile shell with null userId is preserved for remote payload using email/team fallback id', () => {
  const [row] = buildRemoteRows('sl:player-profiles', [{
    userId: null,
    email: 'Shell@Example.com',
    teamId: 'team-shell',
    firstName: 'Shell',
    lastName: 'Player',
  }]);

  assert.equal(row.id, 'pp-shell:team-shell:shell@example.com');
  assert.equal(row.team_id, 'team-shell');
  assert.equal(row.email, 'shell@example.com');
  assert.equal(Object.hasOwn(row, 'user_id'), false);
});

test('profile shell hydrates for app reads with teamId and email while userId stays null', () => {
  const [row] = buildAppRows('sl:player-profiles', [{
    team_id: 'team-shell',
    email: 'Shell@Example.com',
    user_id: null,
    first_name: 'Shell',
  }]);

  assert.equal(row.teamId, 'team-shell');
  assert.equal(row.email, 'shell@example.com');
  assert.equal(Object.hasOwn(row, 'userId'), false);
});

test('claimed profile with userId continues to normalize for remote payloads', () => {
  const [row] = buildRemoteRows('sl:player-profiles', [{
    id: 'pp-claimed-1',
    userId: 'claimed@example.com',
    teamId: 'team-claimed',
    firstName: 'Claimed',
  }]);

  assert.equal(row.id, 'pp-claimed-1');
  assert.equal(row.user_id, 'claimed@example.com');
  assert.equal(row.team_id, 'team-claimed');
});

test('mergeHydratedRows for player profiles prefers remote rows on exact id conflict', () => {
  const merged = mergeHydratedRows('sl:player-profiles', [
    { id: 'pp-1', teamId: 'team-1', email: 'local@example.com', firstName: 'Local' },
  ], [
    { id: 'pp-1', teamId: 'team-1', email: 'remote@example.com', firstName: 'Remote' },
  ]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].firstName, 'Remote');
  assert.equal(merged[0].email, 'remote@example.com');
});
