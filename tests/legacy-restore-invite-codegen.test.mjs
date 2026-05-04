import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { onRequestPost } from '../functions/v1/teams/restore-context/index.js';

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
  assert.match(sql, /\(team_id, code_hash, code_last4, plaintext_code, state, expires_at, max_uses, use_count/i);
});

test('created_by handling supports uuid/text/nullable/absent paths', async () => {
  const sql = await readFile(new URL('../migrations/027_legacy_restore_invite_codegen.sql', import.meta.url), 'utf8');
  assert.match(sql, /information_schema\.columns[\s\S]*column_name='created_by'/i);
  assert.match(sql, /v_created_by_type = 'uuid'/i);
  assert.match(sql, /resolve_app_user_uuid/i);
  assert.match(sql, /CREATED_BY_REQUIRED/i);
  assert.match(sql, /v_created_by_type in \('text','character varying'\)/i);
});

test('restore-context endpoint rejects unauthorized requests', async () => {
  global.fetch = async (url) => {
    if (String(url).includes('/legacy_auth_profiles?')) return new Response(JSON.stringify([]), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  const res = await onRequestPost({ request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'x@y.com', team_id: 'team_1' }) }), env: {} });
  const body = await res.json();
  assert.equal(res.status, 403);
  assert.equal(body.error, 'forbidden');
});
