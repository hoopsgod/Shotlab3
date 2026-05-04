import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/v1/teams/restore-context.js';

function env() { return { SUPABASE_URL: 'https://s', SUPABASE_SERVICE_ROLE_KEY: 'k' }; }

function routeFetch({ rpcCode = 'ABCD2345', allow = true, teamMissing = false } = {}) {
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET', body: options.body ? JSON.parse(options.body) : null });
    const u = String(url);
    if (u.includes('/rest/v1/legacy_auth_profiles')) {
      return new Response(JSON.stringify([{ email: 'coach@x.com', role: 'coach', team_id: 'team-1' }]), { status: 200 });
    }
    if (u.includes('/rest/v1/information_schema.columns')) {
      return new Response(JSON.stringify([{ column_name: 'user_id' }, { column_name: 'team_id' }, { column_name: 'status' }]), { status: 200 });
    }
    if (u.includes('/rpc/resolve_app_user_uuid')) return new Response(JSON.stringify([{ resolve_app_user_uuid: 'uuid-1' }]), { status: 200 });
    if (u.includes('/rest/v1/team_memberships')) return new Response(JSON.stringify(allow ? [{ id: 'm1' }] : []), { status: 200 });
    if (u.includes('/rest/v1/teams?on_conflict=')) return new Response(JSON.stringify([{ id: 'team-1', name: 'Team' }]), { status: 201 });
    if (u.includes('/rest/v1/teams')) return new Response(JSON.stringify(teamMissing ? [] : [{ id: 'team-1', name: 'A', school: '', level: '', branding: null }]), { status: 200 });
    if (u.includes('/rpc/ensure_team_invite_code_for_legacy_restore')) return new Response(JSON.stringify([{ invite_code: rpcCode }]), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  return calls;
}

test('rejects unauthorized email/team combination', async () => {
  const calls = routeFetch({ allow: false });
  const res = await onRequestPost({ request: new Request('https://x', { method: 'POST', body: JSON.stringify({ email: 'p@x.com', team_id: 'team-z' }) }), env: env() });
  assert.equal(res.status, 403);
  assert.equal(calls.some((c) => c.url.includes('invite_code,code')), false);
});

test('uses ensure-team-invite RPC and returns joinCode', async () => {
  const calls = routeFetch({ rpcCode: 'QWER6789' });
  const res = await onRequestPost({ request: new Request('https://x', { method: 'POST', body: JSON.stringify({ email: 'coach@x.com', team_id: 'team-1' }) }), env: env() });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.team.joinCode, 'QWER6789');
  assert.equal(calls.some((c) => c.url.includes('/rpc/ensure_team_invite_code_for_legacy_restore')), true);
});

test('repairs missing team row for verified coach', async () => {
  routeFetch({ teamMissing: true });
  const res = await onRequestPost({ request: new Request('https://x', { method: 'POST', body: JSON.stringify({ email: 'coach@x.com', team_id: 'team-1' }) }), env: env() });
  assert.equal(res.status, 200);
});

test('response never includes password or keys', async () => {
  const source = await (await import('node:fs/promises')).readFile(new URL('../functions/v1/teams/restore-context.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /password_hash|password_salt|SUPABASE_SERVICE_ROLE_KEY/);
});
