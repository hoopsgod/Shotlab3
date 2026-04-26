-- Ensure confirm_team_invite_join_from_context inserts user_id using the actual
-- team_memberships.user_id column type (uuid or text), while returning team_id as text.
create or replace function public.confirm_team_invite_join_from_context(
  p_user_id text,
  p_subject_key text,
  p_join_context_token text,
  p_client_request_id text default null
)
returns table(membership_id uuid, team_id text, invite_id uuid, join_status text)
language plpgsql
as $$
declare
  v_token_hash text;
  v_session record;
  v_invite record;
  v_membership_id uuid;
  v_now timestamptz := now();
  v_subject text := lower(trim(coalesce(p_subject_key, '')));
  v_user_id_type text;
  v_team_id_type text;
  v_user_uuid uuid;
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

  select data_type into v_user_id_type
  from information_schema.columns
  where table_schema='public' and table_name='team_memberships' and column_name='user_id'
  limit 1;

  select data_type into v_team_id_type
  from information_schema.columns
  where table_schema='public' and table_name='team_memberships' and column_name='team_id'
  limit 1;

  if v_user_id_type is null then
    raise exception 'TEAM_MEMBERSHIPS_USER_ID_COLUMN_MISSING';
  end if;

  if v_user_id_type = 'uuid' then
    v_user_uuid := trim(p_user_id)::uuid;
  end if;

  v_token_hash := public.hash_invite_code(trim(p_join_context_token));

  select * into v_session
  from public.invite_join_sessions
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
  from public.team_invites
  where id = v_session.invite_id
  for update;

  if not found then
    raise exception 'INVALID_CODE';
  end if;
  if v_invite.state = 'revoked' then
    raise exception 'REVOKED_CODE';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at <= v_now then
    update public.team_invites set state = 'expired', updated_at = v_now where id = v_invite.id and state = 'active';
    raise exception 'EXPIRED_CODE';
  end if;
  if v_invite.max_uses is not null and v_invite.use_count >= v_invite.max_uses then
    raise exception 'INVITE_MAX_USES_REACHED';
  end if;

  if coalesce(v_team_id_type, 'uuid') = 'uuid' then
    execute 'select id from public.team_memberships where team_id = $1::uuid and user_id = $2::uuid for update'
      into v_membership_id
      using (v_session.team_id::text)::uuid, v_user_uuid;
  else
    execute 'select id from public.team_memberships where team_id = $1::text and user_id = $2::text for update'
      into v_membership_id
      using v_session.team_id::text, trim(p_user_id);
  end if;

  if v_membership_id is not null then
    if v_user_id_type = 'uuid' then
      execute 'update public.invite_join_sessions set consumed_at = $1, user_id = $2::uuid where id = $3'
        using v_now, v_user_uuid, v_session.id;
    else
      execute 'update public.invite_join_sessions set consumed_at = $1, user_id = $2::text where id = $3'
        using v_now, trim(p_user_id), v_session.id;
    end if;
    return query select v_membership_id, v_session.team_id::text, v_session.invite_id, 'duplicate_membership'::text;
    return;
  end if;

  if coalesce(v_team_id_type, 'uuid') = 'uuid' and v_user_id_type = 'uuid' then
    execute 'insert into public.team_memberships (team_id, user_id, role, status) values ($1::uuid, $2::uuid, $3::text, ''active'') returning id'
      into v_membership_id
      using (v_session.team_id::text)::uuid, v_user_uuid, 'player';
  elsif coalesce(v_team_id_type, 'uuid') = 'uuid' then
    execute 'insert into public.team_memberships (team_id, user_id, role, status) values ($1::uuid, $2::text, $3::text, ''active'') returning id'
      into v_membership_id
      using (v_session.team_id::text)::uuid, trim(p_user_id), 'player';
  elsif v_user_id_type = 'uuid' then
    execute 'insert into public.team_memberships (team_id, user_id, role, status) values ($1::text, $2::uuid, $3::text, ''active'') returning id'
      into v_membership_id
      using v_session.team_id::text, v_user_uuid, 'player';
  else
    execute 'insert into public.team_memberships (team_id, user_id, role, status) values ($1::text, $2::text, $3::text, ''active'') returning id'
      into v_membership_id
      using v_session.team_id::text, trim(p_user_id), 'player';
  end if;

  update public.team_invites
    set use_count = use_count + 1,
        state = case when max_uses is not null and use_count + 1 >= max_uses then 'consumed' else state end,
        updated_at = v_now
  where id = v_invite.id;

  insert into public.team_invite_redemptions (invite_id, team_id, user_id, membership_id, client_request_id)
  values (
    v_session.invite_id,
    v_session.team_id,
    case when v_user_id_type = 'uuid' then v_user_uuid::text else trim(p_user_id) end,
    v_membership_id,
    p_client_request_id
  )
  on conflict (client_request_id) do nothing;

  if v_user_id_type = 'uuid' then
    execute 'update public.invite_join_sessions set consumed_at = $1, user_id = $2::uuid where id = $3'
      using v_now, v_user_uuid, v_session.id;
  else
    execute 'update public.invite_join_sessions set consumed_at = $1, user_id = $2::text where id = $3'
      using v_now, trim(p_user_id), v_session.id;
  end if;

  return query select v_membership_id, v_session.team_id::text, v_session.invite_id, 'joined'::text;
end;
$$;
