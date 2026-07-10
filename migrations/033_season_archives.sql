create extension if not exists pgcrypto;

create table if not exists public.season_archives (
  id text primary key,
  team_id text not null,
  season_name text not null,
  season_start_date date not null,
  season_end_date date not null,
  created_at timestamptz not null default now(),
  created_by text not null,
  created_by_user_id uuid,
  archive_version integer not null default 2 check (archive_version >= 1),
  snapshot jsonb not null,
  snapshot_hash text not null,
  constraint season_archives_valid_range check (season_start_date <= season_end_date),
  constraint season_archives_snapshot_object check (jsonb_typeof(snapshot) = 'object'),
  constraint season_archives_snapshot_team check (coalesce(snapshot ->> 'teamId', '') = team_id),
  constraint season_archives_snapshot_start check (coalesce(snapshot ->> 'seasonStartDate', '') = season_start_date::text),
  constraint season_archives_snapshot_end check (coalesce(snapshot ->> 'seasonEndDate', '') = season_end_date::text)
);

create unique index if not exists season_archives_team_season_unique
  on public.season_archives (team_id, lower(trim(season_name)), season_start_date, season_end_date);

create index if not exists season_archives_team_created_idx
  on public.season_archives (team_id, created_at desc);

alter table public.season_archives enable row level security;

revoke all on table public.season_archives from public, anon;
grant select, insert on table public.season_archives to authenticated;

create or replace function public.reject_season_archive_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'SEASON_ARCHIVE_IMMUTABLE' using errcode = '55000';
end;
$$;

drop trigger if exists season_archives_immutable_update on public.season_archives;
create trigger season_archives_immutable_update
  before update on public.season_archives
  for each row execute function public.reject_season_archive_mutation();

drop trigger if exists season_archives_immutable_delete on public.season_archives;
create trigger season_archives_immutable_delete
  before delete on public.season_archives
  for each row execute function public.reject_season_archive_mutation();

drop policy if exists season_archives_coach_select on public.season_archives;
create policy season_archives_coach_select
  on public.season_archives
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.team_memberships tm
      where tm.team_id::text = season_archives.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in ('coach', 'assistant_coach')
    )
  );

drop policy if exists season_archives_coach_insert on public.season_archives;
create policy season_archives_coach_insert
  on public.season_archives
  for insert
  to authenticated
  with check (
    created_by_user_id = auth.uid()
    and exists (
      select 1
      from public.team_memberships tm
      where tm.team_id::text = season_archives.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in ('coach', 'assistant_coach')
    )
  );

notify pgrst, 'reload schema';
