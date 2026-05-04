import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { onRequestPost } from '../functions/v1/teams/restore-context/index.js';

function mockFetch(handler) { global.fetch = handler; }

test('migration adds plaintext_code safely and idempotently', async () => {
  const sql = await readFile(new URL('../migrations/027_legacy_restore_invite_codegen.sql', import.meta.url), 'utf8');
  assert.match(sql, /add column if not exists plaintext_code text/i);
});

test('rpc never returns code_last4 and persists plaintext/hash fields', async () => {
  const sql = await readFile(new URL('../migrations/027_legacy_restore_invite_codegen.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(sql, /return query select\s+[^;]*code_last4/i);
  assert.match(sql, /return query select public\.normalize_invite_code\(v_existing_plaintext\)/i);
  assert.match(sql, /public\.random_invite_code/i);
  assert.match(sql, /public\.normalize_invite_code/i);
  assert.match(sql, /public\.hash_invite_code/i);
});

test('restore-context endpoint rejects unauthorized requests', async () => {
  mockFetch(async (url) => {
    if (String(url).includes('/rest/v1/legacy_auth_profiles?')) return new Response(JSON.stringify([]), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  });
  const res = await onRequestPost({ request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'x@y.com', team_id: 'team_1' }) }), env: {} });
  assert.equal(res.status, 403);
});

test('restore-context authorizes via uuid membership lookup using p_identifier', async () => {
  const rpcBodies = [];
  mockFetch(async (url, init = {}) => {
    const u = String(url);
    if (u.includes('/rest/v1/legacy_auth_profiles?')) return new Response(JSON.stringify([]), { status: 200 });
    if (u.includes('/rest/v1/team_memberships?') && u.includes('user_id=eq.user%40x.com')) return new Response(JSON.stringify([]), { status: 200 });
    if (u.includes('/rest/v1/rpc/resolve_app_user_uuid')) {
      const body = JSON.parse(init.body || '{}');
      rpcBodies.push(body);
      if (body.p_identifier === 'user@x.com') return new Response(JSON.stringify('11111111-1111-1111-1111-111111111111'), { status: 200 });
      return new Response(JSON.stringify(null), { status: 200 });
    }
    if (u.includes('/rest/v1/team_memberships?') && u.includes('user_id=eq.11111111-1111-1111-1111-111111111111')) return new Response(JSON.stringify([{ id: 'm1' }]), { status: 200 });
    if (u.includes('/rest/v1/teams?')) return new Response(JSON.stringify([{ id: 'team_1', name: 'Team' }]), { status: 200 });
    if (u.includes('/rest/v1/rpc/ensure_team_invite_code_for_legacy_restore')) return new Response(JSON.stringify([{ invite_code: 'ABCD1234' }]), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  });
  const res = await onRequestPost({ request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'user@x.com', team_id: 'team_1' }) }), env: { SUPABASE_URL: 'http://db', SUPABASE_SERVICE_ROLE_KEY: 'key' } });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.team.joinCode, 'ABCD1234');
  assert.ok(rpcBodies.some((payload) => Object.hasOwn(payload, 'p_identifier')));
});

test('missing team repair handles coach_user_id uuid not null', async () => {
  let teamReads = 0;
  mockFetch(async (url, init = {}) => {
    const u = String(url);
    if (u.includes('/rest/v1/legacy_auth_profiles?')) return new Response(JSON.stringify([{ email: 'coach@x.com', role: 'coach', team_id: 'team_2', name: 'Coach' }]), { status: 200 });
    if (u.includes('/rest/v1/team_memberships?')) return new Response(JSON.stringify([]), { status: 200 });
    if (u.includes('/rest/v1/teams?select=id,name&id=eq.team_2')) { teamReads += 1; return new Response(JSON.stringify(teamReads === 1 ? [] : [{ id: 'team_2', name: 'Coach' }]), { status: 200 }); }
    if (u.includes('/rest/v1/information_schema.columns?')) return new Response(JSON.stringify([{ column_name: 'coach_user_id', data_type: 'uuid', is_nullable: 'NO' }]), { status: 200 });
    if (u.includes('/rest/v1/rpc/resolve_app_user_uuid')) return new Response(JSON.stringify('22222222-2222-2222-2222-222222222222'), { status: 200 });
    if (u.includes('/rest/v1/teams?on_conflict=id')) {
      const payload = JSON.parse(init.body)[0];
      assert.equal(payload.coach_user_id, '22222222-2222-2222-2222-222222222222');
      return new Response(JSON.stringify([payload]), { status: 201 });
    }
    if (u.includes('/rest/v1/rpc/ensure_team_invite_code_for_legacy_restore')) return new Response(JSON.stringify([{ invite_code: 'ZXCV1234' }]), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  });
  const res = await onRequestPost({ request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'coach@x.com', team_id: 'team_2' }) }), env: { SUPABASE_URL: 'http://db', SUPABASE_SERVICE_ROLE_KEY: 'key' } });
  assert.equal(res.status, 200);
});

