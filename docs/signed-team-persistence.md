# Signed Team Persistence

## Objective

Move `public.teams` behind ShotLab's authenticated Cloudflare API boundary and remove direct browser access to team identity, ownership, invite codes, and coach-managed branding.

## Authorization model

- Signed users may read only teams they can access through server-authoritative ownership or active membership.
- Players have read-only access to their team, including its current branding.
- Coaches and assistant coaches may update only teams they manage.
- Generic persistence cannot create or delete teams.
- Team creation remains exclusively handled by the existing `/v1/teams/create` workflow.
- Team ID, owner email, owner UUID, and creation timestamp are immutable.
- Coaches may update team name, join code, school, level, and sanitized team branding.
- Join-code collisions are rejected.
- Demo teams remain local and isolated from registered-team persistence.

## Browser integration

The fetch bridge intercepts direct Supabase REST calls to `teams` and reroutes them to `/v1/teams`.

Before hydration, cached team rows are reduced to the active team. A successful signed read replaces the cached team collection, preventing stale cross-team records from being merged back into memory. During the branding-persistence rollout, if the server has no branding yet for an existing team, the signed persistence client preserves branding from that same-origin active-team cache so an existing coach customization is not erased before its next save.

The signed API writes only columns that exist in production:

- `id`
- `name`
- `owner_coach_id`
- `join_code`
- `created_at`
- `updated_at`
- `coach_user_id`
- `school`
- `level`
- `branding`

`branding` is a JSON object sanitized by the signed API. It can contain the approved team name, palette colors, text scale, version metadata, and HTTPS/relative/data-image logo sources used by the Coach and Player identity system. Unknown branding keys are discarded. Oversized or unsupported logo sources are rejected rather than silently persisted.

## Database lockdown

Migration `047_teams_signed_api_boundary.sql`:

- keeps RLS enabled;
- removes the permissive `Allow all` policy;
- revokes all privileges from `PUBLIC`, `anon`, and `authenticated`;
- retains service-role access;
- preserves all team rows and foreign-key relationships.

Migration `055_team_branding_signed_persistence.sql` adds the additive `branding jsonb` column behind that already-locked signed API boundary. It does not grant browser access or weaken RLS.

## Deployment order

1. Pass the dedicated authorization, team creation, membership, restore, build, branding, and browser workflows.
2. Record the production team row count, owner coverage, join-code uniqueness, and foreign-key baseline.
3. Apply migration `047_teams_signed_api_boundary.sql` when performing the original table lockdown.
4. Apply migration `055_team_branding_signed_persistence.sql` before deploying the API revision that selects or writes `branding`.
5. Verify all team rows and foreign keys remain, RLS remains enabled, browser grants and policies are gone, and service-role access remains.
6. Verify a registered coach can save a custom logo, reload, and see the same branding on Coach and Player identity surfaces.
7. Merge only after database and runtime verification.

## Scope boundaries

This phase does not change the create-team route, membership confirmation, invite redemption, team deletion, or season rollover behavior. Demo branding remains local. Registered-team branding is now server-authoritative through the signed teams API instead of being browser-only.
