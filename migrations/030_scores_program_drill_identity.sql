-- Allow Program Log score rows to persist the exact app-selected drill key.
-- Program drills are app-defined identities (for example demo-program-calipari-shooting),
-- so the legacy scores.drill_id column must not require a numeric/UUID foreign key.
do $$
declare
  fk record;
begin
  if to_regclass('public.scores') is null then
    return;
  end if;

  for fk in
    select conname
    from pg_constraint
    where conrelid = 'public.scores'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) ilike '%(drill_id)%'
  loop
    execute format('alter table public.scores drop constraint if exists %I', fk.conname);
  end loop;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scores'
      and column_name = 'drill_id'
  ) then
    alter table public.scores
      alter column drill_id type text using drill_id::text;
  else
    alter table public.scores add column drill_id text;
  end if;

  alter table public.scores add column if not exists src text default 'home';
end $$;

do $$
begin
  if to_regclass('public.scores') is not null
    and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'scores' and column_name = 'team_id'
    ) then
    create index if not exists scores_team_src_drill_idx
      on public.scores (team_id, src, drill_id);
  end if;
end $$;

notify pgrst, 'reload schema';
