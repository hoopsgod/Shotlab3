-- Bridge browser email-based user identifiers to auth UUIDs for coach signup RPC.

create or replace function resolve_app_user_uuid(p_identifier text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_identifier text;
  v_user_id uuid;
begin
  v_identifier := trim(coalesce(p_identifier, ''));
  if v_identifier = '' then
    raise exception 'COACH_USER_ID_REQUIRED';
  end if;

  begin
    v_user_id := v_identifier::uuid;
    return v_user_id;
  exception when invalid_text_representation then
    null;
  end;

  select u.id
    into v_user_id
    from auth.users u
   where lower(u.email) = lower(v_identifier)
     and (u.deleted_at is null)
   limit 1;

  if v_user_id is null then
    raise exception 'COACH_USER_NOT_FOUND';
  end if;

  return v_user_id;
end;
$$;

drop function if exists coach_signup_create_team_and_invite(uuid, text, integer, integer);

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
