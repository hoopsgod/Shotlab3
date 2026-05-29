create extension if not exists pgcrypto;

create table if not exists public.shot_logs (
  id text primary key default gen_random_uuid()::text,
  email text,
  name text,
  player_id text,
  team_id text,
  drill_id text,
  session_id text,
  made numeric default 0,
  attempted_shots integer,
  date text,
  created_at timestamptz default now(),
  ts timestamptz default now()
);

alter table public.shot_logs
  add column if not exists email text,
  add column if not exists name text,
  add column if not exists player_id text,
  add column if not exists team_id text,
  add column if not exists drill_id text,
  add column if not exists session_id text,
  add column if not exists made numeric default 0,
  add column if not exists attempted_shots integer,
  add column if not exists date text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists ts timestamptz default now();

alter table public.shot_logs
  alter column id drop identity if exists,
  alter column id drop default,
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text,
  alter column made set default 0,
  alter column created_at set default now(),
  alter column ts set default now();

create index if not exists idx_shot_logs_team_id
  on public.shot_logs(team_id);

create index if not exists idx_shot_logs_player_id
  on public.shot_logs(player_id);

create index if not exists idx_shot_logs_session_id
  on public.shot_logs(session_id);

create index if not exists idx_shot_logs_team_player
  on public.shot_logs(team_id, player_id);

select pg_notify('pgrst', 'reload schema');
