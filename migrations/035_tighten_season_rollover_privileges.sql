-- Keep season rollover writes behind the authenticated security-definer RPC.
-- RLS does not protect TRUNCATE, so authenticated must not retain inherited
-- table privileges beyond SELECT.

revoke all privileges on table public.active_seasons from anon, authenticated;
revoke all privileges on table public.season_player_memberships from anon, authenticated;
revoke all privileges on table public.season_rollovers from anon, authenticated;

grant select on table public.active_seasons to authenticated;
grant select on table public.season_player_memberships to authenticated;
grant select on table public.season_rollovers to authenticated;

-- Supabase roles can retain function execution independently of PUBLIC.
-- Explicitly remove anonymous execution while preserving the authenticated
-- RPC and policy helper paths.
revoke execute on function public.is_active_team_coach(text) from public, anon;
revoke execute on function public.start_new_season(jsonb) from public, anon;

grant execute on function public.is_active_team_coach(text) to authenticated;
grant execute on function public.start_new_season(jsonb) to authenticated;

notify pgrst, 'reload schema';
