-- In-season performance hub: enrich the signed training catalog and add a
-- server-only normalized game-stat store for CSV/Hudl-style imports.

alter table public.training_drills
  add column if not exists drill_scope text not null default 'individual',
  add column if not exists score_unit text not null default 'points',
  add column if not exists score_direction text not null default 'higher',
  add column if not exists in_season boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.training_drills'::regclass
      and conname = 'training_drills_scope_check'
  ) then
    alter table public.training_drills
      add constraint training_drills_scope_check check (drill_scope in ('individual', 'team'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.training_drills'::regclass
      and conname = 'training_drills_score_direction_check'
  ) then
    alter table public.training_drills
      add constraint training_drills_score_direction_check check (score_direction in ('higher', 'lower'));
  end if;
end $$;

update public.training_drills
set in_season = true
where mode = 'program' and in_season = false;

create table if not exists public.player_game_stats (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  season_id uuid references public.active_seasons(id) on delete set null,
  season_label text not null default 'Current Season' check (char_length(season_label) between 1 and 160),
  import_id text not null check (char_length(import_id) between 1 and 120),
  import_kind text not null check (import_kind in ('season_total', 'game')),
  as_of_date date,
  game_date date,
  opponent text,
  player_id text not null check (char_length(player_id) between 1 and 320),
  player_email text,
  player_name text not null check (char_length(player_name) between 1 and 320),
  stat_key text not null check (char_length(stat_key) between 1 and 80),
  stat_label text not null check (char_length(stat_label) between 1 and 160),
  stat_value numeric not null check (abs(stat_value) <= 1000000000),
  aggregation text not null default 'sum' check (aggregation in ('sum', 'average', 'max', 'min')),
  unit text not null default 'number' check (char_length(unit) between 1 and 40),
  source_provider text not null default 'CSV' check (char_length(source_provider) between 1 and 80),
  source_filename text not null check (char_length(source_filename) between 1 and 240),
  file_sha256 text not null check (char_length(file_sha256) = 64),
  uploaded_by text not null check (char_length(uploaded_by) between 1 and 320),
  imported_at timestamptz not null default now(),
  check (
    (import_kind = 'season_total' and as_of_date is not null)
    or (import_kind = 'game' and game_date is not null)
  )
);

create index if not exists player_game_stats_team_season_metric_idx
  on public.player_game_stats (team_id, season_id, stat_key, imported_at desc);
create index if not exists player_game_stats_team_player_metric_idx
  on public.player_game_stats (team_id, player_id, stat_key, imported_at desc);
create index if not exists player_game_stats_team_import_idx
  on public.player_game_stats (team_id, import_id, imported_at desc);
create index if not exists player_game_stats_team_game_idx
  on public.player_game_stats (team_id, game_date, opponent, player_id);

alter table public.player_game_stats enable row level security;

-- The browser never talks to this table directly. Cloudflare's signed API uses
-- the service role after verifying team membership/coach authority.
revoke all privileges on table public.player_game_stats from public, anon, authenticated;
grant select, insert, update, delete on table public.player_game_stats to service_role;

comment on table public.player_game_stats is
  'Normalized in-season player game statistics imported through signed /v1/game-stats. Browser roles have no direct table privileges.';
comment on column public.player_game_stats.import_kind is
  'season_total keeps versioned snapshots; game keeps one normalized value per player/game/stat key.';
comment on column public.training_drills.drill_scope is
  'Coach-facing in-season classification: individual or team drill context.';

notify pgrst, 'reload schema';
