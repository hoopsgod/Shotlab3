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
  v_code text;
  v_normalized text;
  v_hash text;
  v_now timestamptz := now();
  v_has_invite_code_column boolean := false;
  v_has_code_column boolean := false;
  v_has_created_by_column boolean := false;
  v_created_by_udt text := '';
  v_created_by_uuid text := '';
  v_created_by_text text := '';
begin
  if v_team_id is null then
    raise exception 'TEAM_ID_REQUIRED';
  end if;
  if v_email is null then
    raise exception 'REQUESTER_EMAIL_REQUIRED';
  end if;

  select
    exists (select 1 from information_schema.columns where table_schema='public' and table_name='team_invites' and column_name='invite_code'),
    exists (select 1 from information_schema.columns where table_schema='public' and table_name='team_invites' and column_name='code'),
    exists (select 1 from information_schema.columns where table_schema='public' and table_name='team_invites' and column_name='created_by'),
    coalesce((select c.udt_name from information_schema.columns c where c.table_schema='public' and c.table_name='team_invites' and c.column_name='created_by' limit 1), '')
  into v_has_invite_code_column, v_has_code_column, v_has_created_by_column, v_created_by_udt;

  -- always mint a brand-new full code when restoring legacy context.
  loop
    v_code := public.random_invite_code(8);
    v_normalized := public.normalize_invite_code(v_code);
    v_hash := public.hash_invite_code(v_normalized);

    if v_has_created_by_column then
      if v_created_by_udt = 'uuid' then
        begin
          select nullif(trim((public.resolve_app_user_uuid(v_email))::text), '') into v_created_by_uuid;
        exception
          when others then
            v_created_by_uuid := '';
        end;
      else
        v_created_by_text := v_email;
      end if;
    end if;

    begin
      if v_has_created_by_column and v_created_by_udt = 'uuid' and v_created_by_uuid <> '' then
        execute format(
          'insert into public.team_invites (code_hash, code_last4, team_id, state, expires_at, max_uses, use_count, created_by%s%s)
           values ($1, right($2,4), $3, ''active'', $4, $5, 0, $6::uuid%s%s)',
          case when v_has_invite_code_column then ', invite_code' else '' end,
          case when v_has_code_column then ', code' else '' end,
          case when v_has_invite_code_column then ', $2' else '' end,
          case when v_has_code_column then ', $2' else '' end
        )
        using v_hash, v_normalized, v_team_id, v_now + interval '30 days', 500, v_created_by_uuid;
      elsif v_has_created_by_column and v_created_by_udt <> 'uuid' then
        execute format(
          'insert into public.team_invites (code_hash, code_last4, team_id, state, expires_at, max_uses, use_count, created_by%s%s)
           values ($1, right($2,4), $3, ''active'', $4, $5, 0, $6%s%s)',
          case when v_has_invite_code_column then ', invite_code' else '' end,
          case when v_has_code_column then ', code' else '' end,
          case when v_has_invite_code_column then ', $2' else '' end,
          case when v_has_code_column then ', $2' else '' end
        )
        using v_hash, v_normalized, v_team_id, v_now + interval '30 days', 500, v_created_by_text;
      else
        execute format(
          'insert into public.team_invites (code_hash, code_last4, team_id, state, expires_at, max_uses, use_count%s%s)
           values ($1, right($2,4), $3, ''active'', $4, $5, 0%s%s)',
          case when v_has_invite_code_column then ', invite_code' else '' end,
          case when v_has_code_column then ', code' else '' end,
          case when v_has_invite_code_column then ', $2' else '' end,
          case when v_has_code_column then ', $2' else '' end
        )
        using v_hash, v_normalized, v_team_id, v_now + interval '30 days', 500;
      end if;

      return query select v_normalized;
      return;
    exception
      when unique_violation then
        -- retry on hash/code collision
      when others then
        raise;
    end;
  end loop;
end;
$$;

grant execute on function public.ensure_team_invite_code_for_legacy_restore(text, text)
  to anon, authenticated, service_role;
