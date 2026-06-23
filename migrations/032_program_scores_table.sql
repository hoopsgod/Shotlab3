create table if not exists public.program_scores (
  id text primary key,
  created_at timestamptz default now(),
  team_id text not null,
  player_id text not null,
  player_email text not null,
  player_name text,
  drill_id text not null,
  drill_name text not null,
  score numeric not null check (score >= 0),
  session_date text,
  logged_at timestamptz default now(),
  src text default 'program' check (src = 'program')
);

create index if not exists program_scores_team_drill_idx
  on public.program_scores (team_id, drill_id);

create index if not exists program_scores_team_player_idx
  on public.program_scores (team_id, player_id);

create index if not exists program_scores_logged_at_idx
  on public.program_scores (logged_at desc);

alter table public.program_scores enable row level security;

grant select, insert, update on table public.program_scores to anon, authenticated;

drop policy if exists program_scores_client_select on public.program_scores;
create policy program_scores_client_select
  on public.program_scores
  for select
  to anon, authenticated
  using (coalesce(trim(team_id), '') <> '' and src = 'program');

drop policy if exists program_scores_client_insert on public.program_scores;
create policy program_scores_client_insert
  on public.program_scores
  for insert
  to anon, authenticated
  with check (
    coalesce(trim(id), '') <> ''
    and coalesce(trim(team_id), '') <> ''
    and coalesce(trim(player_id), '') <> ''
    and coalesce(trim(player_email), '') <> ''
    and coalesce(trim(drill_id), '') <> ''
    and coalesce(trim(drill_name), '') <> ''
    and score is not null
    and score >= 0
    and src = 'program'
  );

drop policy if exists program_scores_client_update on public.program_scores;
create policy program_scores_client_update
  on public.program_scores
  for update
  to anon, authenticated
  using (
    coalesce(trim(id), '') <> ''
    and coalesce(trim(team_id), '') <> ''
    and coalesce(trim(player_id), '') <> ''
    and coalesce(trim(player_email), '') <> ''
    and coalesce(trim(drill_id), '') <> ''
    and coalesce(trim(drill_name), '') <> ''
    and src = 'program'
  )
  with check (
    coalesce(trim(id), '') <> ''
    and coalesce(trim(team_id), '') <> ''
    and coalesce(trim(player_id), '') <> ''
    and coalesce(trim(player_email), '') <> ''
    and coalesce(trim(drill_id), '') <> ''
    and coalesce(trim(drill_name), '') <> ''
    and score is not null
    and score >= 0
    and src = 'program'
  );

notify pgrst, 'reload schema';
