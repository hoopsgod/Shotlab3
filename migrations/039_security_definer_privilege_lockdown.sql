-- Restrict service-mediated SECURITY DEFINER helpers to the Cloudflare
-- service-role boundary. These functions are not public client APIs.
--
-- Intentionally excluded from this migration:
--   * is_active_team_coach(text)
--   * start_new_season(jsonb)
-- Those functions are part of the authenticated season-rollover flow and
-- already deny anonymous execution through migration 035.

revoke execute on function public.resolve_app_user_uuid(text)
  from public, anon, authenticated;
grant execute on function public.resolve_app_user_uuid(text)
  to service_role;

revoke execute on function public.get_team_home_shots_leaderboard(text, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.get_team_home_shots_leaderboard(text, text, integer, text)
  to service_role;

revoke execute on function public.get_team_home_shots_leaderboard(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.get_team_home_shots_leaderboard(uuid, text, integer)
  to service_role;

notify pgrst, 'reload schema';
