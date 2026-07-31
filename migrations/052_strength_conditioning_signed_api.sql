-- Persist Strength & Conditioning schedules, player commitments, and activity
-- logs across devices. Browser access remains behind the signed Cloudflare API.

create table if not exists public.sc_sessions (
  team_id text not null references public.teams(id) on delete cascade,
  id text not null,
  sport text not null check (char_length(sport) between 1 and 320),
  date text,
  time text,
  session_type text,
  owner_coach_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, id)
);

create table if not exists public.sc_rsvps (
  team_id text not null,
  session_id text not null,
  player_id text not null,
  email text not null,
  name text,
  ts bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, session_id, player_id),
  foreign key (team_id, session_id)
    references public.sc_sessions(team_id, id) on delete cascade
);

create table if not exists public.sc_logs (
  team_id text not null references public.teams(id) on delete cascade,
  id text not null,
  session_id text,
  player_id text not null,
  email text not null,
  name text,
  date text,
  time text,
  place text,
  sport text,
  ts bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, id)
);

create index if not exists sc_sessions_team_date_idx
  on public.sc_sessions (team_id, date, time);
create index if not exists sc_rsvps_team_player_idx
  on public.sc_rsvps (team_id, player_id, session_id);
create index if not exists sc_logs_team_player_date_idx
  on public.sc_logs (team_id, player_id, date);

alter table public.sc_sessions enable row level security;
alter table public.sc_rsvps enable row level security;
alter table public.sc_logs enable row level security;

revoke all privileges on table public.sc_sessions, public.sc_rsvps, public.sc_logs
  from public, anon, authenticated;
grant select, insert, update, delete on table public.sc_sessions, public.sc_rsvps, public.sc_logs
  to service_role;

comment on table public.sc_sessions is
  'Team Strength & Conditioning schedule. Browser roles use the signed /v1/strength-conditioning API.';
comment on table public.sc_rsvps is
  'Player S&C commitments. Player reads and writes are identity-scoped by the signed API.';
comment on table public.sc_logs is
  'Player S&C activity logs. Player reads and writes are identity-scoped by the signed API.';

notify pgrst, 'reload schema';
