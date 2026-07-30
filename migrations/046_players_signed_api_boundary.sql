-- Player identity rows drive login restore, roster membership, and leaderboard visibility.
-- Browser roles must use the signed Cloudflare API boundary.

alter table public.players enable row level security;

drop policy if exists "Allow all" on public.players;

revoke all privileges on table public.players from public, anon, authenticated;
grant select, insert, update, delete on table public.players to service_role;

notify pgrst, 'reload schema';
