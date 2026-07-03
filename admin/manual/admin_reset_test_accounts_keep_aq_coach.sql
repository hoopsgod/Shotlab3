-- =================================================================================================
-- DESTRUCTIVE ADMIN-ONLY TEST RESET SCRIPT
-- Manual execution only.
-- WARNING: THIS DELETES TEST USERS AND TEST DATA. RUN MANUALLY ONLY AFTER BACKUP.
-- This does not automatically run in production. Do not add this file to an automatic migration path.
-- Goal: preserve AQ@gmail.com (case-insensitive) as the only coach account and remove every other
-- test user, app profile, roster membership, score/log, RSVP, attendance, and stale app row.
-- =================================================================================================
-- SUPABASE AUTH IS REQUIRED FOR A COMPLETE RESET:
-- Deleting app rows is not enough. If a test email such as Rick@gmail.com remains in Supabase Auth,
-- registration will still fail with "Account already exists. Please sign in."
--
-- Exact manual Auth cleanup path:
--   Supabase Dashboard -> Authentication -> Users -> delete every user except AQ@gmail.com.
--   Do NOT delete AQ@gmail.com from Supabase Auth if it is the coach account you want to keep.
--   Verify that AQ@gmail.com still exists in Auth and Rick@gmail.com (plus every other old test/player/coach email) no longer appears there.
--
-- If you prefer SQL/service-role cleanup and your environment permits auth.users deletion, run the
-- commented auth.users statements near the bottom with a service-role/admin connection only.
-- Never run Auth deletion from the app or with anon/client credentials.

begin;

-- Normalize the preserved account once for every statement below. AQ@gmail.com, aq@gmail.com, and
-- Aq@Gmail.com all resolve to this same preserved coach identity.
create temp table _keep_account(email text primary key) on commit drop;
insert into _keep_account(email) values ('aq@gmail.com');

-- Schema-safe app-table cleanup helper.
-- This helper only references columns after information_schema confirms they exist on the target table.
-- That keeps the reset safe across environments where legacy/optional columns such as player_email
-- were never added to a given table. Tables that do not exist are skipped.
create or replace function pg_temp._delete_non_keep_app_rows(
  p_schema text,
  p_table text,
  p_identity_columns text[]
) returns void
language plpgsql
as $$
declare
  v_identity_exprs text[];
  v_table_exists regclass;
begin
  v_table_exists := to_regclass(format('%I.%I', p_schema, p_table));
  if v_table_exists is null then
    return;
  end if;

  select array_agg(format('%I::text', c.column_name) order by array_position(p_identity_columns, c.column_name))
    into v_identity_exprs
  from information_schema.columns c
  where c.table_schema = p_schema
    and c.table_name = p_table
    and c.column_name = any(p_identity_columns);

  if v_identity_exprs is null or array_length(v_identity_exprs, 1) is null then
    return;
  end if;

  execute format(
    'delete from %I.%I where lower(coalesce(%s, '''')) not in (select email from _keep_account)',
    p_schema,
    p_table,
    array_to_string(v_identity_exprs, ', ')
  );
end;
$$;

-- Dependent activity data first. Use only columns that exist on each table at runtime.
select pg_temp._delete_non_keep_app_rows('public', 'scores', array['email', 'player_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'shot_logs', array['email', 'player_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'program_scores', array['email', 'player_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'program_drill_attempts', array['email', 'player_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'event_attendance', array['email', 'player_email', 'user_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'player_development_profiles', array['email', 'player_email', 'user_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'player_development_records', array['email', 'player_email', 'user_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'app_user_data', array['email', 'player_email', 'user_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'rsvps', array['email', 'player_email', 'user_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'sc_rsvps', array['email', 'player_email', 'user_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'sc_logs', array['email', 'player_email', 'user_email', 'player_id', 'user_id', 'profile_id', 'id']);

-- Roster/team membership and profile data.
select pg_temp._delete_non_keep_app_rows('public', 'team_memberships', array['email', 'user_email', 'player_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'player_profiles', array['email', 'player_email', 'user_email', 'player_id', 'user_id', 'profile_id', 'id']);
select pg_temp._delete_non_keep_app_rows('public', 'players', array['email', 'player_email', 'user_email', 'player_id', 'user_id', 'profile_id', 'id']);

-- Keep AQ as the only coach/profile row where legacy auth profiles are used; remove old coaches/players.
delete from public.legacy_auth_profiles where lower(coalesce(email, '')) not in (select email from _keep_account);
update public.legacy_auth_profiles set role = 'coach' where lower(email) in (select email from _keep_account);

-- SERVICE-ROLE-ONLY SUPABASE AUTH OPTION (manual, not app code):
-- Run only from a secure admin SQL session if your Supabase project permits direct auth.users deletes.
-- Otherwise use the Dashboard path above.
-- delete from auth.users where lower(email) not in (select email from _keep_account);
-- update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where lower(email) in (select email from _keep_account);

commit;

-- Verification queries/checklist: run after commit and after deleting non-AQ Auth users.
select 'remaining_auth_users' as check_name, id, email from auth.users order by lower(email);
select 'aq_auth_user_preserved' as check_name, id, email from auth.users where lower(email) = 'aq@gmail.com';
select 'rick_auth_user_should_be_absent' as check_name, count(*) as remaining from auth.users where lower(email) = 'rick@gmail.com';
select 'remaining_legacy_profiles' as check_name, email, role, team_id from public.legacy_auth_profiles order by lower(email);
select 'remaining_coaches_except_aq_should_be_zero' as check_name, count(*) as remaining from public.legacy_auth_profiles where role = 'coach' and lower(email) <> 'aq@gmail.com';
select 'remaining_players_should_be_zero' as check_name, count(*) as remaining from public.players where coalesce(role, 'player') <> 'coach';
select 'remaining_player_profiles_should_be_zero' as check_name, count(*) as remaining from public.player_profiles;
select 'remaining_roster_rows' as check_name, email, team_id, role from public.team_memberships order by lower(email);
select 'remaining_scores' as check_name, count(*) from public.scores;
select 'remaining_shot_logs' as check_name, count(*) from public.shot_logs;
select 'remaining_program_scores' as check_name, count(*) from public.program_scores;
select 'aq_coach_preserved' as check_name, email, role from public.legacy_auth_profiles where lower(email) = 'aq@gmail.com';

-- Final manual verification:
-- 1. Supabase Dashboard -> Authentication -> Users shows only AQ@gmail.com.
-- 2. AQ@gmail.com still has a matching coach profile/team record in app data.
-- 3. Rick@gmail.com is absent from Authentication -> Users.
-- 4. A new player can register with a previously used email after its Auth user is deleted.
-- 5. Coach roster is empty until new players register with the coach code.
--
-- Recovery if AQ@gmail.com was accidentally deleted from Supabase Auth:
-- 1. Recreate AQ@gmail.com manually in Supabase Auth or through the Coach create-account flow.
-- 2. Ensure the recreated AQ@gmail.com account is a coach, not a player.
-- 3. Ensure the app has a matching coach profile/team record, then generate or reuse the team code.
-- 4. Use a different player email for player registration testing.
