-- Scores are now read and written through the authenticated Cloudflare API.
-- Remove all direct browser access, including the older field-shape policies
-- that did not prove player or team ownership.

alter table public.scores enable row level security;

drop policy if exists "Allow all" on public.scores;
drop policy if exists scores_client_insert_player_rows on public.scores;
drop policy if exists scores_client_select_team_rows on public.scores;
drop policy if exists scores_client_update_player_rows on public.scores;

revoke all privileges on table public.scores from public, anon, authenticated;
grant select, insert, update, delete on table public.scores to service_role;

notify pgrst, 'reload schema';