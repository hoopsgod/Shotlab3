import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  buildRemoteRows,
  normalizeScoreRowForDb,
  normalizeShotLogRowForDb,
  normalizeRsvpRowForDb,
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


test('rsvp rows normalize to db-compatible snake_case fields', () => {
  const row = normalizeRsvpRowForDb({
    id: 'rsvp-1',
    eventId: 42,
    email: 'Player@One.com',
    playerId: 'player-1',
    teamId: 'team-1',
    name: 'Player One',
    ts: 789,
    ignoredField: 'drop-me',
  });

  assert.deepEqual(row, {
    id: 'rsvp-1',
    event_id: '42',
    email: 'player@one.com',
    player_id: 'player-1',
    team_id: 'team-1',
    name: 'Player One',
    ts: 789,
  });
  assert.equal(Object.hasOwn(row, 'eventId'), false);
  assert.equal(Object.hasOwn(row, 'playerId'), false);
  assert.equal(Object.hasOwn(row, 'teamId'), false);
  assert.equal(Object.hasOwn(row, 'ignoredField'), false);
});

test('player RSVP save shape includes team and event identifiers', () => {
  const [row] = buildRemoteRows('sl:rsvps', [{
    id: 'rsvp-2',
    eventId: 'event-7',
    email: 'player@one.com',
    playerId: 'player@one.com',
    teamId: 'team-2',
    name: 'Player One',
    ts: 800,
  }]);

  assert.equal(row.event_id, 'event-7');
  assert.equal(row.team_id, 'team-2');
  assert.equal(row.player_id, 'player@one.com');
  assert.equal(row.email, 'player@one.com');
});


test('rsvp remote rows are normalized back to app camelCase shape on hydration', () => {
  const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /const rsvpsM=\(rawRsvps\|\|\[\]\)\.map\(r=>\(\{\.\.\.r,id:r\.id\|\|null,eventId:r\.eventId\|\|r\.event_id,playerId:r\.playerId\|\|r\.player_id\|\|r\.email,teamId:r\.teamId\|\|r\.team_id\|\|teamForEmail\(r\.email\),email:normalizeEmail\(r\.email\|\|""\),name:String\(r\.name\|\|""\),ts:Number\.isFinite\(Number\(r\.ts\)\)\?Number\(r\.ts\):Date\.now\(\)\}\)\);/);
});

test('coach and player RSVP scopes remain team/event based after reload normalization', () => {
  const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /const scopedRsvps=rsvps\.filter\(r=>r\.teamId===user\?\.teamId\);/);
  assert.match(source, /const evR=rsvpsByEvent\.get\(ev\.id\)\|\|\[\];/);
});
