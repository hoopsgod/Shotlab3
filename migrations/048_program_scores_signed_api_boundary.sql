-- Program scores now flow through the authenticated Cloudflare API.
-- Preserve server-side audit metadata and remove all direct browser access.

alter table public.program_scores
  add column if not exists recorded_by text,
  add column if not exists recorded_by_role text;

alter table public.program_scores enable row level security;

drop policy if exists program_scores_client_select on public.program_scores;
drop policy if exists program_scores_client_insert on public.program_scores;
drop policy if exists program_scores_client_update on public.program_scores;
drop policy if exists program_scores_client_select_team_rows on public.program_scores;
drop policy if exists program_scores_client_insert_rows on public.program_scores;
drop policy if exists program_scores_client_update_rows on public.program_scores;

revoke all privileges on table public.program_scores from public, anon, authenticated;
grant select, insert, update, delete on table public.program_scores to service_role;

notify pgrst, 'reload schema';
