-- Idempotent guard for backend home-shots logging path.
create table if not exists public.shot_logs (
  id text primary key,
  email text,
  name text,
  player_id text,
  team_id text,
  made numeric,
  date text,
  ts bigint
);

alter table public.shot_logs add column if not exists id text;
alter table public.shot_logs add column if not exists email text;
alter table public.shot_logs add column if not exists name text;
alter table public.shot_logs add column if not exists player_id text;
alter table public.shot_logs add column if not exists team_id text;
alter table public.shot_logs add column if not exists made numeric;
alter table public.shot_logs add column if not exists date text;
alter table public.shot_logs add column if not exists ts bigint;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='shot_logs' and column_name='team_id' and data_type <> 'text'
  ) then
    execute 'alter table public.shot_logs alter column team_id type text using team_id::text';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='shot_logs' and column_name='player_id' and data_type <> 'text'
  ) then
    execute 'alter table public.shot_logs alter column player_id type text using player_id::text';
  end if;
end $$;
