# Team Invite Backfill Runbook

## Preconditions
- `migrations/002_safe_team_invite_flow.sql` and `migrations/003_invite_context_compatibility.sql` applied.
- `migrations/004_security_hardening.sql` applied.
- `app.invite_pepper` is configured to a strong value (>= 16 chars) for `hash_invite_code`.

## Execute backfill
`migrations/006_backfill_legacy_team_codes.sql` runs `select backfill_legacy_team_codes_to_invites();`.

The function:
1. discovers legacy code locations (`teams.join_code`, `teams."joinCode"`, and optional `coach_profiles.team_code`),
2. normalizes values via `normalize_invite_code`,
3. skips teams that already have active/consumed invites,
4. sends malformed/duplicate values to `team_invite_backfill_manual_review`,
5. inserts safe legacy codes into `team_invites`,
6. records inserted mappings into `team_invite_backfill_audit`.

## Verification queries
```sql
-- latest run summary
select *
from team_invite_backfill_runs
order by id desc
limit 1;

-- rows inserted by latest run
select *
from team_invite_backfill_audit
where run_id = (select max(id) from team_invite_backfill_runs)
order by id desc;

-- records requiring manual review
select reason, count(*)
from team_invite_backfill_manual_review
where run_id = (select max(id) from team_invite_backfill_runs)
group by reason
order by count(*) desc;

-- teams still without invite after backfill
select t.id as team_id
from teams t
left join team_invites ti on ti.team_id = t.id and ti.state in ('active','consumed')
where ti.id is null;
```

## Rollback considerations
- Backfill is tracked by run id in `team_invite_backfill_runs`.
- To revert inserted invites for a specific run:
```sql
begin;
  delete from team_invites
  where id in (
    select invite_id
    from team_invite_backfill_audit
    where run_id = :run_id
  );

  delete from team_invite_backfill_audit where run_id = :run_id;
  delete from team_invite_backfill_manual_review where run_id = :run_id;
  delete from team_invite_backfill_runs where id = :run_id;
commit;
```
- Do **not** rollback if invite rows were already used for membership joins; instead revoke and regenerate invites per team.
