-- Player profiles contain roster identity and invitation metadata.
-- Browser roles must use the signed Cloudflare API boundary.

alter table public.player_profiles enable row level security;

drop policy if exists "Allow all" on public.player_profiles;

revoke all privileges on table public.player_profiles from public, anon, authenticated;
grant select, insert, update, delete on table public.player_profiles to service_role;

notify pgrst, 'reload schema';
