create or replace function get_team_home_shots_leaderboard(
  p_team_id uuid,
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
begin
  if p_team_id is null then
    raise exception 'TEAM_ID_REQUIRED';
  end if;

  if coalesce(trim(p_requester_user_id), '') = '' then
    raise exception 'REQUESTER_REQUIRED';
  end if;

  if v_scope not in ('players', 'coaches', 'all') then
    raise exception 'SCOPE_INVALID';
  end if;

  if not exists (
    select 1
    from team_memberships tm
    where tm.team_id = p_team_id
      and tm.user_id = trim(p_requester_user_id)
      and tm.status = 'active'
  ) then
    raise exception 'NOT_AUTHORIZED_FOR_TEAM';
  end if;

  return query
  with eligible_participants as (
    select
      coalesce(
        nullif(rec->>'player_id', ''),
        nullif(rec->>'playerId', ''),
        nullif(rec->>'email', '')
      ) as player_id,
      coalesce(
        nullif(trim(coalesce(rec->>'name', rec->>'display_name', rec->>'player_name', '')), ''),
        'Player'
      ) as player_display_name,
      lower(coalesce(nullif(rec->>'role', ''), 'player')) as participant_role,
      coalesce(
        case when coalesce(rec->>'hideFromLeaderboards', '') in ('true', 'false') then (rec->>'hideFromLeaderboards')::boolean else null end,
        case when coalesce(rec->>'hide_from_leaderboards', '') in ('true', 'false') then (rec->>'hide_from_leaderboards')::boolean else null end,
        false
      ) as is_hidden
    from (
      select to_jsonb(p) as rec
      from players p
    ) p
    where coalesce(p.rec->>'team_id', p.rec->>'teamId') = p_team_id::text
  ),
  filtered_participants as (
    select ep.player_id, ep.player_display_name
    from eligible_participants ep
    where ep.is_hidden = false
      and (
        (v_scope = 'players' and ep.participant_role <> 'coach')
        or (v_scope = 'coaches' and ep.participant_role = 'coach')
        or v_scope = 'all'
      )
  ),
  ranked as (
    select
      row_number() over (
        order by t.total_home_shots desc, ep.player_display_name asc, ep.player_id asc
      )::integer as rank,
      ep.player_display_name,
      t.total_home_shots
    from team_player_home_shot_totals t
    join filtered_participants ep on ep.player_id = t.player_id
    where t.team_id = p_team_id::text
      and t.total_home_shots > 0
  )
  select r.rank, r.player_display_name, r.total_home_shots
  from ranked r
  order by r.rank
  limit v_limit;
end;
$$;