test('missing team repair returns controlled error when coach_user_id uuid non-null and uuid missing', async () => {
  mockFetch(async (url) => {
    const u = String(url);
    if (u.includes('/rest/v1/legacy_auth_profiles?')) return new Response(JSON.stringify([{ email: 'coach@x.com', role: 'coach', team_id: 'team_3', name: 'Coach' }]), { status: 200 });
    if (u.includes('/rest/v1/team_memberships?')) return new Response(JSON.stringify([]), { status: 200 });
    if (u.includes('/rest/v1/teams?select=id,name&id=eq.team_3')) return new Response(JSON.stringify([]), { status: 200 });
    if (u.includes('/rest/v1/information_schema.columns?')) return new Response(JSON.stringify([{ column_name: 'coach_user_id', data_type: 'uuid', is_nullable: 'NO' }]), { status: 200 });
    if (u.includes('/rest/v1/rpc/resolve_app_user_uuid')) return new Response(JSON.stringify(null), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  });
  const res = await onRequestPost({ request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'coach@x.com', team_id: 'team_3' }) }), env: { SUPABASE_URL: 'http://db', SUPABASE_SERVICE_ROLE_KEY: 'key' } });
  const body = await res.json();
  assert.equal(res.status, 409);
  assert.equal(body.error, 'TEAM_REPAIR_COACH_USER_REQUIRED');
});


test('missing team repair handles nullable coach_user_id by inserting null', async () => {
  let teamReads = 0;
  mockFetch(async (url, init = {}) => {
    const u = String(url);
    if (u.includes('/rest/v1/legacy_auth_profiles?')) return new Response(JSON.stringify([{ email: 'coach@x.com', role: 'coach', team_id: 'team_4', name: 'Coach' }]), { status: 200 });
    if (u.includes('/rest/v1/team_memberships?')) return new Response(JSON.stringify([]), { status: 200 });
    if (u.includes('/rest/v1/teams?select=id,name&id=eq.team_4')) { teamReads += 1; return new Response(JSON.stringify(teamReads === 1 ? [] : [{ id: 'team_4', name: 'Coach' }]), { status: 200 }); }
    if (u.includes('/rest/v1/information_schema.columns?')) return new Response(JSON.stringify([{ column_name: 'coach_user_id', data_type: 'uuid', is_nullable: 'YES' }]), { status: 200 });
    if (u.includes('/rest/v1/rpc/resolve_app_user_uuid')) return new Response(JSON.stringify(null), { status: 200 });
    if (u.includes('/rest/v1/teams?on_conflict=id')) {
      const payload = JSON.parse(init.body)[0];
      assert.equal(payload.coach_user_id, null);
      return new Response(JSON.stringify([payload]), { status: 201 });
    }
    if (u.includes('/rest/v1/rpc/ensure_team_invite_code_for_legacy_restore')) return new Response(JSON.stringify([{ invite_code: 'NULL1234' }]), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  });
  const res = await onRequestPost({ request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'coach@x.com', team_id: 'team_4' }) }), env: { SUPABASE_URL: 'http://db', SUPABASE_SERVICE_ROLE_KEY: 'key' } });
  assert.equal(res.status, 200);
});

test('missing team repair omits coach_user_id when column absent', async () => {
  let teamReads = 0;
  mockFetch(async (url, init = {}) => {
    const u = String(url);
    if (u.includes('/rest/v1/legacy_auth_profiles?')) return new Response(JSON.stringify([{ email: 'coach@x.com', role: 'coach', team_id: 'team_5', name: 'Coach' }]), { status: 200 });
    if (u.includes('/rest/v1/team_memberships?')) return new Response(JSON.stringify([]), { status: 200 });
    if (u.includes('/rest/v1/teams?select=id,name&id=eq.team_5')) { teamReads += 1; return new Response(JSON.stringify(teamReads === 1 ? [] : [{ id: 'team_5', name: 'Coach' }]), { status: 200 }); }
    if (u.includes('/rest/v1/information_schema.columns?')) return new Response(JSON.stringify([]), { status: 200 });
    if (u.includes('/rest/v1/teams?on_conflict=id')) {
      const payload = JSON.parse(init.body)[0];
      assert.equal(Object.hasOwn(payload, 'coach_user_id'), false);
      return new Response(JSON.stringify([payload]), { status: 201 });
    }
    if (u.includes('/rest/v1/rpc/ensure_team_invite_code_for_legacy_restore')) return new Response(JSON.stringify([{ invite_code: 'ABSE1234' }]), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  });
  const res = await onRequestPost({ request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'coach@x.com', team_id: 'team_5' }) }), env: { SUPABASE_URL: 'http://db', SUPABASE_SERVICE_ROLE_KEY: 'key' } });
  assert.equal(res.status, 200);
});
