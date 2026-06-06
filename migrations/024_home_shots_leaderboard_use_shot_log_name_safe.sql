-- Prefer submitted shot log names in Home Shots leaderboard without mixing bigint/timestamptz ordering types.

create or replace function public.get_team_home_shots_leaderboard(
  p_team_id text,
  p_requester_user_id text,
  p_limit integer default 10,
  p_scope text default 'players'
)
returns table(
  rank integer,
  player_display_name text,
  total_home_shots bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 10), 10));
  v_scope text := lower(trim(coalesce(p_scope, 'players')));
  v_team_id text := nullif(trim(coalesce(p_team_id, '')), '');
  v_requester_user_id text := trim(coalesce(p_requester_user_id, ''));
  v_requester_user_uuid text := trim(coalesce(public.resolve_app_user_uuid(v_requester_user_id)::text, ''));
begin
  if v_team_id is null then
    raise exception 'TEAM_ID_REQUIRED';
  end if;

  if v_requester_user_id = '' then
    raise exception 'REQUESTER_REQUIRED';
  end if;

  if v_scope not in ('players', 'coaches', 'all') then
    raise exception 'SCOPE_INVALID';
  end if;

  if not exists (
    select 1
    from team_memberships tm
    where coalesce(nullif(to_jsonb(tm)->>'team_id', ''), nullif(to_jsonb(tm)->>'teamId', '')) = v_team_id
      and (
        coalesce(nullif(to_jsonb(tm)->>'user_id', ''), nullif(to_jsonb(tm)->>'userId', '')) = v_requester_user_id
        or (
          v_requester_user_uuid <> ''
          and coalesce(nullif(to_jsonb(tm)->>'user_id', ''), nullif(to_jsonb(tm)->>'userId', '')) = v_requester_user_uuid
        )
      )
      and lower(coalesce(to_jsonb(tm)->>'status', '')) = 'active'
  ) then
    raise exception 'NOT_AUTHORIZED_FOR_TEAM';
  end if;

  return query
  with totals as (
    select
      t.team_id,
      t.player_id,
      t.total_home_shots
    from team_player_home_shot_totals t
    where t.team_id = v_team_id
      and t.total_home_shots > 0
  ),
  profiles as (
    select to_jsonb(p) as rec
    from players p
  ),
  latest_shot_names as (
    select distinct on (sl.team_id, sl.player_id)
      sl.team_id,
      sl.player_id,
      nullif(trim(coalesce(sl.name, '')), '') as submitted_name
    from shot_logs sl
    where sl.team_id = v_team_id
      and nullif(trim(coalesce(sl.name, '')), '') is not null
    order by
      sl.team_id,
      sl.player_id,
      coalesce(
        sl.ts,
        case
          when coalesce(sl.date, '') ~ '^\d{4}-\d{2}-\d{2}$'
          then (extract(epoch from sl.date::date)::bigint * 1000)
          else 0
        end
      ) desc,
      sl.id desc
  ),
  enriched as (
    select
      totals.player_id,
      totals.total_home_shots,
      profiles.rec as profile,
      lower(coalesce(nullif(profiles.rec->>'role', ''), 'player')) as profile_role,
      coalesce(
        case when coalesce(profiles.rec->>'hideFromLeaderboards', '') in ('true', 'false') then (profiles.rec->>'hideFromLeaderboards')::boolean else null end,
        case when coalesce(profiles.rec->>'hide_from_leaderboards', '') in ('true', 'false') then (profiles.rec->>'hide_from_leaderboards')::boolean else null end,
        false
      ) as is_hidden,
      coalesce(
        nullif(trim(coalesce(profiles.rec->>'name', '')), ''),
        latest_shot_names.submitted_name,
        nullif(trim(coalesce(profiles.rec->>'email', '')), ''),
        case
          when strpos(totals.player_id, '@') > 1 then split_part(totals.player_id, '@', 1)
          else null
        end,
        'Player'
      ) as player_display_name
    from totals
    left join profiles
      on coalesce(nullif(profiles.rec->>'team_id', ''), nullif(profiles.rec->>'teamId', '')) = totals.team_id
      and totals.player_id in (
        coalesce(nullif(profiles.rec->>'email', ''), '__no_match__'),
        coalesce(nullif(profiles.rec->>'player_id', ''), '__no_match__'),
        coalesce(nullif(profiles.rec->>'playerId', ''), '__no_match__'),
        coalesce(nullif(profiles.rec->>'id', ''), '__no_match__'),
        coalesce(nullif(profiles.rec->>'user_id', ''), '__no_match__')
      )
    left join latest_shot_names
      on latest_shot_names.team_id = totals.team_id
      and latest_shot_names.player_id = totals.player_id
  ),
  filtered as (
    select e.player_id, e.player_display_name, e.total_home_shots
    from enriched e
    where e.is_hidden = false
      and (
        v_scope = 'all'
        or (v_scope = 'players' and (e.profile is null or e.profile_role <> 'coach'))
        or (v_scope = 'coaches' and e.profile is not null and e.profile_role = 'coach')
      )
  ),
  ranked as (
    select
      row_number() over (
        order by filtered.total_home_shots desc, filtered.player_display_name asc, filtered.player_id asc
      )::integer as rank,
      filtered.player_display_name,
      filtered.total_home_shots
    from filtered
  )
  select ranked.rank, ranked.player_display_name, ranked.total_home_shots
  from ranked
  order by ranked.rank
  limit v_limit;
end;
$$;

grant execute on function public.get_team_home_shots_leaderboard(text, text, integer, text)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
