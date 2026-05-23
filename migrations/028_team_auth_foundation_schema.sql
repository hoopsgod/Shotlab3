-- Team/Auth foundation schema for multi-user MVP

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  display_name text,
  role text not null check (role in ('coach', 'player')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete cascade,
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('coach', 'player')),
  status text not null default 'active' check (status in ('active', 'pending', 'disabled')),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table if not exists join_codes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  code text not null unique,
  created_by_user_id uuid not null references users(id) on delete cascade,
  max_uses integer,
  use_count integer not null default 0,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists drills (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  created_by_user_id uuid references users(id) on delete set null,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists coach_priorities (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references teams(id) on delete cascade,
  coach_user_id uuid not null references users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists shot_logs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete set null,
  player_user_id uuid not null references users(id) on delete cascade,
  drill_id uuid references drills(id) on delete set null,
  makes integer not null default 0,
  attempts integer,
  logged_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  context jsonb not null default '{}'::jsonb
);

create table if not exists leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  period_key text not null,
  metric text not null,
  value numeric not null default 0,
  rank integer,
  computed_at timestamptz not null default now(),
  unique(team_id, user_id, period_key, metric)
);
