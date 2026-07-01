-- DESTRUCTIVE ADMIN-ONLY TEST RESET SCRIPT
-- Manual execution only. Take a verified database backup before running.
-- Goal: keep AQ@gmail.com as the only coach account and remove stale test users/player data.
-- This script intentionally does NOT run from the app. Review table/column names for your live schema first.
-- Supabase Auth note: auth.users deletion may require the Supabase Auth Admin UI or a service-role script.
-- If SQL deletion from auth.users is blocked by permissions/policies, delete all non-AQ users in the Auth panel after this cleanup.

begin;

-- Normalize the preserved account once for every statement below.
create temp table _keep_account(email text primary key) on commit drop;
insert into _keep_account(email) values ('aq@gmail.com');

-- Dependent activity data first.
delete from public.scores where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
delete from public.shot_logs where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
delete from public.program_scores where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);

-- Optional/legacy activity tables. Uncomment or adjust if these tables exist in your project.
-- delete from public.program_drill_attempts where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
-- delete from public.event_attendance where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);

delete from public.rsvps where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
delete from public.sc_rsvps where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
delete from public.sc_logs where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);

-- Roster/team membership and player development/profile data.
delete from public.team_memberships where lower(coalesce(email, user_email, player_email, '')) not in (select email from _keep_account);
delete from public.player_profiles where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);
delete from public.players where lower(coalesce(email, player_email, '')) not in (select email from _keep_account);

-- Keep AQ as the only coach/profile row where legacy auth profiles are used.
delete from public.legacy_auth_profiles where lower(coalesce(email, '')) not in (select email from _keep_account);
update public.legacy_auth_profiles set role = 'coach' where lower(email) in (select email from _keep_account);

-- Supabase auth.users often requires elevated privileges. Run manually with service role only if allowed.
-- delete from auth.users where lower(email) not in (select email from _keep_account);
-- update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where lower(email) in (select email from _keep_account);

commit;

-- Verification queries: run after commit.
select 'remaining_auth_users' as check_name, id, email from auth.users order by email;
select 'remaining_legacy_profiles' as check_name, email, role, team_id from public.legacy_auth_profiles order by email;
select 'remaining_players' as check_name, email, role, team_id, roster_status from public.players order by email;
select 'remaining_player_profiles' as check_name, email, team_id from public.player_profiles order by email;
select 'remaining_team_memberships' as check_name, email, team_id, role from public.team_memberships order by email;
select 'remaining_scores' as check_name, count(*) from public.scores;
select 'remaining_shot_logs' as check_name, count(*) from public.shot_logs;
select 'remaining_program_scores' as check_name, count(*) from public.program_scores;
select 'aq_coach_preserved' as check_name, email, role from public.legacy_auth_profiles where lower(email) = 'aq@gmail.com';
