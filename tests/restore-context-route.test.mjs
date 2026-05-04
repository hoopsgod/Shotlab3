import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { onRequestPost } from '../functions/v1/teams/restore-context.js';

const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'srk', INTERNAL_API_TOKEN: 'token-1' };
const authedHeaders = { 'Content-Type': 'application/json', 'x-internal-api-token': 'token-1' };

test('migration safely adds plaintext_code and uses controlled created_by uuid handling', async () => {
  const sql = await readFile(new URL('../migrations/027_legacy_restore_invite_codegen.sql', import.meta.url), 'utf8');
  assert.match(sql, /alter table public\.team_invites add column if not exists plaintext_code text;/i);
  assert.match(sql, /execute \$q\$[\s\S]*ti\.plaintext_code[\s\S]*\$q\$/i);
  assert.doesNotMatch(sql, /select\s+ti\.plaintext_code\s+into\s+v_code/i);
  assert.match(sql, /CREATED_BY_UUID_REQUIRED/);
  assert.match(sql, /resolve_app_user_uuid/);
});

test('restore-context requires api token', async () => {
  const req = new Request('http://localhost/v1/teams/restore-context', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'coach@x.com', team_id: 'team-1' }) });
  const res = await onRequestPost({ request: req, env });
  assert.equal(res.status, 401);
});

test('restore-context authorizes and returns team context with full code', async () => {
  global.fetch = async (url) => {
    const u = String(url);
    if (u.includes('/legacy_auth_profiles?')) return new Response(JSON.stringify([{ email: 'coach@x.com', role: 'coach', team_id: 'team-1' }]), { status: 200 });
    if (u.includes('/teams?')) return new Response(JSON.stringify([{ id: 'team-1', name: 'Team One' }]), { status: 200 });
    if (u.endsWith('/rpc/ensure_team_invite_code_for_legacy_restore')) return new Response(JSON.stringify([{ invite_code: 'ABCD1234' }]), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  const req = new Request('http://localhost/v1/teams/restore-context', { method: 'POST', headers: authedHeaders, body: JSON.stringify({ email: 'coach@x.com', team_id: 'team-1' }) });
  const res = await onRequestPost({ request: req, env });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.team.joinCode, 'ABCD1234');
  assert.notEqual(body.team.joinCode, '1234');
});

test('restore-context repairs missing team row for verified coach', async () => {
  const calls = [];
  global.fetch = async (url) => {
    const u = String(url); calls.push(u);
    if (u.includes('/legacy_auth_profiles?')) return new Response(JSON.stringify([{ email: 'coach@x.com', role: 'coach', name: 'Coach X', team_id: 'team-404' }]), { status: 200 });
    if (u.includes('/teams?select=id,name&id=eq.team-404')) return new Response(JSON.stringify([]), { status: 200 });
    if (u.includes('/rest/v1/teams?on_conflict=id')) return new Response(JSON.stringify([{ id: 'team-404', name: 'Coach X' }]), { status: 201 });
    if (u.endsWith('/rpc/ensure_team_invite_code_for_legacy_restore')) return new Response(JSON.stringify([{ invite_code: 'ZXCV1234' }]), { status: 200 });
    return new Response(JSON.stringify([{ id: 'team-404', name: 'Coach X' }]), { status: 200 });
  };
  const req = new Request('http://localhost/v1/teams/restore-context', { method: 'POST', headers: authedHeaders, body: JSON.stringify({ email: 'coach@x.com', team_id: 'team-404' }) });
  const res = await onRequestPost({ request: req, env });
  assert.equal(res.status, 200);
  assert.ok(calls.some((u) => u.includes('/rest/v1/teams?on_conflict=id')));
});

test('restore-context rejects arbitrary email + team_id', async () => {
  global.fetch = async () => new Response(JSON.stringify([]), { status: 200 });
  const req = new Request('http://localhost/v1/teams/restore-context', { method: 'POST', headers: authedHeaders, body: JSON.stringify({ email: 'x@y.com', team_id: 'team-1' }) });
  const res = await onRequestPost({ request: req, env });
  assert.equal(res.status, 403);
});
