-- Allow app-authenticated players using the public client to persist Program/Home score rows.
-- The app writes scores through PostgREST with the anon/authenticated role, so if RLS is
-- enabled on public.scores the table needs explicit INSERT/UPDATE/SELECT policies.
do $$
begin
  if to_regclass('public.scores') is null then
    return;
  end if;

  grant select, insert, update on table public.scores to anon, authenticated;

  alter table public.scores enable row level security;

  drop policy if exists scores_client_select_team_rows on public.scores;
  create policy scores_client_select_team_rows
    on public.scores
    for select
    to anon, authenticated
    using (coalesce(trim(team_id), '') <> '');

  drop policy if exists scores_client_insert_player_rows on public.scores;
  create policy scores_client_insert_player_rows
    on public.scores
    for insert
    to anon, authenticated
    with check (
      coalesce(trim(id), '') <> ''
      and coalesce(trim(email), '') <> ''
      and coalesce(trim(player_id), '') <> ''
      and coalesce(trim(team_id), '') <> ''
      and coalesce(nullif(trim(src), ''), 'home') in ('home', 'program')
    );

  drop policy if exists scores_client_update_player_rows on public.scores;
  create policy scores_client_update_player_rows
    on public.scores
    for update
    to anon, authenticated
    using (
      coalesce(trim(id), '') <> ''
      and coalesce(trim(email), '') <> ''
      and coalesce(trim(player_id), '') <> ''
      and coalesce(trim(team_id), '') <> ''
    )
    with check (
      coalesce(trim(id), '') <> ''
      and coalesce(trim(email), '') <> ''
      and coalesce(trim(player_id), '') <> ''
      and coalesce(trim(team_id), '') <> ''
      and coalesce(nullif(trim(src), ''), 'home') in ('home', 'program')
    );
end $$;

notify pgrst, 'reload schema';
