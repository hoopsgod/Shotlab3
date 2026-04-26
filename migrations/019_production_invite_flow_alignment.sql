-- Production invite-flow alignment migration (idempotent, non-destructive).
--
-- This migration preserves manual production SQL hotfixes that resolved:
--   1) env_config_mismatch (Cloudflare env config issue; app-side, documented here for context only)
--   2) missing_rpc (RPC/schema visibility + migration drift)
--   3) ambiguous team_id in coach signup RPC conflict handling
--   4) invite_join_sessions.user_id uuid/text mismatch
--   5) consume_team_id_type_mismatch during player join confirmation
--
-- Safety guarantees:
--   - no destructive table drops
--   - no deletes of teams/players/invites/memberships/sessions/shots/stats
--   - create or replace / drop if exists for RPCs
--   - preserves existing production data

create extension if not exists pgcrypto;

-- Align invite-flow team_id columns to text to preserve production team ids like "team_xxxxx".
do $team_id_alignment$
declare
  v_col record;
  v_constraint record;
begin
  for v_col in
    select table_schema, table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and (
        (table_name = 'team_invites' and column_name = 'team_id')
        or (table_name = 'invite_join_sessions' and column_name = 'team_id')
        or (table_name = 'team_invite_redemptions' and column_name = 'team_id')
        or (table_name = 'team_memberships' and column_name = 'team_id')
      )
      and data_type <> 'text'
  loop
    for v_constraint in
      select tc.constraint_name
      from information_schema.table_constraints tc
      join information_schema.constraint_column_usage ccu
        on tc.constraint_schema = ccu.constraint_schema
       and tc.constraint_name = ccu.constraint_name
      where tc.table_schema = v_col.table_schema
        and tc.table_name = v_col.table_name
        and tc.constraint_type = 'FOREIGN KEY'
        and ccu.column_name = v_col.column_name
    loop
      execute format(
        'alter table %I.%I drop constraint if exists %I',
        v_col.table_schema,
        v_col.table_name,
        v_constraint.constraint_name
      );
    end loop;

    execute format(
      'alter table %I.%I alter column %I type text using %I::text',
      v_col.table_schema,
      v_col.table_name,
      v_col.column_name,
      v_col.column_name
    );
  end loop;
end;
$team_id_alignment$;

-- Preserve coach signup flow fix: avoid ambiguous team_id/user_id conflict handling.
drop function if exists public.coach_signup_create_team_and_invite(text, text, integer, integer);
drop function if exists public.coach_signup_create_team_and_invite(uuid, text, integer, integer);

create or replace function public.coach_signup_create_team_and_invite(
  p_coach_user_id text,
  p_team_name text,
  p_invite_ttl_hours integer default 720,
  p_max_uses integer default null
)
returns table(team_id text, invite_id uuid, invite_code text, invite_expires_at timestamptz)
language plpgsql
as $coach_signup$
declare
  v_coach_user_uuid uuid;
  v_team_id text;
  v_invite_id uuid;
  v_code text;
  v_normalized text;
  v_hash text;
  v_expires_at timestamptz;
  v_attempt integer := 0;
  v_membership_user_id_type text;
begin
  v_coach_user_uuid := public.resolve_app_user_uuid(p_coach_user_id);
  v_team_id := 'team_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.teams (id, name, coach_user_id)
  values (v_team_id, coalesce(nullif(trim(p_team_name), ''), 'Team'), v_coach_user_uuid);

  select c.data_type into v_membership_user_id_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'team_memberships'
    and c.column_name = 'user_id'
  limit 1;

  if coalesce(v_membership_user_id_type, 'uuid') = 'uuid' then
    execute
      'insert into public.team_memberships (team_id, user_id, role, status)
       values ($1::text, $2::uuid, ''coach'', ''active'')
       on conflict do nothing'
      using v_team_id, v_coach_user_uuid;
  else
    execute
      'insert into public.team_memberships (team_id, user_id, role, status)
       values ($1::text, $2::text, ''coach'', ''active'')
       on conflict do nothing'
      using v_team_id, v_coach_user_uuid::text;
  end if;

  v_expires_at := case
    when p_invite_ttl_hours is null then null
    else now() + make_interval(hours => p_invite_ttl_hours)
  end;

  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 30 then
      raise exception 'INVITE_CODE_GENERATION_FAILED';
    end if;

    v_code := public.random_invite_code(8);
    v_normalized := public.normalize_invite_code(v_code);
    v_hash := public.hash_invite_code(v_normalized);

    begin
      insert into public.team_invites (team_id, code_hash, code_last4, expires_at, max_uses, created_by)
      values (v_team_id, v_hash, right(v_normalized, 4), v_expires_at, p_max_uses, v_coach_user_uuid)
      returning id into v_invite_id;
      exit;
    exception when unique_violation then
      continue;
    end;
  end loop;

  return query select v_team_id, v_invite_id, v_code, v_expires_at;
