create extension if not exists pgcrypto;

create table if not exists public.active_seasons (
  id uuid primary key default gen_random_uuid(),
  team_id text not null,
  name text not null,
  start_date date not null,
  projected_end_date date,
  source_archive_id text not null references public.season_archives(id) on update restrict on delete restrict,
  lifecycle_status text not null default 'active' check (lifecycle_status in ('active', 'completed')),
  reusable_structure jsonb not null default '{}'::jsonb check (jsonb_typeof(reusable_structure) = 'object'),
  created_at timestamptz not null default now(),
  created_by_user_id uuid not null,
  completed_at timestamptz,
  constraint active_seasons_valid_range check (projected_end_date is null or start_date <= projected_end_date)
);

create unique index if not exists active_seasons_one_active_per_team
  on public.active_seasons(team_id)
  where lifecycle_status = 'active';

create unique index if not exists active_seasons_team_name_unique
  on public.active_seasons(team_id, lower(trim(name)));

create index if not exists active_seasons_team_created_idx
  on public.active_seasons(team_id, created_at desc);

create table if not exists public.season_player_memberships (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.active_seasons(id) on update restrict on delete restrict,
  team_id text not null,
  player_identity text not null,
  user_id uuid,
  profile_id text,
  player_id text,
  email text,
  display_name text not null default 'Player',
  membership_status text not null default 'active' check (membership_status in ('active', 'inactive')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(season_id, player_identity)
);

create index if not exists season_player_memberships_team_season_idx
  on public.season_player_memberships(team_id, season_id);

create table if not exists public.season_rollovers (
  transition_id text primary key,
  team_id text not null,
  source_archive_id text not null references public.season_archives(id) on update restrict on delete restrict,
  season_id uuid not null references public.active_seasons(id) on update restrict on delete restrict,
  created_at timestamptz not null default now(),
  created_by_user_id uuid not null,
  request_plan jsonb not null check (jsonb_typeof(request_plan) = 'object')
);

alter table public.active_seasons enable row level security;
alter table public.season_player_memberships enable row level security;
alter table public.season_rollovers enable row level security;

revoke all on table public.active_seasons from public, anon;
revoke all on table public.season_player_memberships from public, anon;
revoke all on table public.season_rollovers from public, anon;
grant select on table public.active_seasons to authenticated;
grant select on table public.season_player_memberships to authenticated;
grant select on table public.season_rollovers to authenticated;

create or replace function public.is_active_team_coach(p_team_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_memberships tm
    where tm.team_id::text = p_team_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
      and tm.role in ('coach', 'assistant_coach')
  );
$$;

revoke all on function public.is_active_team_coach(text) from public;
grant execute on function public.is_active_team_coach(text) to authenticated;

drop policy if exists active_seasons_coach_select on public.active_seasons;
create policy active_seasons_coach_select on public.active_seasons
  for select to authenticated
  using (public.is_active_team_coach(team_id));

drop policy if exists season_player_memberships_coach_select on public.season_player_memberships;
create policy season_player_memberships_coach_select on public.season_player_memberships
  for select to authenticated
  using (public.is_active_team_coach(team_id));

drop policy if exists season_rollovers_coach_select on public.season_rollovers;
create policy season_rollovers_coach_select on public.season_rollovers
  for select to authenticated
  using (public.is_active_team_coach(team_id));

create or replace function public.start_new_season(p_plan jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id text := trim(coalesce(p_plan #>> '{activeSeason,teamId}', ''));
  v_transition_id text := trim(coalesce(p_plan ->> 'transitionId', ''));
  v_source_archive_id text := trim(coalesce(p_plan #>> '{activeSeason,sourceArchiveId}', ''));
  v_name text := trim(coalesce(p_plan #>> '{activeSeason,name}', ''));
  v_start_date date;
  v_projected_end_date date;
  v_existing public.season_rollovers%rowtype;
  v_season_id uuid;
  v_member jsonb;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;
  if v_team_id = '' or v_transition_id = '' or v_source_archive_id = '' or v_name = '' then
    raise exception 'INVALID_ROLLOVER_PLAN' using errcode = '22023';
  end if;
  if not public.is_active_team_coach(v_team_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  begin
    v_start_date := (p_plan #>> '{activeSeason,startDate}')::date;
    v_projected_end_date := nullif(p_plan #>> '{activeSeason,projectedEndDate}', '')::date;
  exception when others then
    raise exception 'INVALID_SEASON_DATE' using errcode = '22007';
  end;
  if v_projected_end_date is not null and v_start_date > v_projected_end_date then
    raise exception 'INVALID_SEASON_RANGE' using errcode = '22007';
  end if;

  select * into v_existing
  from public.season_rollovers
  where transition_id = v_transition_id;
  if found then
    if v_existing.team_id <> v_team_id then
      raise exception 'TRANSITION_TEAM_MISMATCH' using errcode = '23505';
    end if;
    return jsonb_build_object('ok', true, 'idempotent', true, 'seasonId', v_existing.season_id, 'transitionId', v_transition_id);
  end if;

  if not exists (
    select 1 from public.season_archives sa
    where sa.id = v_source_archive_id and sa.team_id = v_team_id
  ) then
    raise exception 'SOURCE_ARCHIVE_NOT_FOUND' using errcode = '23503';
  end if;

  insert into public.active_seasons (
    team_id, name, start_date, projected_end_date, source_archive_id,
    lifecycle_status, reusable_structure, created_by_user_id
  ) values (
    v_team_id, v_name, v_start_date, v_projected_end_date, v_source_archive_id,
    'active', coalesce(p_plan -> 'reusableStructure', '{}'::jsonb), auth.uid()
  ) returning id into v_season_id;

  for v_member in select value from jsonb_array_elements(coalesce(p_plan -> 'returningMemberships', '[]'::jsonb))
  loop
    if trim(coalesce(v_member ->> 'identity', '')) = '' then
      raise exception 'INVALID_PLAYER_IDENTITY' using errcode = '22023';
    end if;
    insert into public.season_player_memberships (
      season_id, team_id, player_identity, user_id, profile_id, player_id,
      email, display_name, membership_status
    ) values (
      v_season_id,
      v_team_id,
      trim(v_member ->> 'identity'),
      case when coalesce(v_member ->> 'userId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then (v_member ->> 'userId')::uuid else null end,
      nullif(trim(coalesce(v_member ->> 'profileId', '')), ''),
      nullif(trim(coalesce(v_member ->> 'playerId', '')), ''),
      nullif(lower(trim(coalesce(v_member ->> 'email', ''))), ''),
      left(coalesce(nullif(trim(v_member ->> 'name'), ''), 'Player'), 160),
      'active'
    );
  end loop;

  insert into public.season_rollovers (
    transition_id, team_id, source_archive_id, season_id, created_by_user_id, request_plan
  ) values (
    v_transition_id, v_team_id, v_source_archive_id, v_season_id, auth.uid(), p_plan
  );

  return jsonb_build_object('ok', true, 'idempotent', false, 'seasonId', v_season_id, 'transitionId', v_transition_id);
exception
  when unique_violation then
    select * into v_existing from public.season_rollovers where transition_id = v_transition_id;
    if found and v_existing.team_id = v_team_id then
      return jsonb_build_object('ok', true, 'idempotent', true, 'seasonId', v_existing.season_id, 'transitionId', v_transition_id);
    end if;
    raise;
end;
$$;

revoke all on function public.start_new_season(jsonb) from public;
grant execute on function public.start_new_season(jsonb) to authenticated;

notify pgrst, 'reload schema';
