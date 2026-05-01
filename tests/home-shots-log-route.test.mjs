import test from 'node:test';
import assert from 'node:assert/strict';

import { onRequestPost, normalizePayload } from '../functions/v1/home-shots/log.js';

test('normalizePayload accepts team_test_123 with player identity and made=137', () => {
  const result = normalizePayload({ teamId: 'team_test_123', email: 'Player@Test.com', playerId: 'player@test.com', made: 137, date: '2026-05-01' });
  assert.equal(result.ok, true);
  assert.equal(result.row.team_id, 'team_test_123');
  assert.equal(result.row.player_id, 'player@test.com');
  assert.equal(result.row.made, 137);
  assert.equal(result.row.date, '2026-05-01');
});

test('endpoint rejects missing team_id', async () => {
  const request = new Request('https://example.com/v1/home-shots/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-id': 'player@test.com', 'x-internal-api-token': 'test' },
    body: JSON.stringify({ email: 'player@test.com', playerId: 'player@test.com', made: 137 }),
  });
  const response = await onRequestPost({ request, env: { INTERNAL_API_TOKEN: 'test' } });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, 'team_id_required');
});

test('endpoint rejects invalid made values', async () => {
  const request = new Request('https://example.com/v1/home-shots/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-id': 'player@test.com', 'x-internal-api-token': 'test' },
    body: JSON.stringify({ teamId: 'team_test_123', email: 'player@test.com', playerId: 'player@test.com', made: -1 }),
  });
  const response = await onRequestPost({ request, env: { INTERNAL_API_TOKEN: 'test' } });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, 'invalid_made');
});

test('home-shots/log writes valid shot_logs row', async () => {
  const calls = [];
  const request = new Request('https://example.com/v1/home-shots/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-id': 'player@test.com', 'x-internal-api-token': 'test' },
    body: JSON.stringify({ id: 'shot-1', email: 'player@test.com', playerId: 'player@test.com', teamId: 'team_test_123', made: 137, date: '2026-05-01', ts: 1 }),
  });

  const env = { INTERNAL_API_TOKEN: 'test', SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'service-key' };

  const originalFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/rest/v1/shot_logs')) {
      return new Response(JSON.stringify([{ id: 'shot-1', team_id: 'team_test_123', player_id: 'player@test.com', email: 'player@test.com', made: 137 }]), { status: 201 });
    }
    return new Response(JSON.stringify({ error: 'unexpected' }), { status: 500 });
  };

  try {
    const response = await onRequestPost({ request, env });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(calls.some((entry) => entry.url.includes('/rest/v1/shot_logs')), true);
  } finally {
    global.fetch = originalFetch;
  }
});