end;
$coach_signup$;

-- Preserve join-context fix: make invite_join_sessions.user_id write compatible when uuid/text differs.
drop function if exists public.resolve_team_invite_context(text, text, integer);

create or replace function public.resolve_team_invite_context(
  p_subject_key text,
  p_invite_code text,
  p_session_ttl_seconds integer default 900
)
returns table(join_context_token text, invite_id uuid, team_id text, expires_at timestamptz)
language plpgsql
as $resolve_ctx$
declare
  v_normalized text;
  v_hash text;
  v_invite record;
  v_token text;
  v_token_hash text;
  v_now timestamptz := now();
  v_session_expiry timestamptz;
  v_subject text := lower(trim(coalesce(p_subject_key, '')));
  v_sessions_user_id_type text;
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

  select c.data_type into v_sessions_user_id_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'invite_join_sessions'
    and c.column_name = 'user_id'
  limit 1;

  if coalesce(v_sessions_user_id_type, 'text') = 'uuid' then
    execute
      'insert into public.invite_join_sessions (token_hash, invite_id, team_id, user_id, subject_key, expires_at)
       values ($1, $2, $3::text, null::uuid, $4, $5)'
      using v_token_hash, v_invite.id, v_invite.team_id::text, v_subject, v_session_expiry;
  else
    execute
      'insert into public.invite_join_sessions (token_hash, invite_id, team_id, user_id, subject_key, expires_at)
       values ($1, $2, $3::text, null::text, $4, $5)'
      using v_token_hash, v_invite.id, v_invite.team_id::text, v_subject, v_session_expiry;
  end if;

  return query select v_token, v_invite.id::uuid, v_invite.team_id::text, v_session_expiry;
end;
$resolve_ctx$;

-- Preserve consume_team_id_type_mismatch fix for player join confirmation.
drop function if exists public.confirm_team_invite_join_from_context(text, text, text, text);

