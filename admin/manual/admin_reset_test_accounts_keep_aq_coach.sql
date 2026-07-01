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
--   Verify that Rick@gmail.com (and every other old test/player/coach email) no longer appears there.
--
-- If you prefer SQL/service-role cleanup and your environment permits auth.users deletion, run the
-- commented auth.users statements near the bottom with a service-role/admin connection only.
-- Never run Auth deletion from the app or with anon/client credentials.

begin;

-- Normalize the preserved account once for every statement below. AQ@gmail.com, aq@gmail.com, and
-- Aq@Gmail.com all resolve to this same preserved coach identity.
create temp table _keep_account(email text primary key) on commit drop;
insert into _keep_account(email) values ('aq@gmail.com');

-- Dependent activity data first.
delete from public.scores where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
delete from public.shot_logs where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
delete from public.program_scores where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);

-- Optional/legacy dependent tables. Uncomment or adapt if these tables exist in your project schema.
-- delete from public.program_drill_attempts where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
-- delete from public.event_attendance where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
-- delete from public.player_development_profiles where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
-- delete from public.player_development_records where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
-- delete from public.app_user_data where lower(coalesce(email, player_email, user_email, '')) not in (select email from _keep_account);

delete from public.rsvps where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
delete from public.sc_rsvps where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
delete from public.sc_logs where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);

-- Roster/team membership and profile data.
delete from public.team_memberships where lower(coalesce(email, user_email, player_email, '')) not in (select email from _keep_account);
delete from public.player_profiles where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
delete from public.players where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);

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
-- 2. Rick@gmail.com is absent from Authentication -> Users.
-- 3. A new player can register with a previously used email after its Auth user is deleted.
-- 4. Coach roster is empty until new players register with the coach code.
