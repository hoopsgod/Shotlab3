create extension if not exists pgcrypto;

alter table public.team_invites add column if not exists plaintext_code text;

create or replace function public.ensure_team_invite_code_for_legacy_restore(
  p_team_id text,
  p_requester_email text
)
returns table(invite_code text)
language plpgsql
as $fn$
declare
  v_team_id text := nullif(trim(coalesce(p_team_id, '')), '');
  v_requester_email text := lower(trim(coalesce(p_requester_email, '')));
  v_existing_plaintext text;
  v_code text;
  v_normalized text;
  v_hash text;
  v_last4 text;
  v_expires_at timestamptz := now() + interval '30 days';
  v_max_uses integer := 1000;
  v_attempt integer := 0;
  v_created_by_exists boolean := false;
  v_created_by_type text := null;
  v_created_by_nullable text := 'YES';
  v_created_by_uuid uuid;
  v_created_by_text text;
  v_team_coach_uuid uuid;
begin
  if v_team_id is null then raise exception 'TEAM_ID_REQUIRED'; end if;
  if v_requester_email = '' then raise exception 'REQUESTER_EMAIL_REQUIRED'; end if;

  select ti.plaintext_code
    into v_existing_plaintext
  from public.team_invites ti
  where ti.team_id = v_team_id
    and ti.state = 'active'
    and ti.plaintext_code is not null
    and nullif(trim(ti.plaintext_code), '') is not null
    and (ti.expires_at is null or ti.expires_at > now())
  order by ti.created_at desc nulls last
  limit 1;

  if found then
    return query select public.normalize_invite_code(v_existing_plaintext);
    return;
  end if;

  select true, c.data_type, c.is_nullable
    into v_created_by_exists, v_created_by_type, v_created_by_nullable
  from information_schema.columns c
  where c.table_schema='public' and c.table_name='team_invites' and c.column_name='created_by'
  limit 1;

  if coalesce(v_created_by_exists, false) and v_created_by_type = 'uuid' then
    begin
      v_created_by_uuid := public.resolve_app_user_uuid(v_requester_email);
    exception when others then
      v_created_by_uuid := null;
    end;

    if v_created_by_uuid is null then
      select t.coach_user_id into v_team_coach_uuid
      from public.teams t
      where t.id = v_team_id
      limit 1;
      v_created_by_uuid := v_team_coach_uuid;
    end if;

    if v_created_by_uuid is null and coalesce(v_created_by_nullable,'YES') = 'NO' then
      raise exception 'CREATED_BY_REQUIRED';
    end if;
  elsif coalesce(v_created_by_exists, false) and v_created_by_type in ('text','character varying') then
    v_created_by_text := v_requester_email;
  end if;

  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 30 then raise exception 'INVITE_CODE_GENERATION_FAILED'; end if;

    v_code := public.random_invite_code(8);
    v_normalized := public.normalize_invite_code(v_code);
    v_hash := public.hash_invite_code(v_normalized);
    v_last4 := right(v_normalized, 4);

    begin
      if not coalesce(v_created_by_exists, false) then
        insert into public.team_invites (team_id, code_hash, code_last4, plaintext_code, state, expires_at, max_uses, use_count)
        values (v_team_id, v_hash, v_last4, v_normalized, 'active', v_expires_at, v_max_uses, 0);
      elsif v_created_by_type = 'uuid' then
        insert into public.team_invites (team_id, code_hash, code_last4, plaintext_code, state, expires_at, max_uses, use_count, created_by)
        values (v_team_id, v_hash, v_last4, v_normalized, 'active', v_expires_at, v_max_uses, 0, v_created_by_uuid);
      else
        insert into public.team_invites (team_id, code_hash, code_last4, plaintext_code, state, expires_at, max_uses, use_count, created_by)
        values (v_team_id, v_hash, v_last4, v_normalized, 'active', v_expires_at, v_max_uses, 0, v_created_by_text);
      end if;
      return query select v_normalized;
      return;
    exception when unique_violation then
      continue;
    end;
  end loop;
end;
$fn$;
