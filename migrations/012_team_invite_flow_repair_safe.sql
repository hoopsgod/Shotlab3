-- Safe repair migration for coach signup/team invite flow.
-- Idempotent and non-destructive: creates missing structures/functions only.

create extension if not exists pgcrypto;

-- Ensure teams has coach_user_id used by coach signup flow.
alter table if exists teams
  add column if not exists coach_user_id uuid;

create table if not exists team_memberships (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('coach', 'player', 'assistant_coach')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, user_id)
);

alter table team_memberships add column if not exists role text not null default 'player';
alter table team_memberships add column if not exists status text not null default 'active';
alter table team_memberships add column if not exists joined_at timestamptz not null default now();
alter table team_memberships add column if not exists created_at timestamptz not null default now();
alter table team_memberships add column if not exists updated_at timestamptz not null default now();

create table if not exists team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  code_hash text not null unique,
  code_last4 text not null,
  issued_to_role text not null default 'player' check (issued_to_role in ('player', 'assistant_coach')),
  state text not null default 'active' check (state in ('active', 'revoked', 'expired', 'consumed')),
  max_uses integer,
  use_count integer not null default 0,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table team_invites add column if not exists code_hash text;
alter table team_invites add column if not exists code_last4 text;
alter table team_invites add column if not exists issued_to_role text not null default 'player';
alter table team_invites add column if not exists state text not null default 'active';
alter table team_invites add column if not exists max_uses integer;
alter table team_invites add column if not exists use_count integer not null default 0;
alter table team_invites add column if not exists expires_at timestamptz;
alter table team_invites add column if not exists revoked_at timestamptz;
alter table team_invites add column if not exists revoked_by uuid;
alter table team_invites add column if not exists created_by uuid;
alter table team_invites add column if not exists created_at timestamptz not null default now();
alter table team_invites add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_team_invites_code_hash_unique on team_invites(code_hash);
create index if not exists idx_team_invites_team_state on team_invites(team_id, state);
create index if not exists idx_team_invites_expires_at on team_invites(expires_at);

create table if not exists invite_join_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  invite_id uuid not null references team_invites(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists team_invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references team_invites(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null,
  membership_id uuid not null references team_memberships(id) on delete cascade,
  client_request_id text,
  redeemed_at timestamptz not null default now(),
  unique (invite_id, user_id),
  unique (client_request_id)
);

create or replace function normalize_invite_code(raw_code text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(trim(coalesce(raw_code, '')), '[-\s]+', '', 'g'))
$$;

create or replace function hash_invite_code(normalized_code text)
returns text
language sql
stable
as $$
  select encode(
    digest(
      normalized_code || ':' || coalesce(current_setting('app.invite_pepper', true), ''),
      'sha256'
    ),
    'hex'
  )
$$;

create or replace function random_invite_code(code_length integer default 8)
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  output text := '';
  i integer;
begin
  if code_length < 6 then
    code_length := 6;
  end if;

  for i in 1..code_length loop
    output := output || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;

  return output;
end;
$$;

create or replace function resolve_app_user_uuid(p_identifier text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_identifier text;
  v_hash text;
begin
  v_identifier := trim(coalesce(p_identifier, ''));
  if v_identifier = '' then
    raise exception 'COACH_USER_ID_REQUIRED';
  end if;

  begin
    return v_identifier::uuid;
  exception when invalid_text_representation then
    null;
  end;

  v_identifier := lower(v_identifier);
  if position('@' in v_identifier) = 0 then
    raise exception 'COACH_USER_NOT_FOUND';
  end if;

  v_hash := md5('shotlab-email-user:' || v_identifier);

  return (
    substr(v_hash, 1, 8) || '-' ||
    substr(v_hash, 9, 4) || '-' ||
    substr(v_hash, 13, 4) || '-' ||
    substr(v_hash, 17, 4) || '-' ||
    substr(v_hash, 21, 12)
  )::uuid;
end;
$$;

create or replace function coach_signup_create_team_and_invite(
  p_coach_user_id text,
  p_team_name text,
  p_invite_ttl_hours integer default 720,
  p_max_uses integer default null
)
returns table(team_id uuid, invite_id uuid, invite_code text, invite_expires_at timestamptz)
language plpgsql
as $$
declare
  v_coach_user_uuid uuid;
  v_team_id uuid;
  v_invite_id uuid;
  v_code text;
  v_normalized text;
  v_hash text;
  v_expires_at timestamptz;
  v_attempt integer := 0;
begin
  v_coach_user_uuid := resolve_app_user_uuid(p_coach_user_id);

  insert into teams (name, coach_user_id)
  values (coalesce(nullif(trim(p_team_name), ''), 'Team'), v_coach_user_uuid)
  returning id into v_team_id;

  insert into team_memberships (team_id, user_id, role)
  values (v_team_id, v_coach_user_uuid, 'coach')
  on conflict (team_id, user_id) do nothing;

  v_expires_at := case when p_invite_ttl_hours is null then null else now() + make_interval(hours => p_invite_ttl_hours) end;

  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 30 then
      raise exception 'INVITE_CODE_GENERATION_FAILED';
    end if;

    v_code := random_invite_code(8);
    v_normalized := normalize_invite_code(v_code);
    v_hash := hash_invite_code(v_normalized);

    begin
      insert into team_invites (team_id, code_hash, code_last4, expires_at, max_uses, created_by)
      values (v_team_id, v_hash, right(v_normalized, 4), v_expires_at, p_max_uses, v_coach_user_uuid)
      returning id into v_invite_id;
      exit;
    exception when unique_violation then
      continue;
    end;
  end loop;

  return query select v_team_id, v_invite_id, v_code, v_expires_at;
end;
$$;
