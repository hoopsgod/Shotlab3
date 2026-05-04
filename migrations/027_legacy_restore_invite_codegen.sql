create or replace function public.ensure_team_invite_code_for_legacy_restore(
  p_team_id text,
  p_requester_email text
)
returns table(invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id text := nullif(trim(p_team_id), '');
  v_email text := lower(nullif(trim(p_requester_email), ''));
  v_code text;
  v_norm text;
  v_hash text;
  v_now timestamptz := now();
  v_user_uuid uuid;
  v_created_by_type text;
  v_created_by_nullable boolean := true;
  v_sql text;
begin
  if v_team_id is null then
    raise exception 'TEAM_ID_REQUIRED';
  end if;

  select ti.plaintext_code into v_code
  from public.team_invites ti
  where ti.team_id::text = v_team_id
    and coalesce(ti.state,'active') = 'active'
    and (ti.expires_at is null or ti.expires_at > v_now)
    and coalesce(ti.use_count,0) < coalesce(ti.max_uses, 2147483647)
    and ti.plaintext_code is not null
    and length(trim(ti.plaintext_code)) >= 6
  order by ti.created_at desc nulls last
  limit 1;

  if v_code is not null then
    return query select public.normalize_invite_code(v_code);
    return;
  end if;

  v_code := public.random_invite_code(8);
  v_norm := public.normalize_invite_code(v_code);
  v_hash := public.hash_invite_code(v_norm);

  select c.data_type, (c.is_nullable = 'YES')
  into v_created_by_type, v_created_by_nullable
  from information_schema.columns c
  where c.table_schema='public' and c.table_name='team_invites' and c.column_name='created_by';

  if v_created_by_type = 'uuid' and v_email is not null then
    begin
      v_user_uuid := public.resolve_app_user_uuid(v_email);
    exception when others then
      v_user_uuid := null;
    end;
  end if;

  if v_created_by_type is null then
    insert into public.team_invites(team_id, code_hash, code_last4, state, expires_at, max_uses, use_count, plaintext_code)
    values (v_team_id::text, v_hash, right(v_norm,4), 'active', v_now + interval '30 days', 250, 0, v_norm);
  elsif v_created_by_type = 'uuid' then
    if v_user_uuid is null and not v_created_by_nullable then
      insert into public.team_invites(team_id, code_hash, code_last4, state, expires_at, max_uses, use_count, plaintext_code)
      values (v_team_id::text, v_hash, right(v_norm,4), 'active', v_now + interval '30 days', 250, 0, v_norm);
    else
      insert into public.team_invites(team_id, code_hash, code_last4, state, expires_at, max_uses, use_count, created_by, plaintext_code)
      values (v_team_id::text, v_hash, right(v_norm,4), 'active', v_now + interval '30 days', 250, 0, v_user_uuid, v_norm);
    end if;
  else
    insert into public.team_invites(team_id, code_hash, code_last4, state, expires_at, max_uses, use_count, created_by, plaintext_code)
    values (v_team_id::text, v_hash, right(v_norm,4), 'active', v_now + interval '30 days', 250, 0, coalesce(v_email, 'legacy-restore'), v_norm);
  end if;

  return query select v_norm;
end;
$$;

grant execute on function public.ensure_team_invite_code_for_legacy_restore(text, text) to service_role;
