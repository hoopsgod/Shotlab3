-- Finalize the signed season lifecycle boundary after the updated Cloudflare
-- route is live and verified against the service-only RPC from migration 049.

alter table public.active_seasons enable row level security;
alter table public.season_player_memberships enable row level security;
alter table public.season_rollovers enable row level security;

drop policy if exists active_seasons_coach_select on public.active_seasons;
drop policy if exists season_player_memberships_coach_select on public.season_player_memberships;
drop policy if exists season_rollovers_coach_select on public.season_rollovers;

revoke all privileges on table public.active_seasons
  from public, anon, authenticated;
revoke all privileges on table public.season_player_memberships
  from public, anon, authenticated;
revoke all privileges on table public.season_rollovers
  from public, anon, authenticated;

grant select, insert, update, delete on table public.active_seasons
  to service_role;
grant select, insert, update, delete on table public.season_player_memberships
  to service_role;
grant select, insert, update, delete on table public.season_rollovers
  to service_role;

revoke execute on function public.start_new_season(jsonb)
  from public, anon, authenticated, service_role;
drop function public.start_new_season(jsonb);

revoke execute on function public.is_active_team_coach(text)
  from public, anon, authenticated, service_role;
drop function public.is_active_team_coach(text);

revoke all on function public.start_new_season(jsonb, text)
  from public, anon, authenticated;
grant execute on function public.start_new_season(jsonb, text)
  to service_role;

notify pgrst, 'reload schema';
