import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  buildRemoteRows,
  normalizeScoreRowForDb,
  normalizeShotLogRowForDb,
  normalizeEventRowForDb,
  normalizeEventRowForApp,
  normalizePlayerRowForDb,
  normalizePlayerProfileRowForDb,
  buildAppRows,
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

test('player rows normalize to db shape with fallback id when id is missing', () => {
  const row = normalizePlayerRowForDb({
    email: 'Player@One.com',
    teamId: 'team-5',
    name: 'Player One',
    mustChangePassword: true,
  });

  assert.equal(row.id, 'player:team-5:player@one.com');
  assert.equal(row.team_id, 'team-5');
  assert.equal(row.email, 'player@one.com');
  assert.equal(row.must_change_password, true);
  assert.equal(Object.hasOwn(row, 'teamId'), false);
  assert.equal(Object.hasOwn(row, 'mustChangePassword'), false);
});

test('player profile rows preserve shell fallback ids and snake_case db keys', () => {
  const row = normalizePlayerProfileRowForDb({
    teamId: 'team-6',
    userId: 'shell@team.com',
    firstName: 'Shell',
    lastName: 'Player',
    createdAt: '1700000000000',
  });

  assert.equal(row.id, 'pp-shell:team-6:shell@team.com');
  assert.equal(row.user_id, 'shell@team.com');
  assert.equal(row.team_id, 'team-6');
  assert.equal(row.first_name, 'Shell');
  assert.equal(row.last_name, 'Player');
  assert.equal(row.created_at, 1700000000000);
  assert.equal(Object.hasOwn(row, 'firstName'), false);
});

test('buildRemoteRows normalizes sl:players and sl:player-profiles writes', () => {
  const [playerRow] = buildRemoteRows('sl:players', [{ email: 'p7@team.com', teamId: 'team-7' }]);
  const [profileRow] = buildRemoteRows('sl:player-profiles', [{ userId: 'p7@team.com', teamId: 'team-7' }]);

  assert.equal(playerRow.id, 'player:team-7:p7@team.com');
  assert.equal(playerRow.team_id, 'team-7');
  assert.equal(profileRow.id, 'pp-shell:team-7:p7@team.com');
  assert.equal(profileRow.user_id, 'p7@team.com');
});
