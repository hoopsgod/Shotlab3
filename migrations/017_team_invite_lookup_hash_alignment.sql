-- Narrow fix for player join-code lookup consistency.
-- Ensures context lookup uses the same DB-side normalization/hash functions as invite creation.

create or replace function public.lookup_team_invite_by_code(
  p_invite_code text
)
returns table(
  normalized_code text,
  lookup_hash_prefix text,
  lookup_count integer,
  team_id text,
  invite_state text,
  expires_at timestamptz
)
language plpgsql
as $$
declare
  v_normalized text;
  v_hash text;
  v_invite record;
begin
  v_normalized := public.normalize_invite_code(p_invite_code);
  if v_normalized = '' then
    return query select ''::text, ''::text, 0::integer, ''::text, ''::text, null::timestamptz;
    return;
  end if;

  v_hash := public.hash_invite_code(v_normalized);

  select i.id, i.team_id::text as team_id, i.state, i.expires_at
    into v_invite
    from public.team_invites i
   where i.code_hash = v_hash
   order by i.created_at desc nulls last
   limit 1;

  if not found then
    return query select v_normalized, left(v_hash, 12), 0::integer, ''::text, ''::text, null::timestamptz;
    return;
  end if;

  return query select v_normalized, left(v_hash, 12), 1::integer, coalesce(v_invite.team_id, ''), coalesce(v_invite.state, ''), v_invite.expires_at;
end;
$$;

drop function if exists public.resolve_team_invite_context(text, text, integer);

create function public.resolve_team_invite_context(
  p_subject_key text,
  p_invite_code text,
  p_session_ttl_seconds integer default 900
)
returns table(join_context_token text, invite_id uuid, team_id text, expires_at timestamptz)
language plpgsql
as $$
declare
  v_normalized text;
  v_hash text;
  v_invite record;
  v_token text;
  v_token_hash text;
  v_now timestamptz := now();
  v_session_expiry timestamptz;
  v_subject text := lower(trim(coalesce(p_subject_key, '')));
  v_invite_sessions_team_id_type text;
begin
  if v_subject = '' then
    raise exception 'SUBJECT_KEY_REQUIRED';
  end if;

  v_normalized := public.normalize_invite_code(p_invite_code);
  if v_normalized = '' then
    raise exception 'INVALID_CODE';
  end if;

  v_hash := public.hash_invite_code(v_normalized);

  select i.id, i.team_id::text as team_id, i.state, i.max_uses, i.use_count, i.expires_at
    into v_invite
    from public.team_invites i
   where i.code_hash = v_hash
   order by i.created_at desc nulls last
   limit 1;

  if not found then
    raise exception 'INVALID_CODE';
  end if;

  if v_invite.state = 'revoked' then
    raise exception 'REVOKED_CODE';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= v_now then
    update public.team_invites
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
  v_token_hash := public.hash_invite_code(v_token);
  v_session_expiry := v_now + make_interval(secs => greatest(coalesce(p_session_ttl_seconds, 900), 120));

  select c.data_type
    into v_invite_sessions_team_id_type
    from information_schema.columns c
   where c.table_schema = 'public'
     and c.table_name = 'invite_join_sessions'
     and c.column_name = 'team_id';

  if coalesce(v_invite_sessions_team_id_type, '') = 'uuid' then
    execute
      'insert into public.invite_join_sessions (token_hash, invite_id, team_id, user_id, subject_key, expires_at)
       values ($1, $2, $3::uuid, $4, $5, $6)'
      using v_token_hash, v_invite.id, v_invite.team_id, null, v_subject, v_session_expiry;
  else
    execute
      'insert into public.invite_join_sessions (token_hash, invite_id, team_id, user_id, subject_key, expires_at)
       values ($1, $2, $3, $4, $5, $6)'
      using v_token_hash, v_invite.id, v_invite.team_id, null, v_subject, v_session_expiry;
  end if;

  return query select v_token, v_invite.id::uuid, v_invite.team_id::text, v_session_expiry;
end;
$$;
