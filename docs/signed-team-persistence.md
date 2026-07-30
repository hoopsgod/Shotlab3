# Signed Team Persistence

## Objective

Move `public.teams` behind ShotLab's authenticated Cloudflare API boundary and remove direct browser access to team identity, ownership, and invite codes.

## Authorization model

- Signed users may read only teams they can access through server-authoritative ownership or active membership.
- Players have read-only access to their team.
- Coaches and assistant coaches may update only teams they manage.
- Generic persistence cannot create or delete teams.
- Team creation remains exclusively handled by the existing `/v1/teams/create` workflow.
- Team ID, owner email, owner UUID, and creation timestamp are immutable.
- Coaches may update only team name, join code, school, and level.
- Join-code collisions are rejected.
- Demo teams remain local.

## Browser integration

The fetch bridge intercepts direct Supabase REST calls to `teams` and reroutes them to `/v1/teams`.

Before hydration, cached team rows are reduced to the active team. A successful signed read replaces the cached team collection, preventing stale cross-team records from being merged back into memory.

The API writes only columns that exist in production:

- `id`
- `name`
- `owner_coach_id`
- `join_code`
- `created_at`
- `updated_at`
- `coach_user_id`
- `school`
- `level`

Local branding and other unsupported fields remain local and never reach PostgREST.

## Database lockdown

Migration `047_teams_signed_api_boundary.sql`:

- keeps RLS enabled;
- removes the permissive `Allow all` policy;
- revokes all privileges from `PUBLIC`, `anon`, and `authenticated`;
- retains service-role access;
- preserves all team rows and foreign-key relationships.

## Deployment order

1. Pass the dedicated authorization, team creation, membership, restore, build, and browser workflows.
2. Record the production team row count, owner coverage, join-code uniqueness, and foreign-key baseline.
3. Apply migration `047_teams_signed_api_boundary.sql`.
4. Verify all team rows and foreign keys remain, RLS remains enabled, browser grants and policies are gone, and service-role access remains.
5. Confirm the permissive Security Advisor warning for `teams` is gone.
6. Merge only after database verification.

## Scope boundaries

This phase does not change the create-team route, membership confirmation, invite redemption, team deletion, branding UI, or season rollover behavior. It closes the last permissive core-table policy.
