import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const MIGRATION_PATH = new URL('../migrations/018_confirm_context_user_id_type_repair.sql', import.meta.url);

async function migrationSource() {
  return readFile(MIGRATION_PATH, 'utf8');
}

test('migration 018 drops old confirm function signature before recreating', async () => {
  const source = await migrationSource();
  assert.match(source, /drop function if exists public\.confirm_team_invite_join_from_context\(text, text, text, text\);/i);
  assert.match(source, /create or replace function public\.confirm_team_invite_join_from_context\(/i);
});

test('migration 018 keeps team_invite_redemptions insert schema-aware for uuid/text columns', async () => {
  const source = await migrationSource();
  assert.match(source, /v_redemption_user_id_type text;/);
  assert.match(source, /v_redemption_team_id_type text;/);
  assert.match(source, /table_name='team_invite_redemptions' and column_name='user_id'/);
  assert.match(source, /table_name='team_invite_redemptions' and column_name='team_id'/);
  assert.match(source, /values \(\$1, \$2::uuid, \$3::uuid, \$4, \$5\)/);
  assert.match(source, /values \(\$1, \$2::text, \$3::uuid, \$4, \$5\)/);
});
