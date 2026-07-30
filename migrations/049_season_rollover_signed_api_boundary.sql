-- Backward-compatible rollout preparation.
-- Add the service-only signature before the Cloudflare route switches to it.
-- Migration 050 removes the legacy browser-executable signature only after
-- the new route has reached production.

create or replace function public.start_new_season(
  p_plan jsonb,
  p_requester_user_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requester_identifier text := lower(trim(coalesce(p_requester_user_id, '')));
  v_requester_uuid uuid;
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
  if v_requester_identifier = '' then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  v_requester_uuid := public.resolve_app_user_uuid(v_requester_identifier);

  if v_team_id = '' or v_transition_id = '' or v_source_archive_id = '' or v_name = '' then
    raise exception 'INVALID_ROLLOVER_PLAN' using errcode = '22023';
  end if;

  if not (
    exists (
      select 1
      from public.team_memberships tm
      where tm.team_id::text = v_team_id
        and tm.user_id::text in (v_requester_identifier, v_requester_uuid::text)
        and lower(coalesce(tm.status, '')) = 'active'
        and lower(coalesce(tm.role, '')) in ('coach', 'assistant_coach')
    )
    or exists (
      select 1
      from public.legacy_auth_profiles lap
      where lower(trim(coalesce(lap.email, ''))) = v_requester_identifier
        and lap.team_id::text = v_team_id
        and lower(coalesce(lap.role, '')) in ('coach', 'assistant_coach')
    )
    or exists (
      select 1
      from public.teams t
      where t.id::text = v_team_id
        and t.coach_user_id = v_requester_uuid
    )
  ) then
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
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'seasonId', v_existing.season_id,
      'transitionId', v_transition_id
    );
  end if;

  if not exists (
    select 1
    from public.season_archives sa
    where sa.id = v_source_archive_id
      and sa.team_id = v_team_id
  ) then
    raise exception 'SOURCE_ARCHIVE_NOT_FOUND' using errcode = '23503';
  end if;

  insert into public.active_seasons (
    team_id,
    name,
    start_date,
    projected_end_date,
    source_archive_id,
    lifecycle_status,
    reusable_structure,
    created_by_user_id
  ) values (
    v_team_id,
    v_name,
    v_start_date,
    v_projected_end_date,
    v_source_archive_id,
    'active',
    coalesce(p_plan -> 'reusableStructure', '{}'::jsonb),
    v_requester_uuid
  ) returning id into v_season_id;

  for v_member in
    select value
    from jsonb_array_elements(coalesce(p_plan -> 'returningMemberships', '[]'::jsonb))
  loop
    if trim(coalesce(v_member ->> 'identity', '')) = '' then
      raise exception 'INVALID_PLAYER_IDENTITY' using errcode = '22023';
    end if;
    insert into public.season_player_memberships (
      season_id,
      team_id,
      player_identity,
      user_id,
      profile_id,
      player_id,
      email,
      display_name,
      membership_status
    ) values (
      v_season_id,
      v_team_id,
      trim(v_member ->> 'identity'),
      case
        when coalesce(v_member ->> 'userId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          then (v_member ->> 'userId')::uuid
        else null
      end,
      nullif(trim(coalesce(v_member ->> 'profileId', '')), ''),
      nullif(trim(coalesce(v_member ->> 'playerId', '')), ''),
      nullif(lower(trim(coalesce(v_member ->> 'email', ''))), ''),
      left(coalesce(nullif(trim(v_member ->> 'name'), ''), 'Player'), 160),
      'active'
    );
  end loop;

  insert into public.season_rollovers (
    transition_id,
    team_id,
    source_archive_id,
    season_id,
    created_by_user_id,
    request_plan
  ) values (
    v_transition_id,
    v_team_id,
    v_source_archive_id,
    v_season_id,
    v_requester_uuid,
    p_plan
  );

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'seasonId', v_season_id,
    'transitionId', v_transition_id
  );
exception
  when unique_violation then
    select * into v_existing
    from public.season_rollovers
    where transition_id = v_transition_id;
    if found and v_existing.team_id = v_team_id then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'seasonId', v_existing.season_id,
        'transitionId', v_transition_id
      );
    end if;
    raise;
end;
$$;

revoke all on function public.start_new_season(jsonb, text)
  from public, anon, authenticated;
grant execute on function public.start_new_season(jsonb, text)
  to service_role;

notify pgrst, 'reload schema';
