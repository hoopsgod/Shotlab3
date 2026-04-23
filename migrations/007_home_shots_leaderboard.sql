create index if not exists idx_shot_logs_team_player
  on shot_logs (((coalesce(to_jsonb(shot_logs)->>'team_id', to_jsonb(shot_logs)->>'teamId', ''))), ((coalesce(to_jsonb(shot_logs)->>'player_id', to_jsonb(shot_logs)->>'playerId', to_jsonb(shot_logs)->>'email', ''))));

create index if not exists idx_players_team_lookup
  on players (((coalesce(to_jsonb(players)->>'team_id', to_jsonb(players)->>'teamId', ''))));

create or replace function get_team_home_shots_leaderboard(
  p_team_id uuid,
  p_requester_user_id text,
  p_limit integer default 10
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
begin
  if p_team_id is null then
    raise exception 'TEAM_ID_REQUIRED';
  end if;

  if coalesce(trim(p_requester_user_id), '') = '' then
    raise exception 'REQUESTER_REQUIRED';
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
  with eligible_players as (
    select
      coalesce(
        nullif(rec->>'player_id', ''),
        nullif(rec->>'playerId', ''),
        nullif(rec->>'email', '')
      ) as player_id,
      coalesce(
        nullif(trim(coalesce(rec->>'name', rec->>'display_name', rec->>'player_name', '')), ''),
        'Player'
      ) as player_display_name
    from (
      select to_jsonb(p) as rec
      from players p
    ) p
    where coalesce(p.rec->>'team_id', p.rec->>'teamId') = p_team_id::text
      and coalesce(p.rec->>'role', 'player') <> 'coach'
      and coalesce(
        case when coalesce(p.rec->>'hideFromLeaderboards', '') in ('true', 'false') then (p.rec->>'hideFromLeaderboards')::boolean else null end,
        case when coalesce(p.rec->>'hide_from_leaderboards', '') in ('true', 'false') then (p.rec->>'hide_from_leaderboards')::boolean else null end,
        false
      ) = false
  ),
  shot_totals as (
    select
      coalesce(
        nullif(rec->>'player_id', ''),
        nullif(rec->>'playerId', ''),
        nullif(rec->>'email', '')
      ) as player_id,
      sum((rec->>'made')::bigint) as total_home_shots
    from (
      select to_jsonb(sl) as rec
      from shot_logs sl
    ) sl
    where coalesce(sl.rec->>'team_id', sl.rec->>'teamId') = p_team_id::text
      and coalesce(sl.rec->>'player_id', sl.rec->>'playerId', sl.rec->>'email') is not null
      and coalesce(sl.rec->>'made', '') ~ '^[0-9]+$'
      and (sl.rec->>'made')::bigint > 0
    group by 1
  ),
  ranked as (
    select
      row_number() over (
        order by st.total_home_shots desc, ep.player_display_name asc, ep.player_id asc
      )::integer as rank,
      ep.player_display_name,
      st.total_home_shots
    from shot_totals st
    join eligible_players ep on ep.player_id = st.player_id
  )
  select r.rank, r.player_display_name, r.total_home_shots
  from ranked r
  order by r.rank
  limit v_limit;
end;
$$;
