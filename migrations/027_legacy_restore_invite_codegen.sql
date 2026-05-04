alter table public.team_invites add column if not exists plaintext_code text;

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
  v_team_coach_uuid uuid;
  v_created_by_exists boolean := false;
  v_created_by_type text;
  v_created_by_nullable boolean := true;
  v_has_plaintext boolean := false;
  v_insert_sql text;
begin
  if v_team_id is null then
    raise exception 'TEAM_ID_REQUIRED';
  end if;

  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='team_invites' and column_name='plaintext_code'
  ) into v_has_plaintext;

  if v_has_plaintext then
    execute $q$
      select ti.plaintext_code
      from public.team_invites ti
      where ti.team_id::text = $1
        and coalesce(ti.state,'active') = 'active'
        and (ti.expires_at is null or ti.expires_at > now())
        and coalesce(ti.use_count,0) < coalesce(ti.max_uses, 2147483647)
        and ti.plaintext_code is not null
        and length(trim(ti.plaintext_code)) >= 6
      order by ti.created_at desc nulls last
      limit 1
    $q$ into v_code using v_team_id;
  end if;

  if v_code is not null then
    return query select public.normalize_invite_code(v_code);
    return;
  end if;

  v_code := public.random_invite_code(8);
  v_norm := public.normalize_invite_code(v_code);
  v_hash := public.hash_invite_code(v_norm);

  select true, c.data_type, (c.is_nullable = 'YES')
  into v_created_by_exists, v_created_by_type, v_created_by_nullable
  from information_schema.columns c
  where c.table_schema='public' and c.table_name='team_invites' and c.column_name='created_by';

  if v_created_by_exists and v_created_by_type = 'uuid' then
    if v_email is not null then
      begin
        v_user_uuid := public.resolve_app_user_uuid(v_email);
      exception when others then
        v_user_uuid := null;
      end;
    end if;

    begin
      execute 'select coach_user_id::uuid from public.teams where id::text = $1 limit 1' into v_team_coach_uuid using v_team_id;
    exception when others then
      v_team_coach_uuid := null;
    end;

    if v_user_uuid is null then v_user_uuid := v_team_coach_uuid; end if;

    if v_user_uuid is null and not v_created_by_nullable then
      raise exception 'CREATED_BY_UUID_REQUIRED';
    end if;
  end if;

  if not v_created_by_exists then
    insert into public.team_invites(team_id, code_hash, code_last4, state, expires_at, max_uses, use_count, plaintext_code)
    values (v_team_id::text, v_hash, right(v_norm,4), 'active', v_now + interval '30 days', 250, 0, v_norm);
  elsif v_created_by_type = 'uuid' then
    if v_user_uuid is null then
      insert into public.team_invites(team_id, code_hash, code_last4, state, expires_at, max_uses, use_count, plaintext_code)
      values (v_team_id::text, v_hash, right(v_norm,4), 'active', v_now + interval '30 days', 250, 0, v_norm);
    else
      insert into public.team_invites(team_id, code_hash, code_last4, state, expires_at, max_uses, use_count, created_by, plaintext_code)
      values (v_team_id::text, v_hash, right(v_norm,4), 'active', v_now + interval '30 days', 250, 0, v_user_uuid, v_norm);
    end if;
  elsif v_created_by_type in ('text','character varying') then
    insert into public.team_invites(team_id, code_hash, code_last4, state, expires_at, max_uses, use_count, created_by, plaintext_code)
    values (v_team_id::text, v_hash, right(v_norm,4), 'active', v_now + interval '30 days', 250, 0, coalesce(v_email, 'legacy-restore'), v_norm);
  else
    insert into public.team_invites(team_id, code_hash, code_last4, state, expires_at, max_uses, use_count, plaintext_code)
    values (v_team_id::text, v_hash, right(v_norm,4), 'active', v_now + interval '30 days', 250, 0, v_norm);
  end if;

  return query select v_norm;
end;
$$;

grant execute on function public.ensure_team_invite_code_for_legacy_restore(text, text) to service_role;
