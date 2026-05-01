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

test('/v1/home-shots/log succeeds without x-internal-api-token when x-user-id and active membership are present', async () => {
  const calls = [];
  const request = new Request('https://example.com/v1/home-shots/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-id': 'player@test.com' },
    body: JSON.stringify({ id: 'shot-1', email: 'player@test.com', playerId: 'player@test.com', teamId: 'team_test_123', made: 137, date: '2026-05-01', ts: 1 }),
  });

  const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'service-key' };

  const originalFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/rest/v1/team_memberships')) {
      return new Response(JSON.stringify([{ user_id: 'player@test.com', status: 'active', team_id: 'team_test_123' }]), { status: 200 });
    }
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
    assert.equal(calls.some((entry) => entry.url.includes('/rest/v1/team_memberships')), true);
    assert.equal(calls.some((entry) => entry.url.includes('/rest/v1/shot_logs')), true);
  } finally {
    global.fetch = originalFetch;
  }
});

test('/v1/home-shots/log rejects missing x-user-id', async () => {
  const request = new Request('https://example.com/v1/home-shots/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ teamId: 'team_test_123', email: 'player@test.com', playerId: 'player@test.com', made: 137 }),
  });
  const response = await onRequestPost({ request, env: {} });
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error, 'player_identity_required');
});

test('/v1/home-shots/log rejects user who is not active team member', async () => {
  const request = new Request('https://example.com/v1/home-shots/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-id': 'player@test.com' },
    body: JSON.stringify({ teamId: 'team_test_123', email: 'player@test.com', playerId: 'player@test.com', made: 137 }),
  });
  const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'service-key' };
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify([]), { status: 200 });
  try {
    const response = await onRequestPost({ request, env });
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.error, 'forbidden');
  } finally {
    global.fetch = originalFetch;
  }
});

test('/v1/home-shots/log rejects invalid made values', async () => {
  const request = new Request('https://example.com/v1/home-shots/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-id': 'player@test.com' },
    body: JSON.stringify({ teamId: 'team_test_123', email: 'player@test.com', playerId: 'player@test.com', made: -1 }),
  });
  const response = await onRequestPost({ request, env: {} });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, 'invalid_made');
});
