create table if not exists team_player_home_shot_totals (
  team_id text not null,
  player_id text not null,
  total_home_shots bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (team_id, player_id)
);

create index if not exists idx_team_player_home_shot_totals_rank
  on team_player_home_shot_totals (team_id, total_home_shots desc, player_id asc);

create or replace function _leaderboard_parse_team_id(payload jsonb)
returns text
language sql
immutable
as $$
  select nullif(coalesce(payload->>'team_id', payload->>'teamId', ''), '')
$$;

create or replace function _leaderboard_parse_player_id(payload jsonb)
returns text
language sql
immutable
as $$
  select nullif(coalesce(payload->>'player_id', payload->>'playerId', payload->>'email', ''), '')
$$;

create or replace function _leaderboard_parse_made(payload jsonb)
returns bigint
language sql
immutable
as $$
  select case
    when coalesce(payload->>'made', '') ~ '^[0-9]+$' then greatest((payload->>'made')::bigint, 0)
    else 0
  end
$$;

create or replace function _leaderboard_apply_home_shot_delta(
  p_team_id text,
  p_player_id text,
  p_delta bigint
)
returns void
language plpgsql
as $$
begin
  if coalesce(trim(p_team_id), '') = '' or coalesce(trim(p_player_id), '') = '' or p_delta = 0 then
    return;
  end if;

  insert into team_player_home_shot_totals (team_id, player_id, total_home_shots, updated_at)
  values (trim(p_team_id), trim(p_player_id), greatest(p_delta, 0), now())
  on conflict (team_id, player_id)
  do update
    set total_home_shots = greatest(team_player_home_shot_totals.total_home_shots + p_delta, 0),
        updated_at = now();

  delete from team_player_home_shot_totals
  where team_id = trim(p_team_id)
    and player_id = trim(p_player_id)
    and total_home_shots <= 0;
end;
$$;

create or replace function trg_team_player_home_shot_totals_sync()
returns trigger
language plpgsql
as $$
declare
  old_payload jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else '{}'::jsonb end;
  new_payload jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else '{}'::jsonb end;
  old_team_id text := _leaderboard_parse_team_id(old_payload);
  old_player_id text := _leaderboard_parse_player_id(old_payload);
  old_made bigint := _leaderboard_parse_made(old_payload);
  new_team_id text := _leaderboard_parse_team_id(new_payload);
  new_player_id text := _leaderboard_parse_player_id(new_payload);
  new_made bigint := _leaderboard_parse_made(new_payload);
begin
  if tg_op in ('UPDATE', 'DELETE') and old_made > 0 then
    perform _leaderboard_apply_home_shot_delta(old_team_id, old_player_id, -old_made);
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new_made > 0 then
    perform _leaderboard_apply_home_shot_delta(new_team_id, new_player_id, new_made);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_team_player_home_shot_totals_sync on shot_logs;
create trigger trg_team_player_home_shot_totals_sync
after insert or update or delete on shot_logs
for each row
execute function trg_team_player_home_shot_totals_sync();

insert into team_player_home_shot_totals (team_id, player_id, total_home_shots, updated_at)
select
  _leaderboard_parse_team_id(rec) as team_id,
  _leaderboard_parse_player_id(rec) as player_id,
  sum(_leaderboard_parse_made(rec)) as total_home_shots,
  now() as updated_at
from (
  select to_jsonb(sl) as rec
  from shot_logs sl
) s
where _leaderboard_parse_team_id(rec) is not null
  and _leaderboard_parse_player_id(rec) is not null
  and _leaderboard_parse_made(rec) > 0
group by 1, 2
on conflict (team_id, player_id)
do update
  set total_home_shots = excluded.total_home_shots,
      updated_at = now();

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
  ranked as (
    select
      row_number() over (
        order by t.total_home_shots desc, ep.player_display_name asc, ep.player_id asc
      )::integer as rank,
      ep.player_display_name,
      t.total_home_shots
    from team_player_home_shot_totals t
    join eligible_players ep on ep.player_id = t.player_id
    where t.team_id = p_team_id::text
      and t.total_home_shots > 0
  )
  select r.rank, r.player_display_name, r.total_home_shots
  from ranked r
  order by r.rank
  limit v_limit;
end;
$$;