create or replace function public.confirm_team_invite_join_from_context(
  p_user_id text,
  p_subject_key text,
  p_join_context_token text,
  p_client_request_id text default null
)
returns table(membership_id uuid, team_id text, invite_id uuid, join_status text)
language plpgsql
as $confirm_ctx$
declare
  v_token_hash text;
  v_session record;
  v_invite record;
  v_membership_id uuid;
  v_now timestamptz := now();
  v_subject text := lower(trim(coalesce(p_subject_key, '')));
  v_user_id_type text;
  v_session_user_id_type text;
  v_redemption_user_id_type text;
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

  select data_type into v_redemption_user_id_type
  from information_schema.columns
  where table_schema='public' and table_name='team_invite_redemptions' and column_name='user_id'
  limit 1;

  select data_type into v_session_user_id_type
  from information_schema.columns
  where table_schema='public' and table_name='invite_join_sessions' and column_name='user_id'
  limit 1;

  if v_user_id_type is null then
    raise exception 'TEAM_MEMBERSHIPS_USER_ID_COLUMN_MISSING';
  end if;

  if v_user_id_type = 'uuid' or coalesce(v_session_user_id_type, 'text') = 'uuid' or coalesce(v_redemption_user_id_type, 'text') = 'uuid' then
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

  if v_user_id_type = 'uuid' then
    execute 'select id from public.team_memberships where team_id = $1::text and user_id = $2::uuid for update'
      into v_membership_id
      using v_session.team_id::text, v_user_uuid;
  else
    execute 'select id from public.team_memberships where team_id = $1::text and user_id = $2::text for update'
      into v_membership_id
      using v_session.team_id::text, trim(p_user_id);
  end if;

  if v_membership_id is not null then
    if coalesce(v_session_user_id_type, 'text') = 'uuid' then
      execute 'update public.invite_join_sessions set consumed_at = $1, user_id = $2::uuid where id = $3'
        using v_now, v_user_uuid, v_session.id;
    else
      execute 'update public.invite_join_sessions set consumed_at = $1, user_id = $2::text where id = $3'
        using v_now, trim(p_user_id), v_session.id;
    end if;

    return query select v_membership_id, v_session.team_id::text, v_session.invite_id, 'duplicate_membership'::text;
    return;
  end if;

  if v_user_id_type = 'uuid' then
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

  if coalesce(v_redemption_user_id_type, 'text') = 'uuid' then
    execute 'insert into public.team_invite_redemptions (invite_id, team_id, user_id, membership_id, client_request_id)
             values ($1, $2::text, $3::uuid, $4, $5)
             on conflict (client_request_id) do nothing'
      using v_session.invite_id, v_session.team_id::text, v_user_uuid, v_membership_id, p_client_request_id;
  else
    execute 'insert into public.team_invite_redemptions (invite_id, team_id, user_id, membership_id, client_request_id)
             values ($1, $2::text, $3::text, $4, $5)
             on conflict (client_request_id) do nothing'
      using v_session.invite_id, v_session.team_id::text, trim(p_user_id), v_membership_id, p_client_request_id;
  end if;

  if coalesce(v_session_user_id_type, 'text') = 'uuid' then
    execute 'update public.invite_join_sessions set consumed_at = $1, user_id = $2::uuid where id = $3'
      using v_now, v_user_uuid, v_session.id;
  else
    execute 'update public.invite_join_sessions set consumed_at = $1, user_id = $2::text where id = $3'
      using v_now, trim(p_user_id), v_session.id;
  end if;

  return query select v_membership_id, v_session.team_id::text, v_session.invite_id, 'joined'::text;
end;
$confirm_ctx$;

-- Preserve missing_rpc fix by ensuring API roles can execute invite RPCs.
grant execute on function public.lookup_team_invite_by_code(text)
  to anon, authenticated, service_role;
grant execute on function public.resolve_app_user_uuid(text)
  to anon, authenticated, service_role;
grant execute on function public.coach_signup_create_team_and_invite(text, text, integer, integer)
  to anon, authenticated, service_role;
grant execute on function public.resolve_team_invite_context(text, text, integer)
  to anon, authenticated, service_role;
grant execute on function public.confirm_team_invite_join_from_context(text, text, text, text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Manual operator verification (comment-only; do not auto-run in migration):
--
-- 1) Verify each required RPC exists (run individually for clarity):
-- select to_regprocedure('public.coach_signup_create_team_and_invite(text, text, integer, integer)') as coach_signup_rpc;
-- select to_regprocedure('public.lookup_team_invite_by_code(text)') as invite_lookup_rpc;
-- select to_regprocedure('public.resolve_team_invite_context(text, text, integer)') as resolve_context_rpc;
-- select to_regprocedure('public.confirm_team_invite_join_from_context(text, text, text, text)') as confirm_context_rpc;
--
-- 2) Verify team_id column types across invite flow tables (and teams.id):
-- select table_name, column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and (
--     (table_name = 'teams' and column_name = 'id') or
--     (table_name = 'team_memberships' and column_name = 'team_id') or
--     (table_name = 'team_invites' and column_name = 'team_id') or
--     (table_name = 'invite_join_sessions' and column_name = 'team_id') or
--     (table_name = 'team_invite_redemptions' and column_name = 'team_id')
--   )
-- order by table_name, column_name;
-- ---------------------------------------------------------------------------

do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception
  when undefined_function then
    notify pgrst, 'reload schema';
end;
$$;
