import test from 'node:test';
import assert from 'node:assert/strict';

import { onRequestPost } from '../functions/v1/team-memberships/confirm-context.js';

const ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  INTERNAL_API_TOKEN: 'token',
};

function makeContext({ body = {}, headers = {}, env = ENV } = {}) {
  return {
    request: new Request('https://shotlab.test/v1/team-memberships/confirm-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-api-token': 'token', ...headers },
      body: JSON.stringify(body),
    }),
    env,
  };
}

test('confirm-context resolves user uuid before confirm RPC (never passes raw email)', async () => {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    if (String(url).endsWith('/rpc/resolve_app_user_uuid')) {
      return new Response(JSON.stringify('11111111-1111-1111-1111-111111111111'), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (String(url).endsWith('/rpc/confirm_team_invite_join_from_context')) {
      return new Response(JSON.stringify([{ membership_id: 'm-1', team_id: 'team_1', invite_id: 'i-1', join_status: 'joined' }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`unexpected RPC ${url}`);
  };

  try {
    const res = await onRequestPost(makeContext({ body: { join_context_token: 'ctx-token', subject_key: 'jenn@gmail.com' }, headers: { 'x-user-id': 'jenn@gmail.com' } }));
    assert.equal(res.status, 201);
    const payload = await res.json();
    assert.equal(payload.team_id, 'team_1');
    assert.equal(payload.resolved_user_uuid, '11111111-1111-1111-1111-111111111111');

    const confirmCall = calls.find((c) => c.url.endsWith('/rpc/confirm_team_invite_join_from_context'));
    assert.ok(confirmCall);
    assert.equal(confirmCall.body.p_user_id, '11111111-1111-1111-1111-111111111111');
    assert.notEqual(confirmCall.body.p_user_id, 'jenn@gmail.com');
  } finally {
    global.fetch = originalFetch;
  }
});

test('confirm-context returns membership_insert_failed diagnostics with DB details', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).endsWith('/rpc/resolve_app_user_uuid')) {
      return new Response(JSON.stringify('11111111-1111-1111-1111-111111111111'), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (String(url).endsWith('/rpc/confirm_team_invite_join_from_context')) {
      return new Response(JSON.stringify({ code: '23505', message: 'duplicate key value violates unique constraint team_memberships_team_id_user_id_key' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`unexpected RPC ${url}`);
  };

  try {
    const res = await onRequestPost(makeContext({ body: { join_context_token: 'ctx-token', subject_key: 'jenn@gmail.com' }, headers: { 'x-user-id': 'jenn@gmail.com' } }));
    assert.equal(res.status, 500);
    const payload = await res.json();
    assert.equal(payload.error, 'consume_membership_insert_failed');
    assert.equal(payload.diagnostic_code, 'consume_membership_insert_failed');
    assert.equal(payload.sqlstate, '23505');
    assert.match(payload.db_message, /duplicate key value/i);
    assert.equal(payload.resolved_uuid, '11111111-1111-1111-1111-111111111111');
  } finally {
    global.fetch = originalFetch;
  }
});

test('existing membership (duplicate_membership) is treated as success', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).endsWith('/rpc/resolve_app_user_uuid')) {
      return new Response(JSON.stringify('11111111-1111-1111-1111-111111111111'), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (String(url).endsWith('/rpc/confirm_team_invite_join_from_context')) {
      return new Response(JSON.stringify([{ membership_id: 'm-1', team_id: 'team_1', invite_id: 'i-1', join_status: 'duplicate_membership' }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`unexpected RPC ${url}`);
  };

  try {
    const res = await onRequestPost(makeContext({ body: { join_context_token: 'ctx-token', subject_key: 'jenn@gmail.com' }, headers: { 'x-user-id': 'jenn@gmail.com' } }));
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.status, 'duplicate_membership');
    assert.equal(payload.team_id, 'team_1');
  } finally {
    global.fetch = originalFetch;
  }
});
