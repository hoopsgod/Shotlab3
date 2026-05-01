import test from 'node:test';
import assert from 'node:assert/strict';

import { onRequestPost, normalizePayload } from '../functions/v1/home-shots/log.js';

test('normalizePayload maps camelCase payload to snake_case row', () => {
  const result = normalizePayload({ id: 's1', email: 'Player@Test.com', playerId: 'p1', teamId: 't1', made: 137, date: '2026-05-01' });
  assert.equal(result.ok, true);
  assert.equal(result.row.player_id, 'p1');
  assert.equal(result.row.team_id, 't1');
  assert.equal(result.row.email, 'player@test.com');
});

test('home-shots/log persists via service role path and returns row', async () => {
  const calls = [];
  const request = new Request('https://example.com/v1/home-shots/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-id': 'player@test.com' },
    body: JSON.stringify({ id: 'shot-1', email: 'player@test.com', playerId: 'player@test.com', teamId: 'team-1', made: 137, date: '2026-05-01', ts: 1 }),
  });

  const env = {
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  };

  const originalFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/rest/v1/team_memberships')) {
      return new Response(JSON.stringify([{ id: 'm1' }]), { status: 200 });
    }
    if (String(url).includes('/rest/v1/shot_logs')) {
      return new Response(JSON.stringify([{ id: 'shot-1', team_id: 'team-1', player_id: 'player@test.com', email: 'player@test.com', made: 137 }]), { status: 201 });
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
