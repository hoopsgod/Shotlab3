-- Safer schema-aware repair for coach signup/invite flow.
-- Idempotent, non-destructive, and explicit about function signature replacement.

create extension if not exists pgcrypto;

-- Ensure teams exists first (beginner-safe default: text id).
create table if not exists public.teams (
  id text primary key,
  name text not null,
  coach_user_id uuid,
  school text,
  level text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.teams add column if not exists name text;
alter table public.teams add column if not exists coach_user_id uuid;
alter table public.teams add column if not exists school text;
alter table public.teams add column if not exists level text;
alter table public.teams add column if not exists created_at timestamptz default now();
alter table public.teams add column if not exists updated_at timestamptz default now();

do $$
declare
  v_team_id_type text;
  v_has_bad_uuid_values boolean;
  v_has_duplicates boolean;
begin
  select c.data_type
    into v_team_id_type
    from information_schema.columns c
   where c.table_schema='public' and c.table_name='teams' and c.column_name='id';

  if v_team_id_type not in ('text','uuid') then
    raise exception 'SCHEMA_TYPE_MISMATCH_TEAMS_ID';
  end if;

  -- Ensure teams.id can be referenced by FK (PK or unique required).
  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.teams'::regclass
      and contype in ('p','u')
      and conkey = array[(select attnum from pg_attribute where attrelid='public.teams'::regclass and attname='id')]
  ) then
    select exists (
      select 1 from public.teams group by id having count(*) > 1
    ) into v_has_duplicates;

    if v_has_duplicates then
      raise exception 'SCHEMA_TYPE_MISMATCH_TEAMS_ID';
    end if;

    execute 'create unique index if not exists idx_teams_id_unique on public.teams(id)';
  end if;

  -- Create team_memberships if missing using teams.id type.
  if not exists (
    select 1 from information_schema.tables where table_schema='public' and table_name='team_memberships'
  ) then
    execute format(
      'create table public.team_memberships (
        id uuid primary key default gen_random_uuid(),
        team_id %s not null,
        user_id uuid not null,
        role text not null check (role in (''coach'', ''player'', ''assistant_coach'')),
        status text not null default ''active'' check (status in (''active'', ''inactive'')),
        joined_at timestamptz not null default now(),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        unique (team_id, user_id)
      )',
      v_team_id_type
    );
  end if;

  -- Ensure required columns exist on team_memberships.
  execute 'alter table public.team_memberships add column if not exists id uuid default gen_random_uuid()';
  execute format('alter table public.team_memberships add column if not exists team_id %s', v_team_id_type);
  execute 'alter table public.team_memberships add column if not exists user_id uuid';
  execute 'alter table public.team_memberships add column if not exists role text default ''player''';
  execute 'alter table public.team_memberships add column if not exists status text default ''active''';
  execute 'alter table public.team_memberships add column if not exists joined_at timestamptz default now()';
  execute 'alter table public.team_memberships add column if not exists created_at timestamptz default now()';
  execute 'alter table public.team_memberships add column if not exists updated_at timestamptz default now()';

  -- Align team_memberships.team_id type to teams.id type.
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='team_memberships' and column_name='team_id' and data_type <> v_team_id_type
  ) then
    if v_team_id_type = 'uuid' then
      select exists (
        select 1 from public.team_memberships
        where nullif(team_id::text, '') is not null
          and team_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      ) into v_has_bad_uuid_values;

      if v_has_bad_uuid_values then
        raise exception 'SCHEMA_TYPE_MISMATCH_TEAMS_ID';
      end if;

      execute 'alter table public.team_memberships alter column team_id type uuid using nullif(team_id::text, '''')::uuid';
    else
      execute 'alter table public.team_memberships alter column team_id type text using team_id::text';
    end if;
  end if;

  -- Create team_invites if missing using teams.id type.
  if not exists (
    select 1 from information_schema.tables where table_schema='public' and table_name='team_invites'
  ) then
    execute format(
      'create table public.team_invites (
        id uuid primary key default gen_random_uuid(),
        team_id %s not null,
        code_hash text not null unique,
        code_last4 text not null,
        issued_to_role text not null default ''player'' check (issued_to_role in (''player'', ''assistant_coach'')),
        state text not null default ''active'' check (state in (''active'', ''revoked'', ''expired'', ''consumed'')),
        max_uses integer,
        use_count integer not null default 0,
        expires_at timestamptz,
        revoked_at timestamptz,
        revoked_by uuid,
        created_by uuid not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )',
      v_team_id_type
    );
  end if;

  -- Ensure required columns exist on team_invites.
  execute 'alter table public.team_invites add column if not exists id uuid default gen_random_uuid()';
  execute format('alter table public.team_invites add column if not exists team_id %s', v_team_id_type);
  execute 'alter table public.team_invites add column if not exists code_hash text';
  execute 'alter table public.team_invites add column if not exists code_last4 text';
  execute 'alter table public.team_invites add column if not exists issued_to_role text default ''player''';
  execute 'alter table public.team_invites add column if not exists state text default ''active''';
  execute 'alter table public.team_invites add column if not exists max_uses integer';
  execute 'alter table public.team_invites add column if not exists use_count integer default 0';
  execute 'alter table public.team_invites add column if not exists expires_at timestamptz';
  execute 'alter table public.team_invites add column if not exists revoked_at timestamptz';
  execute 'alter table public.team_invites add column if not exists revoked_by uuid';
  execute 'alter table public.team_invites add column if not exists created_by uuid';
  execute 'alter table public.team_invites add column if not exists created_at timestamptz default now()';
  execute 'alter table public.team_invites add column if not exists updated_at timestamptz default now()';

  -- Align team_invites.team_id type to teams.id type.
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='team_invites' and column_name='team_id' and data_type <> v_team_id_type
  ) then
    if v_team_id_type = 'uuid' then
      select exists (
        select 1 from public.team_invites
        where nullif(team_id::text, '') is not null
          and team_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      ) into v_has_bad_uuid_values;

      if v_has_bad_uuid_values then
        raise exception 'SCHEMA_TYPE_MISMATCH_TEAMS_ID';
      end if;

      execute 'alter table public.team_invites alter column team_id type uuid using nullif(team_id::text, '''')::uuid';
    else
      execute 'alter table public.team_invites alter column team_id type text using team_id::text';
    end if;
  end if;

  -- Recreate FK constraints to ensure compatibility with teams.id type.
  if exists (
    select 1 from pg_constraint where conname='team_memberships_team_id_fkey' and conrelid='public.team_memberships'::regclass
  ) then
    execute 'alter table public.team_memberships drop constraint team_memberships_team_id_fkey';
  end if;

  if exists (
    select 1 from pg_constraint where conname='team_invites_team_id_fkey' and conrelid='public.team_invites'::regclass
  ) then
    execute 'alter table public.team_invites drop constraint team_invites_team_id_fkey';
  end if;

  execute 'alter table public.team_memberships add constraint team_memberships_team_id_fkey foreign key (team_id) references public.teams(id) on delete cascade';
  execute 'alter table public.team_invites add constraint team_invites_team_id_fkey foreign key (team_id) references public.teams(id) on delete cascade';

  -- Helpful indexes.
  execute 'create unique index if not exists idx_team_invites_code_hash_unique on public.team_invites(code_hash)';
  execute 'create index if not exists idx_team_invites_team_state on public.team_invites(team_id, state)';
  execute 'create index if not exists idx_team_invites_expires_at on public.team_invites(expires_at)';
end;
$$;

-- Helper functions required by coach signup flow.
create or replace function public.normalize_invite_code(raw_code text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(trim(coalesce(raw_code, '')), '[-\s]+', '', 'g'))
$$;

create or replace function public.hash_invite_code(normalized_code text)
returns text
language sql
stable
as $$
  select encode(
    digest(normalized_code || ':' || coalesce(current_setting('app.invite_pepper', true), ''), 'sha256'),
    'hex'
  )
$$;

create or replace function public.random_invite_code(length integer default 8)
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  output text := '';
  p_length integer := coalesce(length, 8);
  i integer;
begin
  if p_length < 6 then p_length := 6; end if;
  for i in 1..p_length loop
    output := output || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return output;
end;
$$;

create or replace function public.resolve_app_user_uuid(p_identifier text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_identifier text;
  v_hash text;
begin
  v_identifier := trim(coalesce(p_identifier, ''));
  if v_identifier = '' then
    raise exception 'COACH_USER_ID_REQUIRED';
  end if;

  begin
    return v_identifier::uuid;
  exception when invalid_text_representation then
    null;
  end;

  v_identifier := lower(v_identifier);
  if position('@' in v_identifier) = 0 then
    raise exception 'COACH_USER_NOT_FOUND';
  end if;

  v_hash := md5('shotlab-email-user:' || v_identifier);
  return (
    substr(v_hash, 1, 8) || '-' || substr(v_hash, 9, 4) || '-' || substr(v_hash, 13, 4) || '-' || substr(v_hash, 17, 4) || '-' || substr(v_hash, 21, 12)
  )::uuid;
end;
$$;

-- Explicitly drop old signatures so CREATE OR REPLACE does not fail on return-type mismatch.
drop function if exists public.coach_signup_create_team_and_invite(text, text, integer, integer);
drop function if exists public.coach_signup_create_team_and_invite(uuid, text, integer, integer);

do $$
declare
  v_team_id_type text;
begin
  select c.data_type
    into v_team_id_type
    from information_schema.columns c
   where c.table_schema='public' and c.table_name='teams' and c.column_name='id';

  if v_team_id_type = 'text' then
    execute $fn$
      create function public.coach_signup_create_team_and_invite(
        p_coach_user_id text,
        p_team_name text,
        p_invite_ttl_hours integer default 720,
        p_max_uses integer default null
      )
      returns table(team_id text, invite_id uuid, invite_code text, invite_expires_at timestamptz)
      language plpgsql
      as $$
      declare
        v_coach_user_uuid uuid;
        v_team_id text;
        v_invite_id uuid;
        v_code text;
        v_normalized text;
        v_hash text;
        v_expires_at timestamptz;
        v_attempt integer := 0;
      begin
        v_coach_user_uuid := public.resolve_app_user_uuid(p_coach_user_id);
        v_team_id := 'team_' || replace(gen_random_uuid()::text, '-', '');

        insert into public.teams (id, name, coach_user_id)
        values (v_team_id, coalesce(nullif(trim(p_team_name), ''), 'Team'), v_coach_user_uuid);

        insert into public.team_memberships (team_id, user_id, role)
        values (v_team_id, v_coach_user_uuid, 'coach')
        on conflict (team_id, user_id) do nothing;

        v_expires_at := case when p_invite_ttl_hours is null then null else now() + make_interval(hours => p_invite_ttl_hours) end;

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
      $$
    $fn$;
  else
    execute $fn$
      create function public.coach_signup_create_team_and_invite(
        p_coach_user_id text,
        p_team_name text,
        p_invite_ttl_hours integer default 720,
        p_max_uses integer default null
      )
      returns table(team_id text, invite_id uuid, invite_code text, invite_expires_at timestamptz)
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
        v_coach_user_uuid := public.resolve_app_user_uuid(p_coach_user_id);

        insert into public.teams (name, coach_user_id)
        values (coalesce(nullif(trim(p_team_name), ''), 'Team'), v_coach_user_uuid)
        returning id into v_team_id;

        insert into public.team_memberships (team_id, user_id, role)
        values (v_team_id, v_coach_user_uuid, 'coach')
        on conflict (team_id, user_id) do nothing;

        v_expires_at := case when p_invite_ttl_hours is null then null else now() + make_interval(hours => p_invite_ttl_hours) end;

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

        return query select v_team_id::text, v_invite_id, v_code, v_expires_at;
      end;
      $$
    $fn$;
  end if;
end;
$$;
