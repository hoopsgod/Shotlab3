create extension if not exists pgcrypto;

alter table public.team_invites
  add column if not exists plaintext_code text;

create or replace function public.ensure_team_invite_code_for_legacy_restore(
  p_team_id text,
  p_requester_email text
)
returns table(team_id text, team_name text, join_code text)
language plpgsql
as $$
declare
  v_team_id text := trim(coalesce(p_team_id, ''));
  v_email text := lower(trim(coalesce(p_requester_email, '')));
  v_team record;
  v_invite record;
  v_join_code text;
  v_normalized text;
  v_hash text;
  v_created_by uuid;
begin
  if v_team_id = '' then
    raise exception 'TEAM_ID_REQUIRED';
  end if;

  select t.id::text as id, t.name, t.coach_user_id
    into v_team
    from public.teams t
   where t.id::text = v_team_id
   limit 1;

  if not found then
    raise exception 'TEAM_NOT_FOUND';
  end if;

  select i.id, i.plaintext_code, i.code_hash, i.code_last4
    into v_invite
    from public.team_invites i
   where i.team_id::text = v_team_id
     and i.state = 'active'
     and (i.max_uses is null or i.use_count < i.max_uses)
     and (i.expires_at is null or i.expires_at > now())
     and coalesce(i.plaintext_code, '') <> ''
   order by i.created_at desc nulls last
   limit 1;

  if found then
    return query select v_team.id::text, coalesce(v_team.name, 'Team'), v_invite.plaintext_code::text;
    return;
  end if;

  v_join_code := public.random_invite_code(8);
  v_normalized := public.normalize_invite_code(v_join_code);
  v_hash := public.hash_invite_code(v_normalized);
  v_created_by := public.resolve_app_user_uuid(v_email);

  insert into public.team_invites (
    team_id,
    code_hash,
    code_last4,
    plaintext_code,
    state,
    expires_at,
    max_uses,
    use_count,
    created_by
  )
  values (
    v_team_id,
    v_hash,
    right(v_normalized, 4),
    v_normalized,
    'active',
    now() + make_interval(hours => 24 * 365),
    null,
    0,
    v_created_by
  );

  return query select v_team.id::text, coalesce(v_team.name, 'Team'), v_normalized::text;
end;
$$;

revoke all on function public.ensure_team_invite_code_for_legacy_restore(text, text) from public;
revoke all on function public.ensure_team_invite_code_for_legacy_restore(text, text) from anon;
revoke all on function public.ensure_team_invite_code_for_legacy_restore(text, text) from authenticated;
grant execute on function public.ensure_team_invite_code_for_legacy_restore(text, text) to service_role;

notify pgrst, 'reload schema';
