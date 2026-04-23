alter table team_memberships
  alter column user_id type text using user_id::text;

alter table invite_join_sessions
  alter column user_id drop not null,
  alter column user_id type text using user_id::text,
  add column if not exists subject_key text;

alter table team_invite_redemptions
  alter column user_id type text using user_id::text;

alter table team_invites
  alter column revoked_by type text using revoked_by::text,
  alter column created_by type text using created_by::text;

create index if not exists idx_invite_join_sessions_subject on invite_join_sessions(subject_key, expires_at);

create or replace function resolve_team_invite(
  p_user_id text,
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
  if coalesce(trim(p_user_id), '') = '' then
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

  insert into invite_join_sessions (token_hash, invite_id, team_id, user_id, subject_key, expires_at)
  values (v_token_hash, v_invite.id, v_invite.team_id, trim(p_user_id), null, v_session_expiry);

  return query select v_token, v_invite.id, v_invite.team_id, v_session_expiry;
end;
$$;

create or replace function resolve_team_invite_context(
  p_subject_key text,
  p_invite_code text,
  p_session_ttl_seconds integer default 900
)
returns table(join_context_token text, invite_id uuid, team_id uuid, expires_at timestamptz)
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
  if coalesce(trim(p_subject_key), '') = '' then
    raise exception 'SUBJECT_KEY_REQUIRED';
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
  v_session_expiry := v_now + make_interval(secs => greatest(coalesce(p_session_ttl_seconds, 900), 120));

  insert into invite_join_sessions (token_hash, invite_id, team_id, user_id, subject_key, expires_at)
  values (v_token_hash, v_invite.id, v_invite.team_id, null, lower(trim(p_subject_key)), v_session_expiry);

  return query select v_token, v_invite.id, v_invite.team_id, v_session_expiry;
end;
$$;

create or replace function confirm_team_invite_join_from_context(
  p_user_id text,
  p_subject_key text,
  p_join_context_token text,
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
  v_subject text := lower(trim(coalesce(p_subject_key, '')));
begin
  if coalesce(trim(p_user_id), '') = '' then
    raise exception 'USER_ID_REQUIRED';
  end if;
  if v_subject = '' then
    raise exception 'SUBJECT_KEY_REQUIRED';
  end if;
  if coalesce(trim(p_join_context_token), '') = '' then
    raise exception 'JOIN_CONTEXT_TOKEN_REQUIRED';
  end if;

  v_token_hash := hash_invite_code(trim(p_join_context_token));

  select * into v_session
  from invite_join_sessions
  where token_hash = v_token_hash
    and subject_key = v_subject
  for update;

  if not found then
    raise exception 'INVALID_OR_EXPIRED_JOIN_CONTEXT';
  end if;

  if v_session.consumed_at is not null then
    raise exception 'JOIN_CONTEXT_ALREADY_USED';
  end if;

  if v_session.expires_at <= v_now then
    raise exception 'JOIN_CONTEXT_EXPIRED';
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
    update team_invites set state = 'expired', updated_at = v_now where id = v_invite.id and state = 'active';
    raise exception 'EXPIRED_CODE';
  end if;
  if v_invite.max_uses is not null and v_invite.use_count >= v_invite.max_uses then
    raise exception 'INVITE_MAX_USES_REACHED';
  end if;

  select id into v_membership_id
  from team_memberships
  where team_id = v_session.team_id
    and user_id = trim(p_user_id)
  for update;

  if found then
    update invite_join_sessions
      set consumed_at = v_now,
          user_id = trim(p_user_id)
      where id = v_session.id;

    return query select v_membership_id, v_session.team_id, v_session.invite_id, 'duplicate_membership'::text;
    return;
  end if;

  insert into team_memberships (team_id, user_id, role)
  values (v_session.team_id, trim(p_user_id), 'player')
  returning id into v_membership_id;

  update team_invites
    set use_count = use_count + 1,
        state = case when max_uses is not null and use_count + 1 >= max_uses then 'consumed' else state end,
        updated_at = v_now
  where id = v_invite.id;

  insert into team_invite_redemptions (invite_id, team_id, user_id, membership_id, client_request_id)
  values (v_session.invite_id, v_session.team_id, trim(p_user_id), v_membership_id, p_client_request_id)
  on conflict (client_request_id) do nothing;

  update invite_join_sessions
    set consumed_at = v_now,
        user_id = trim(p_user_id)
  where id = v_session.id;

  return query select v_membership_id, v_session.team_id, v_session.invite_id, 'joined'::text;
end;
$$;
