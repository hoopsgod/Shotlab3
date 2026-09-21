import test from 'node:test';
import assert from 'node:assert/strict';

import { loadHomeShotsLeaderboard } from '../src/lib/homeShotsLeaderboardService.js';

const request = (body, { status = 200, contentType = 'application/json' } = {}) => async (_url, init) => {
  assert.equal(init.headers['x-user-id'], 'coach@example.com');
  return new Response(body, { status, headers: { 'content-type': contentType } });
};

test('home-shots service keeps a 200 empty response as a successful empty state', async () => {
  const result = await loadHomeShotsLeaderboard({
    teamId: 'team-service',
    userEmail: 'coach@example.com',
    fetchImpl: request(JSON.stringify({ leaderboard: [] })),
  });
  assert.deepEqual(result, {
    ok: true,
    status: 'success',
    rows: [],
    httpStatus: 200,
    errorCode: '',
    diagnostics: null,
    url: '/v1/leaderboards/home-shots?team_id=team-service&limit=10&scope=players',
  });
});

test('home-shots service distinguishes permission, unavailable integration, and malformed success payloads', async () => {
  const permission = await loadHomeShotsLeaderboard({
    teamId: 'team-service', userEmail: 'coach@example.com',
    fetchImpl: request(JSON.stringify({ error: 'forbidden' }), { status: 403 }),
  });
  const unavailable = await loadHomeShotsLeaderboard({
    teamId: 'team-service', userEmail: 'coach@example.com',
    fetchImpl: request('not found', { status: 404, contentType: 'text/plain' }),
  });
  const malformed = await loadHomeShotsLeaderboard({
    teamId: 'team-service', userEmail: 'coach@example.com',
    fetchImpl: request(JSON.stringify({ leaderboard: [{ rank: 1, player_display_name: 'Missing identity', total_home_shots: 14 }] })),
  });

  assert.equal(permission.status, 'permission');
  assert.equal(permission.ok, false);
  assert.equal(unavailable.status, 'unavailable');
  assert.equal(unavailable.ok, false);
  assert.equal(malformed.status, 'unavailable');
  assert.equal(malformed.errorCode, 'invalid_leaderboard_rows');
});

test('home-shots service accepts identity-bearing rows and keeps network failure separate from empty data', async () => {
  const populated = await loadHomeShotsLeaderboard({
    teamId: 'team-service', userEmail: 'coach@example.com',
    fetchImpl: request(JSON.stringify({ leaderboard: [{ rank: 1, player_id: 'player-1', player_display_name: 'Ava', total_home_shots: 14, leaderboard_source: 'remote' }] })),
  });
  const failure = await loadHomeShotsLeaderboard({
    teamId: 'team-service', userEmail: 'coach@example.com',
    fetchImpl: async () => { throw new Error('offline'); },
  });

  assert.equal(populated.ok, true);
  assert.equal(populated.rows[0].player_id, 'player-1');
  assert.equal(failure.ok, false);
  assert.equal(failure.status, 'error');
  assert.equal(failure.errorCode, 'network_error');
});

test('home-shots service reports missing team context and missing identity separately', async () => {
  const missingTeam = await loadHomeShotsLeaderboard({ userEmail: 'coach@example.com' });
  const missingIdentity = await loadHomeShotsLeaderboard({ teamId: 'team-service' });

  assert.equal(missingTeam.status, 'missing_context');
  assert.equal(missingIdentity.status, 'permission');
});
