-- Persist player-to-player challenges across devices. Browser roles remain
-- behind the signed Cloudflare API so only the two participants can see or
-- mutate a challenge.

create table if not exists public.player_challenges (
  team_id text not null references public.teams(id) on delete cascade,
  id text not null,
  challenger_id text not null,
  challenger_name text not null,
  opponent_id text not null,
  opponent_name text not null,
  drill_id text not null,
  drill_name text not null,
  challenger_score numeric not null check (challenger_score >= 0),
  max_score numeric check (max_score is null or max_score >= 0),
  response_score numeric check (response_score is null or response_score >= 0),
  status text not null default 'pending' check (status in ('pending', 'won', 'tied', 'lost')),
  created_ts bigint not null check (created_ts > 0),
  responded_ts bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, id),
  constraint player_challenges_distinct_players check (challenger_id <> opponent_id),
  constraint player_challenges_score_within_max check (
    max_score is null
    or (challenger_score <= max_score and (response_score is null or response_score <= max_score))
  ),
  constraint player_challenges_resolution_shape check (
    (status = 'pending' and response_score is null and responded_ts is null)
    or
    (status in ('won', 'tied', 'lost') and response_score is not null and responded_ts is not null)
  ),
  constraint player_challenges_result_matches_scores check (
    status = 'pending'
    or (status = 'won' and response_score > challenger_score)
    or (status = 'tied' and response_score = challenger_score)
    or (status = 'lost' and response_score < challenger_score)
  )
);

create index if not exists player_challenges_team_challenger_created_idx
  on public.player_challenges (team_id, challenger_id, created_ts desc);
create index if not exists player_challenges_team_opponent_created_idx
  on public.player_challenges (team_id, opponent_id, created_ts desc);

alter table public.player_challenges enable row level security;

revoke all privileges on table public.player_challenges from public, anon, authenticated;
grant select, insert, update, delete on table public.player_challenges to service_role;

comment on table public.player_challenges is
  'Private player-to-player challenge records. Browser roles use the signed /v1/player-challenges API.';

notify pgrst, 'reload schema';
