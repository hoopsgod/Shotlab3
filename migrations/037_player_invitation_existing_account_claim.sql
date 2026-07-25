create or replace function public.claim_coach_player_invitation(
  p_token_hash text,
  p_password_hash text,
  p_password_salt text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.coach_player_invitations%rowtype;
  v_existing public.legacy_auth_profiles%rowtype;
  v_existing_account boolean := false;
begin
  if coalesce(trim(p_token_hash), '') = '' or coalesce(trim(p_password_hash), '') = '' or coalesce(trim(p_password_salt), '') = '' then
    raise exception 'INVALID_CLAIM_REQUEST' using errcode = '22023';
  end if;

  select * into v_invite
  from public.coach_player_invitations
  where setup_token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'INVITATION_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_invite.status in ('claimed','revoked') then
    raise exception 'INVITATION_NOT_ACTIVE' using errcode = '22023';
  end if;
  if v_invite.setup_expires_at <= now() then
    update public.coach_player_invitations
      set status = 'expired', updated_at = now()
      where id = v_invite.id;
    raise exception 'INVITATION_EXPIRED' using errcode = '22023';
  end if;

  select * into v_existing
  from public.legacy_auth_profiles
  where lower(email) = lower(v_invite.player_email)
  limit 1;

  if found then
    if v_existing.role <> 'player' then
      raise exception 'ACCOUNT_ROLE_CONFLICT' using errcode = '23514';
    end if;
    if v_existing.team_id is not null and v_existing.team_id <> v_invite.team_id then
      raise exception 'ACCOUNT_TEAM_CONFLICT' using errcode = '23514';
    end if;
    v_existing_account := true;
    update public.legacy_auth_profiles
      set team_id = v_invite.team_id,
          name = coalesce(nullif(trim(v_existing.name), ''), v_invite.player_name),
          password_hash = p_password_hash,
          password_salt = p_password_salt,
          updated_at = now()
      where lower(email) = lower(v_invite.player_email);
  else
    insert into public.legacy_auth_profiles (
      email, password_hash, password_salt, name, role, team_id,
      hide_from_leaderboards, created_at, updated_at
    ) values (
      lower(v_invite.player_email), p_password_hash, p_password_salt,
      v_invite.player_name, 'player', v_invite.team_id,
      false, now(), now()
    );
  end if;

  update public.player_profiles
    set user_id = lower(v_invite.player_email),
        team_id = v_invite.team_id,
        invited_email = lower(v_invite.player_email),
        invite_status = 'claimed',
        invite_id = v_invite.id,
        invite_claimed_at = now()
    where id = v_invite.player_profile_id;

  update public.coach_player_invitations
    set status = 'claimed', claimed_at = now(), updated_at = now()
    where id = v_invite.id;

  return jsonb_build_object(
    'ok', true,
    'inviteId', v_invite.id,
    'teamId', v_invite.team_id,
    'playerProfileId', v_invite.player_profile_id,
    'email', lower(v_invite.player_email),
    'name', v_invite.player_name,
    'existingAccount', v_existing_account
  );
end;
$$;

revoke all on function public.claim_coach_player_invitation(text,text,text) from public, anon, authenticated;
grant execute on function public.claim_coach_player_invitation(text,text,text) to service_role;

notify pgrst, 'reload schema';
