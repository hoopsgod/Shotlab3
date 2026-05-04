import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('restore invite RPC persists production invite schema fields', async () => {
  const sql = await readFile(new URL('../migrations/027_legacy_restore_invite_codegen.sql', import.meta.url), 'utf8');
  assert.match(sql, /ensure_team_invite_code_for_legacy_restore/);
  assert.match(sql, /random_invite_code\(8\)/);
  assert.match(sql, /normalize_invite_code/);
  assert.match(sql, /hash_invite_code/);
  assert.match(sql, /insert into public\.team_invites \(team_id, code_hash, code_last4, state, expires_at, max_uses, use_count, created_by\)/i);
});
