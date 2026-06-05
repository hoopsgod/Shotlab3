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
    syncState: 'remote_saved',
    syncSource: 'remote',
  }]);

  assert.equal(row.team_id, 'team-2');
  assert.equal(row.player_id, 'player@one.com');
  assert.equal(row.email, 'player@one.com');
});




test('syncing shot logs remain local-only and do not persist to remote shot_logs', () => {
  const rows = buildRemoteRows('sl:shotlogs', [
    { id: 'syncing', email: 'player@one.com', playerId: 'player@one.com', teamId: 'team-2', made: 11, syncState: 'syncing', syncSource: 'local' },
  ]);
  assert.deepEqual(rows, []);

  const appRow = buildAppRows('sl:shotlogs', [{ id: 'syncing', email: 'player@one.com', player_id: 'player@one.com', team_id: 'team-2', made: 11, syncState: 'syncing' }], { source: 'local' })[0];
  assert.equal(appRow.syncState, 'syncing');
  assert.equal(appRow.syncSource, 'local');
});

test('buildRemoteRows only writes server-confirmed shot logs back to the remote shot log table', () => {
  const rows = buildRemoteRows('sl:shotlogs', [
    { id: 'remote', email: 'player@one.com', playerId: 'player@one.com', teamId: 'team-2', made: 10, syncState: 'remote_saved', syncSource: 'remote' },
    { id: 'local-remote', email: 'player@one.com', playerId: 'player@one.com', teamId: 'team-2', made: 9, syncState: 'remote_saved', syncSource: 'local' },
    { id: 'pending', email: 'player@one.com', playerId: 'player@one.com', teamId: 'team-2', made: 11, syncState: 'local_pending', syncSource: 'local' },
    { id: 'failed', email: 'player@one.com', playerId: 'player@one.com', teamId: 'team-2', made: 12, syncState: 'failed_sync', syncSource: 'local' },
    { id: 'legacy', email: 'player@one.com', playerId: 'player@one.com', teamId: 'team-2', made: 13 },
  ]);

  assert.deepEqual(rows.map((row) => row.id), ['remote']);
  assert.equal(rows[0].made, 10);
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
    desc: 'Bring water',
    ownerCoachId: 'coach@team.com',
  });

  assert.equal(row.team_id, 'team-1');
  assert.equal(row.description, 'Bring water');
  assert.equal(row.id, 'event-1');
  assert.equal(row.title, 'Morning Run');
  assert.equal(Object.hasOwn(row, 'teamId'), false);
  assert.equal(Object.hasOwn(row, 'desc'), false);
  assert.equal(Object.hasOwn(row, 'owner_coach_id'), false);
});

test('event read normalization maps snake_case keys to camelCase keys', () => {
  const row = normalizeEventRowForApp({
    id: 'event-2',
    title: 'Lift',
    team_id: 'team-2',
    description: 'Heavy day',
  });

  assert.equal(row.teamId, 'team-2');
  assert.equal(row.desc, 'Heavy day');
  assert.equal(Object.hasOwn(row, 'team_id'), false);
  assert.equal(Object.hasOwn(row, 'description'), false);
});

test('existing local camelCase event rows still normalize for app reads', () => {
  const [row] = buildAppRows('sl:events', [{
    id: 'event-3',
    title: 'Practice',
    teamId: 'team-3',
    desc: 'Closeout drills',
  }]);

  assert.equal(row.teamId, 'team-3');
  assert.equal(row.desc, 'Closeout drills');
});

test('event row survives normalization without ownerCoachId', () => {
  const [row] = buildRemoteRows('sl:events', [{
    id: 'event-no-owner',
    title: 'Film Session',
    teamId: 'team-9',
  }]);

  assert.equal(row.id, 'event-no-owner');
  assert.equal(row.team_id, 'team-9');
  assert.equal(row.title, 'Film Session');
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
