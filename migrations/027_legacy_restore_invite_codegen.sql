create extension if not exists pgcrypto;

drop function if exists public.ensure_team_invite_code_for_legacy_restore(text, text);
create or replace function public.ensure_team_invite_code_for_legacy_restore(
  p_team_id text,
  p_requester_email text
)
returns table(invite_code text)
language plpgsql
security definer
as $fn$
declare
  v_team_id text := trim(coalesce(p_team_id, ''));
  v_email text := lower(trim(coalesce(p_requester_email, '')));
  v_profile record;
  v_user_uuid uuid;
  v_code text;
  v_normalized text;
  v_hash text;
  v_max_uses integer := null;
  v_expires_at timestamptz := now() + make_interval(hours => 720);
  v_attempt integer := 0;
begin
  if v_team_id = '' or v_email = '' then
    raise exception 'INVALID_REQUEST';
  end if;

  select email, role, team_id into v_profile
  from public.legacy_auth_profiles
  where lower(email) = v_email
  limit 1;

  if v_profile.email is null then
    raise exception 'UNAUTHORIZED';
  end if;

  begin
    v_user_uuid := public.resolve_app_user_uuid(v_email);
  exception when others then
    v_user_uuid := null;
  end;

  if not (
    coalesce(v_profile.team_id, '') = v_team_id
    or exists (
      select 1 from public.team_memberships tm
      where tm.team_id = v_team_id
        and coalesce(tm.status, 'active') = 'active'
        and (
          tm.user_id::text = v_email
          or (v_user_uuid is not null and tm.user_id::text = v_user_uuid::text)
        )
    )
  ) then
    raise exception 'FORBIDDEN';
  end if;

  v_attempt := 0;
  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 30 then
      raise exception 'INVITE_CODE_GENERATION_FAILED';
    end if;

    v_code := public.random_invite_code(8);
    v_normalized := public.normalize_invite_code(v_code);
    v_hash := public.hash_invite_code(v_normalized);

    begin
      insert into public.team_invites (team_id, code_hash, code_last4, state, expires_at, max_uses, use_count, created_by)
      values (v_team_id, v_hash, right(v_normalized, 4), 'active', v_expires_at, v_max_uses, 0, v_user_uuid);
      return query select v_code;
      return;
    exception when unique_violation then
      continue;
    end;
  end loop;
end;
$fn$;

grant execute on function public.ensure_team_invite_code_for_legacy_restore(text, text) to service_role;
