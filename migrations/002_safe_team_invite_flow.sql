create extension if not exists pgcrypto;

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

create index if not exists idx_team_invites_team_state on team_invites(team_id, state);
create index if not exists idx_team_invites_expires_at on team_invites(expires_at);
create index if not exists idx_invite_join_sessions_user on invite_join_sessions(user_id, expires_at);

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

create or replace function coach_signup_create_team_and_invite(
  p_coach_user_id uuid,
  p_team_name text,
  p_invite_ttl_hours integer default 720,
  p_max_uses integer default null
)
returns table(team_id uuid, invite_id uuid, invite_code text, invite_expires_at timestamptz)
language plpgsql
as $$
declare
  v_team_id uuid;
  v_invite_id uuid;
  v_code text;
  v_normalized text;
  v_hash text;
  v_expires_at timestamptz;
  v_attempt integer := 0;
begin
  if p_coach_user_id is null then
    raise exception 'COACH_USER_ID_REQUIRED';
  end if;

  insert into teams (name, coach_user_id)
  values (coalesce(nullif(trim(p_team_name), ''), 'Team'), p_coach_user_id)
  returning id into v_team_id;

  insert into team_memberships (team_id, user_id, role)
  values (v_team_id, p_coach_user_id, 'coach')
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
      values (v_team_id, v_hash, right(v_normalized, 4), v_expires_at, p_max_uses, p_coach_user_id)
      returning id into v_invite_id;
      exit;
    exception when unique_violation then
      continue;
    end;
  end loop;

  return query select v_team_id, v_invite_id, v_code, v_expires_at;
end;
$$;

create or replace function resolve_team_invite(
  p_user_id uuid,
  p_invite_code text,
  p_session_ttl_seconds integer default 300
)
returns table(join_session_token text, invite_id uuid, team_id uuid, expires_at timestamptz)
language plpgsql
as $$
declare
  v_normalized text;
  v_hash text;
  v_invite team_invites%rowtype;
  v_token text;
  v_token_hash text;
  v_now timestamptz := now();
  v_session_expiry timestamptz;
begin
  if p_user_id is null then
    raise exception 'USER_ID_REQUIRED';
  end if;

  v_normalized := normalize_invite_code(p_invite_code);
  if v_normalized = '' then
    raise exception 'INVALID_CODE';
  end if;

  v_hash := hash_invite_code(v_normalized);

  select * into v_invite from team_invites where code_hash = v_hash;

  if not found then
    raise exception 'INVALID_CODE';
  end if;

  if v_invite.state = 'revoked' then
    raise exception 'REVOKED_CODE';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= v_now then
    update team_invites
      set state = 'expired', updated_at = v_now
      where id = v_invite.id and state = 'active';
    raise exception 'EXPIRED_CODE';
  end if;

  if v_invite.state not in ('active') then
    raise exception 'INVALID_CODE';
  end if;

  if v_invite.max_uses is not null and v_invite.use_count >= v_invite.max_uses then
    raise exception 'INVITE_MAX_USES_REACHED';
  end if;

  v_token := encode(gen_random_bytes(24), 'hex');
  v_token_hash := hash_invite_code(v_token);
  v_session_expiry := v_now + make_interval(secs => greatest(coalesce(p_session_ttl_seconds, 300), 60));

  insert into invite_join_sessions (token_hash, invite_id, team_id, user_id, expires_at)
  values (v_token_hash, v_invite.id, v_invite.team_id, p_user_id, v_session_expiry);

  return query select v_token, v_invite.id, v_invite.team_id, v_session_expiry;
end;
$$;

create or replace function confirm_team_invite_join(
  p_user_id uuid,
  p_join_session_token text,
  p_client_request_id text default null
)
returns table(membership_id uuid, team_id uuid, invite_id uuid, join_status text)
language plpgsql
as $$
declare
  v_token_hash text;
  v_session invite_join_sessions%rowtype;
  v_invite team_invites%rowtype;
  v_membership_id uuid;
  v_now timestamptz := now();
begin
  if p_user_id is null then
    raise exception 'USER_ID_REQUIRED';
  end if;

  if coalesce(trim(p_join_session_token), '') = '' then
    raise exception 'JOIN_SESSION_TOKEN_REQUIRED';
  end if;

  v_token_hash := hash_invite_code(trim(p_join_session_token));

  select * into v_session
  from invite_join_sessions
  where token_hash = v_token_hash
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'INVALID_OR_EXPIRED_JOIN_SESSION';
  end if;

  if v_session.consumed_at is not null then
    raise exception 'JOIN_SESSION_ALREADY_USED';
  end if;

  if v_session.expires_at <= v_now then
    raise exception 'JOIN_SESSION_EXPIRED';
  end if;

  select * into v_invite
  from team_invites
  where id = v_session.invite_id
  for update;

  if not found then
    raise exception 'INVALID_CODE';
  end if;

  if v_invite.state = 'revoked' then
    raise exception 'REVOKED_CODE';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= v_now then
    update team_invites
      set state = 'expired', updated_at = v_now
      where id = v_invite.id and state = 'active';
    raise exception 'EXPIRED_CODE';
  end if;

  if v_invite.max_uses is not null and v_invite.use_count >= v_invite.max_uses then
    raise exception 'INVITE_MAX_USES_REACHED';
  end if;

  select id into v_membership_id
  from team_memberships
  where team_id = v_session.team_id
    and user_id = p_user_id
  for update;

  if found then
    update invite_join_sessions
      set consumed_at = v_now
      where id = v_session.id;

    return query select v_membership_id, v_session.team_id, v_session.invite_id, 'duplicate_membership'::text;
    return;
  end if;

  insert into team_memberships (team_id, user_id, role)
  values (v_session.team_id, p_user_id, 'player')
  returning id into v_membership_id;

  update team_invites
    set use_count = use_count + 1,
        state = case
          when max_uses is not null and use_count + 1 >= max_uses then 'consumed'
          else state
        end,
        updated_at = v_now
    where id = v_invite.id;

  insert into team_invite_redemptions (invite_id, team_id, user_id, membership_id, client_request_id)
  values (v_session.invite_id, v_session.team_id, p_user_id, v_membership_id, p_client_request_id)
  on conflict (client_request_id) do nothing;

  update invite_join_sessions
    set consumed_at = v_now
    where id = v_session.id;

  return query select v_membership_id, v_session.team_id, v_session.invite_id, 'joined'::text;
end;
$$;
