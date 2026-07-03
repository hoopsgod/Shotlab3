import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cleanupScriptPath = '../admin/manual/admin_reset_test_accounts_keep_aq_coach.sql';
const sql = readFileSync(new URL(cleanupScriptPath, import.meta.url), 'utf8');
const cleanupReadme = readFileSync(new URL('../admin/manual/README_test_account_reset.md', import.meta.url), 'utf8');

test('admin cleanup script is manual destructive reset that preserves AQ coach', () => {
  assert.match(cleanupScriptPath, /admin\/manual\/admin_reset_test_accounts_keep_aq_coach\.sql/);
  assert.match(sql, /DESTRUCTIVE ADMIN-ONLY TEST RESET SCRIPT/);
  assert.match(sql, /Manual execution only/);
  assert.match(sql, /aq@gmail\.com/);
  assert.match(sql, /_delete_non_keep_app_rows/);
  assert.match(sql, /'public', 'scores'/);
  assert.match(sql, /'public', 'shot_logs'/);
  assert.match(sql, /'public', 'program_scores'/);
  assert.match(sql, /'public', 'team_memberships'/);
  assert.match(sql, /'public', 'player_profiles'/);
  assert.match(sql, /'public', 'players'/);
  assert.match(sql, /Supabase Dashboard -> Authentication -> Users/);
  assert.match(sql, /remaining_auth_users/);
  assert.match(sql, /aq_coach_preserved/);
});


test('admin cleanup script explicitly requires Supabase Auth user deletion for reused emails', () => {
  assert.match(sql, /Deleting app rows is not enough/);
  assert.match(sql, /Account already exists/);
  assert.match(sql, /Supabase Dashboard -> Authentication -> Users -> delete every user except AQ@gmail\.com/);
  assert.match(sql, /Rick@gmail\.com/);
  assert.match(sql, /rick_auth_user_should_be_absent/);
  assert.match(sql, /A new player can register with a previously used email after its Auth user is deleted/);
});


test('admin cleanup script is schema-safe for optional public.scores columns', () => {
  assert.match(sql, /information_schema\.columns/);
  assert.match(sql, /c\.column_name = any\(p_identity_columns\)/);
  assert.match(sql, /select pg_temp\._delete_non_keep_app_rows\('public', 'scores', array\['email', 'player_email', 'player_id', 'user_id', 'profile_id', 'id'\]\)/);
  assert.doesNotMatch(sql, /delete from public\.scores[^;]*player_email/s);
  assert.doesNotMatch(sql, /from public\.scores where lower\(coalesce\([^;]*player_email/s);
});

test('admin cleanup script preserves AQ case-insensitively and removes non-AQ app data', () => {
  assert.equal(sql.includes('AQ@gmail.com, aq@gmail.com, and'), true);
  assert.equal(sql.includes('Aq@Gmail.com all resolve'), true);
  assert.match(sql, /lower\(email\) not in \(select email from _keep_account\)/);
  assert.match(sql, /remaining_players_should_be_zero/);
  assert.match(sql, /remaining_coaches_except_aq_should_be_zero/);
  assert.match(sql, /remaining_roster_rows/);
  assert.match(sql, /remaining_scores/);
  assert.match(sql, /remaining_shot_logs/);
  assert.match(sql, /remaining_program_scores/);
});


test('admin cleanup README documents auth cleanup and registration verification', () => {
  assert.match(cleanupReadme, /Supabase Dashboard → Authentication → Users/);
  assert.match(cleanupReadme, /cleans only app database tables/);
  assert.match(cleanupReadme, /does not remove Supabase Auth users/);
  assert.match(cleanupReadme, /Account already exists/);
  assert.match(cleanupReadme, /Rick@gmail\.com/);
  assert.match(cleanupReadme, /Coach roster is empty until new players register with the coach code/);
  assert.match(cleanupReadme, /previously used email after that email's Auth user is deleted/);
});


test('cleanup docs warn to preserve and recover AQ Auth coach account', () => {
  assert.match(sql, /Do NOT delete AQ@gmail\.com from Supabase Auth/);
  assert.match(sql, /Recovery if AQ@gmail\.com was accidentally deleted from Supabase Auth/);
  assert.match(sql, /Recreate AQ@gmail\.com manually in Supabase Auth or through the Coach create-account flow/);
  assert.match(sql, /Ensure the recreated AQ@gmail\.com account is a coach, not a player/);
  assert.match(cleanupReadme, /Do \*\*not\*\* delete `AQ@gmail\.com`/);
  assert.match(cleanupReadme, /Recovery if AQ@gmail\.com was accidentally deleted/);
  assert.match(cleanupReadme, /Do not recreate the preserved coach email as a player/);
  assert.match(cleanupReadme, /Use a different player email for player registration testing/);
});
