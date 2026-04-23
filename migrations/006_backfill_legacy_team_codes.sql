-- Backfill legacy coach/team codes into team_invites.
-- IMPORTANT: hash_invite_code now requires app.invite_pepper.

create table if not exists team_invite_backfill_runs (
  id bigserial primary key,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  inserted_count integer not null default 0,
  skipped_existing_invite_count integer not null default 0,
  duplicate_code_count integer not null default 0,
  malformed_code_count integer not null default 0,
  note text
);

create table if not exists team_invite_backfill_manual_review (
  id bigserial primary key,
  run_id bigint not null references team_invite_backfill_runs(id) on delete cascade,
  team_id uuid,
  source_table text not null,
  source_column text not null,
  raw_code text,
  normalized_code text,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists team_invite_backfill_audit (
  id bigserial primary key,
  run_id bigint not null references team_invite_backfill_runs(id) on delete cascade,
  team_id uuid not null,
  invite_id uuid not null references team_invites(id) on delete cascade,
  source_table text not null,
  source_column text not null,
  raw_code text,
  normalized_code text not null,
  created_at timestamptz not null default now()
);

create or replace function backfill_legacy_team_codes_to_invites()
returns bigint
language plpgsql
as $$
declare
  v_run_id bigint;
  v_inserted_count integer := 0;
  v_existing_count integer := 0;
  v_duplicate_count integer := 0;
  v_malformed_count integer := 0;
  v_source_sql text;
  rec record;
  v_invite_id uuid;
  v_created_by text;
begin
  insert into team_invite_backfill_runs(note)
  values ('legacy code migration')
  returning id into v_run_id;

  create temporary table if not exists _legacy_team_codes (
    team_id uuid not null,
    source_table text not null,
    source_column text not null,
    raw_code text,
    normalized_code text,
    has_existing_invite boolean not null default false
  ) on commit drop;

  truncate table _legacy_team_codes;

  -- Source 1: teams.join_code
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='teams' and column_name='join_code'
  ) then
    v_source_sql := $q$
      insert into _legacy_team_codes(team_id, source_table, source_column, raw_code, normalized_code)
      select t.id, 'teams', 'join_code', t.join_code::text, normalize_invite_code(t.join_code::text)
      from teams t
      where t.join_code is not null
    $q$;
    execute v_source_sql;
  end if;

  -- Source 2: teams."joinCode"
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='teams' and column_name='joinCode'
  ) then
    v_source_sql := $q$
      insert into _legacy_team_codes(team_id, source_table, source_column, raw_code, normalized_code)
      select t.id, 'teams', 'joinCode', t."joinCode"::text, normalize_invite_code(t."joinCode"::text)
      from teams t
      where t."joinCode" is not null
    $q$;
    execute v_source_sql;
  end if;

  -- Source 3: coach_profiles.team_code linked through teams.coach_user_id
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='coach_profiles'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='coach_profiles' and column_name='team_code'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='coach_profiles' and column_name='user_id'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='teams' and column_name='coach_user_id'
  ) then
    v_source_sql := $q$
      insert into _legacy_team_codes(team_id, source_table, source_column, raw_code, normalized_code)
      select t.id, 'coach_profiles', 'team_code', cp.team_code::text, normalize_invite_code(cp.team_code::text)
      from teams t
      join coach_profiles cp on cp.user_id = t.coach_user_id
      where cp.team_code is not null
    $q$;
    execute v_source_sql;
  end if;

  update _legacy_team_codes l
  set has_existing_invite = exists (
    select 1 from team_invites ti
    where ti.team_id = l.team_id
      and ti.state in ('active','consumed')
  );

  -- Existing invites are left untouched.
  insert into team_invite_backfill_manual_review(run_id, team_id, source_table, source_column, raw_code, normalized_code, reason)
  select v_run_id, l.team_id, l.source_table, l.source_column, l.raw_code, l.normalized_code, 'team_already_has_invite'
  from _legacy_team_codes l
  where l.has_existing_invite;

  get diagnostics v_existing_count = row_count;

  -- Malformed or unusable codes.
  insert into team_invite_backfill_manual_review(run_id, team_id, source_table, source_column, raw_code, normalized_code, reason)
  select v_run_id, l.team_id, l.source_table, l.source_column, l.raw_code, l.normalized_code,
    case
      when l.normalized_code is null or l.normalized_code = '' then 'normalized_code_empty'
      when length(l.normalized_code) < 6 then 'normalized_code_too_short'
      when length(l.normalized_code) > 16 then 'normalized_code_too_long'
      when l.normalized_code !~ '^[A-Z0-9]+$' then 'normalized_code_invalid_chars'
      else 'unknown_malformed'
    end
  from _legacy_team_codes l
  where l.has_existing_invite = false
    and (
      l.normalized_code is null
      or l.normalized_code = ''
      or length(l.normalized_code) < 6
      or length(l.normalized_code) > 16
      or l.normalized_code !~ '^[A-Z0-9]+$'
    );

  get diagnostics v_malformed_count = row_count;

  -- Duplicate normalized codes across teams require manual review.
  with dupes as (
    select normalized_code
    from _legacy_team_codes
    where has_existing_invite = false
      and normalized_code is not null
      and normalized_code <> ''
      and length(normalized_code) between 6 and 16
      and normalized_code ~ '^[A-Z0-9]+$'
    group by normalized_code
    having count(distinct team_id) > 1
  )
  insert into team_invite_backfill_manual_review(run_id, team_id, source_table, source_column, raw_code, normalized_code, reason)
  select v_run_id, l.team_id, l.source_table, l.source_column, l.raw_code, l.normalized_code, 'duplicate_code_multiple_teams'
  from _legacy_team_codes l
  join dupes d on d.normalized_code = l.normalized_code;

  get diagnostics v_duplicate_count = row_count;

  -- Insert safe, unique, normalized legacy codes.
  for rec in
    select distinct on (l.team_id)
      l.team_id, l.source_table, l.source_column, l.raw_code, l.normalized_code
    from _legacy_team_codes l
    where l.has_existing_invite = false
      and l.normalized_code is not null
      and l.normalized_code <> ''
      and length(l.normalized_code) between 6 and 16
      and l.normalized_code ~ '^[A-Z0-9]+$'
      and not exists (
        select 1 from team_invite_backfill_manual_review mr
        where mr.run_id = v_run_id
          and mr.team_id = l.team_id
          and mr.reason in ('duplicate_code_multiple_teams','normalized_code_empty','normalized_code_too_short','normalized_code_too_long','normalized_code_invalid_chars')
      )
    order by l.team_id, l.source_table, l.source_column
  loop
    select coalesce(t.coach_user_id::text, 'migration-backfill')
    into v_created_by
    from teams t
    where t.id = rec.team_id;

    begin
      insert into team_invites (
        team_id,
        code_hash,
        code_last4,
        issued_to_role,
        state,
        max_uses,
        use_count,
        expires_at,
        created_by
      )
      values (
        rec.team_id,
        hash_invite_code(rec.normalized_code),
        right(rec.normalized_code, 4),
        'player',
        'active',
        null,
        0,
        null,
        v_created_by
      )
      returning id into v_invite_id;

      insert into team_invite_backfill_audit(run_id, team_id, invite_id, source_table, source_column, raw_code, normalized_code)
      values (v_run_id, rec.team_id, v_invite_id, rec.source_table, rec.source_column, rec.raw_code, rec.normalized_code);

      v_inserted_count := v_inserted_count + 1;
    exception
      when unique_violation then
        insert into team_invite_backfill_manual_review(run_id, team_id, source_table, source_column, raw_code, normalized_code, reason)
        values (v_run_id, rec.team_id, rec.source_table, rec.source_column, rec.raw_code, rec.normalized_code, 'code_hash_conflict_or_invite_exists');
    end;
  end loop;

  update team_invite_backfill_runs
  set completed_at = now(),
      inserted_count = v_inserted_count,
      skipped_existing_invite_count = v_existing_count,
      duplicate_code_count = v_duplicate_count,
      malformed_code_count = v_malformed_count
  where id = v_run_id;

  return v_run_id;
end;
$$;

-- Execute once during migration.
select backfill_legacy_team_codes_to_invites();
