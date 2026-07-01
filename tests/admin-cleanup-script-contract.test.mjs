import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../migrations/admin_reset_test_accounts_keep_aq_coach.sql', import.meta.url), 'utf8');

test('admin cleanup script is manual destructive reset that preserves AQ coach', () => {
  assert.match(sql, /DESTRUCTIVE ADMIN-ONLY TEST RESET SCRIPT/);
  assert.match(sql, /Manual execution only/);
  assert.match(sql, /aq@gmail\.com/);
  assert.match(sql, /delete from public\.scores/);
  assert.match(sql, /delete from public\.shot_logs/);
  assert.match(sql, /delete from public\.program_scores/);
  assert.match(sql, /delete from public\.team_memberships/);
  assert.match(sql, /delete from public\.player_profiles/);
  assert.match(sql, /delete from public\.players/);
  assert.match(sql, /Supabase Auth Admin UI/);
  assert.match(sql, /remaining_auth_users/);
  assert.match(sql, /aq_coach_preserved/);
});
