import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { onRequestPost } from '../functions/v1/teams/restore-context.js';

test('migration never returns code_last4 and persists hash/last4', async () => {
  const sql = await readFile(new URL('../migrations/027_legacy_restore_invite_codegen.sql', import.meta.url), 'utf8');
  assert.match(sql, /returns table\(invite_code text\)/i);
  assert.match(sql, /plaintext_code is not null/i);
  assert.match(sql, /right\(v_norm,4\)/i);
  assert.match(sql, /public\.hash_invite_code\(v_norm\)/i);
  assert.doesNotMatch(sql, /select\s+ti\.code_last4\s+into\s+v_code/i);
});

test('restore-context authorizes and returns team context with full code', async () => {
  const calls = [];
  global.fetch = async (url, init = {}) => {
    const u = String(url); calls.push(u);
    if (u.includes('/legacy_auth_profiles?')) return new Response(JSON.stringify([{ email: 'coach@x.com', team_id: 'team-1' }]), { status: 200 });
    if (u.includes('/teams?')) return new Response(JSON.stringify([{ id: 'team-1', name: 'Team One' }]), { status: 200 });
    if (u.endsWith('/rpc/ensure_team_invite_code_for_legacy_restore')) return new Response(JSON.stringify([{ invite_code: 'ABCD1234' }]), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  const req = new Request('http://localhost/v1/teams/restore-context', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'coach@x.com', team_id: 'team-1' }) });
  const res = await onRequestPost({ request: req, env: { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'srk' } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.team.joinCode, 'ABCD1234');
});

test('restore-context rejects arbitrary email + team_id', async () => {
  global.fetch = async () => new Response(JSON.stringify([]), { status: 200 });
  const req = new Request('http://localhost/v1/teams/restore-context', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'x@y.com', team_id: 'team-1' }) });
  const res = await onRequestPost({ request: req, env: { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'srk' } });
  assert.equal(res.status, 403);
});
