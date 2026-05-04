import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { onRequestPost as restoreContextPost } from '../functions/v1/teams/restore-context/index.js';
import { startInviteContext } from '../functions/_utils/inviteFlowCore.js';

const ENV = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-role-key', INTERNAL_API_TOKEN: 'token' };

function makeContext({ body = {} } = {}) {
  return {
    request: new Request('https://shotlab.test/v1/teams/restore-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-api-token': 'token' },
      body: JSON.stringify(body),
    }),
    env: ENV,
  };
}

test('migration contract: never returns code_last4 and handles created_by by schema', async () => {
  const sql = await readFile(new URL('../migrations/027_legacy_restore_invite_codegen.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(sql, /select\s+ti\.code_last4[\s\S]*return query select v_existing_code/i);
  assert.match(sql, /v_code := public\.random_invite_code\(8\)/);
  assert.match(sql, /v_normalized := public\.normalize_invite_code\(v_code\)/);
  assert.match(sql, /v_hash := public\.hash_invite_code\(v_normalized\)/);
  assert.match(sql, /if v_created_by_udt = 'uuid'/i);
  assert.match(sql, /public\.resolve_app_user_uuid\(v_email\)/);
});

test('rejects arbitrary email + arbitrary team_id when unauthorized', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    const u = String(url);
    if (u.includes('/rest/v1/legacy_auth_profiles')) return new Response(JSON.stringify([{ email: 'p@x.com', role: 'player', team_id: 'team_a' }]), { status: 200 });
    if (u.endsWith('/rpc/resolve_app_user_uuid')) return new Response(JSON.stringify('uuid-p'), { status: 200 });
    if (u.includes('/rest/v1/team_memberships')) return new Response(JSON.stringify([]), { status: 200 });
    throw new Error(`unexpected ${u}`);
  };
  try {
    const res = await restoreContextPost(makeContext({ body: { email: 'p@x.com', team_id: 'team_bad' } }));
    assert.equal(res.status, 403);
  } finally { global.fetch = originalFetch; }
});

test('coach legacy profile with matching team_id is authorized', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    const u = String(url);
    if (u.includes('/rest/v1/legacy_auth_profiles')) return new Response(JSON.stringify([{ email: 'c@x.com', role: 'coach', team_id: 'team_c' }]), { status: 200 });
    if (u.endsWith('/rpc/resolve_app_user_uuid')) return new Response(JSON.stringify('uuid-c'), { status: 200 });
    if (u.includes('/rest/v1/team_memberships')) return new Response(JSON.stringify([]), { status: 200 });
    if (u.endsWith('/rpc/ensure_team_invite_code_for_legacy_restore')) return new Response(JSON.stringify([{ join_code: 'QWER1234' }]), { status: 200 });
    if (u.includes('/rest/v1/teams?select=')) return new Response(JSON.stringify([{ id: 'team_c', name: 'Coach Team' }]), { status: 200 });
    throw new Error(`unexpected ${u}`);
  };
  try {
    const res = await restoreContextPost(makeContext({ body: { email: 'c@x.com', team_id: 'team_c' } }));
    const payload = await res.json();
    assert.equal(res.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.team.joinCode, 'QWER1234');
    assert.equal(payload.team.id, 'team_c');
  } finally { global.fetch = originalFetch; }
});

test('player active membership with matching team_id is authorized and returned code resolves in join flow', async () => {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, init = {}) => {
    const u = String(url);
    calls.push(u);
    if (u.includes('/rest/v1/legacy_auth_profiles')) return new Response(JSON.stringify([]), { status: 200 });
    if (u.endsWith('/rpc/resolve_app_user_uuid')) return new Response(JSON.stringify('uuid-p'), { status: 200 });
    if (u.includes('/rest/v1/team_memberships')) return new Response(JSON.stringify([{ team_id: 'team_1', user_id: 'uuid-p', role: 'player', status: 'active' }]), { status: 200 });
    if (u.endsWith('/rpc/ensure_team_invite_code_for_legacy_restore')) return new Response(JSON.stringify([{ join_code: 'ABCD1234' }]), { status: 200 });
    if (u.includes('/rest/v1/teams?select=')) return new Response(JSON.stringify([{ id: 'team_1', name: 'Team One' }]), { status: 200 });
    if (u.endsWith('/rpc/lookup_team_invite_by_code')) return new Response(JSON.stringify([{ lookup_count: 1, normalized_code: 'ABCD1234', lookup_hash_prefix: 'aa11', team_id: 'team_1', invite_state: 'active', expires_at: '2999-01-01T00:00:00.000Z' }]), { status: 200 });
    if (u.endsWith('/rpc/resolve_team_invite_context')) return new Response(JSON.stringify([{ join_context_token: 'ctx-1', expires_at: '2999-01-01T00:00:00.000Z', invite_id: 'inv_1', team_id: 'team_1' }]), { status: 200 });
    throw new Error(`unexpected ${u}`);
  };
  try {
    const res = await restoreContextPost(makeContext({ body: { email: 'player@shotlab.app', team_id: 'team_1' } }));
    const payload = await res.json();
    assert.equal(res.status, 200);
    assert.equal(payload.team.joinCode, 'ABCD1234');
    assert.deepEqual(Object.keys(payload).sort(), ['ok', 'team']);

    const context = await startInviteContext({
      callRpc: async (fn, params) => (await fetch(`${ENV.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params || {}) })).json(),
      subjectKey: 'player@shotlab.app',
      inviteCode: payload.team.joinCode,
    });
    assert.equal(context.ok, true);
    assert.equal(context.data.team_id, 'team_1');
    assert.ok(calls.some((u) => u.includes('team_memberships?select=team_id,user_id,role,status')));
  } finally { global.fetch = originalFetch; }
});
