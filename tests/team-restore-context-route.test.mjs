import test from 'node:test';
import assert from 'node:assert/strict';

import { onRequestPost as restoreContextPost } from '../functions/v1/teams/restore-context/index.js';
import { startInviteContext } from '../functions/_utils/inviteFlowCore.js';

const ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  INTERNAL_API_TOKEN: 'token',
};

function makeContext({ body = {}, headers = {}, env = ENV } = {}) {
  return {
    request: new Request('https://shotlab.test/v1/teams/restore-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-api-token': 'token', ...headers },
      body: JSON.stringify(body),
    }),
    env,
  };
}

test('restore-context returns production-safe joinCode from RPC and join flow resolves it', async () => {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, init = {}) => {
    const reqUrl = String(url);
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ reqUrl, body });

    if (reqUrl.includes('/rest/v1/team_memberships?select=')) {
      return new Response(JSON.stringify([{ team_id: 'team_1', user_id: 'player@shotlab.app', role: 'player', status: 'active' }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (reqUrl.endsWith('/rpc/ensure_team_invite_code_for_legacy_restore')) {
      return new Response(JSON.stringify([{ join_code: 'ABCD1234' }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (reqUrl.endsWith('/rpc/lookup_team_invite_by_code')) {
      return new Response(JSON.stringify([{ lookup_count: 1, normalized_code: 'ABCD1234', lookup_hash_prefix: 'aa11', team_id: 'team_1', invite_state: 'active', expires_at: '2999-01-01T00:00:00.000Z' }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (reqUrl.endsWith('/rpc/resolve_team_invite_context')) {
      return new Response(JSON.stringify([{ join_context_token: 'ctx-1', expires_at: '2999-01-01T00:00:00.000Z', invite_id: 'inv_1', team_id: 'team_1' }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`unexpected request ${reqUrl}`);
  };

  try {
    const res = await restoreContextPost(makeContext({ body: { email: 'player@shotlab.app' } }));
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.joinCode, 'ABCD1234');
    assert.equal(payload.teamId, 'team_1');

    const context = await startInviteContext({
      callRpc: async (fn, params) => {
        const rpcRes = await fetch(`${ENV.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params || {}),
        });
        return rpcRes.json();
      },
      subjectKey: 'player@shotlab.app',
      inviteCode: payload.joinCode,
    });

    assert.equal(context.ok, true);
    assert.equal(context.data.team_id, 'team_1');

    const membershipCall = calls.find((c) => c.reqUrl.includes('/rest/v1/team_memberships?select='));
    assert.ok(membershipCall);
    assert.match(membershipCall.reqUrl, /team_id,user_id,role,status/);
    assert.ok(calls.find((c) => c.reqUrl.endsWith('/rpc/ensure_team_invite_code_for_legacy_restore')));
  } finally {
    global.fetch = originalFetch;
  }
});
