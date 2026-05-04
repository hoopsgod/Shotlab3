-- Production-safe join code generation for legacy team context restore.
create or replace function public.ensure_team_invite_code_for_legacy_restore(
  p_team_id text,
  p_requester_email text
)
returns table(join_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id text := nullif(trim(p_team_id), '');
  v_email text := nullif(lower(trim(p_requester_email)), '');
  v_existing_code text;
  v_code text;
  v_normalized text;
  v_hash text;
  v_now timestamptz := now();
  v_has_invite_code_column boolean := false;
  v_has_code_column boolean := false;
begin
  if v_team_id is null then
    raise exception 'TEAM_ID_REQUIRED';
  end if;
  if v_email is null then
    raise exception 'REQUESTER_EMAIL_REQUIRED';
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='team_invites' and column_name='invite_code'
  ), exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='team_invites' and column_name='code'
  ) into v_has_invite_code_column, v_has_code_column;

  -- Preferred lookup in production-safe hashed schema.
  select ti.code_last4
  from public.team_invites ti
  where ti.team_id = v_team_id and ti.state = 'active'
    and (ti.expires_at is null or ti.expires_at > v_now)
    and (ti.max_uses is null or ti.use_count < ti.max_uses)
  order by ti.created_at desc nulls last
  limit 1
  into v_existing_code;

  if v_existing_code is not null then
    return query select v_existing_code;
    return;
  end if;

  loop
    v_code := public.random_invite_code(8);
    v_normalized := public.normalize_invite_code(v_code);
    v_hash := public.hash_invite_code(v_normalized);

    begin
      execute format(
        'insert into public.team_invites (code_hash, code_last4, team_id, state, expires_at, max_uses, use_count, created_by%s%s)
         values ($1, right($2,4), $3, ''active'', $4, $5, 0, $6%s%s)',
        case when v_has_invite_code_column then ', invite_code' else '' end,
        case when v_has_code_column then ', code' else '' end,
        case when v_has_invite_code_column then ', $2' else '' end,
        case when v_has_code_column then ', $2' else '' end
      )
      using v_hash, v_normalized, v_team_id, v_now + interval '30 days', 500, v_email;
      return query select v_normalized;
      return;
    exception
      when unique_violation then
        -- retry on hash collision
      when others then
        raise;
    end;
  end loop;
end;
$$;

grant execute on function public.ensure_team_invite_code_for_legacy_restore(text, text)
  to anon, authenticated, service_role;
