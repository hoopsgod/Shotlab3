# Signed Player Identity Persistence

## Objective

Move `public.players` behind ShotLab's authenticated Cloudflare API boundary and remove direct browser access to login-restoration, roster-membership, role, and leaderboard-visibility records.

## Authorization model

- Every signed user may read and update only their own identity row.
- A user may create an unassigned self row during registration.
- A user may assign their own row to a team only after server-authoritative team access exists.
- Existing roles are immutable through generic persistence.
- Coaches and assistant coaches may read players from teams they manage.
- Coaches may update player-role rows currently attached to a managed team.
- Coaches may detach a player from their team by setting `team_id` to null.
- Coaches may not move a player directly to another team or mutate another coach identity.
- Profile IDs and normalized emails cannot be claimed by a different identity.
- Omitting the requester's own row during an authoritative replacement deletes only that requester's `players` row; it does not delete Supabase Auth or legacy-auth accounts.
- Demo identities remain local.

## Browser integration

The fetch bridge intercepts only direct Supabase REST calls to `players` and reroutes them to `/v1/players`.

Before hydration, cached player rows are reduced to:

- the signed-in player's own row; or
- the coach's own row plus the active-team roster.

A successful signed read replaces the cached player collection, preventing stale cross-team identities from being merged back into memory.

## Database compatibility

The API writes only columns that exist in production:

- `id`
- `email`
- `name`
- `role`
- `team_id`
- `hide_from_leaderboards`
- `created_at`

Unsupported generic fields such as `updated_at`, removal audit metadata, or local password fields remain local and are never sent to PostgREST.

## Database lockdown

Migration `046_players_signed_api_boundary.sql`:

- keeps RLS enabled;
- removes the permissive `Allow all` policy;
- revokes all privileges from `PUBLIC`, `anon`, and `authenticated`;
- retains service-role access;
- preserves existing rows.

## Deployment order

1. Pass the dedicated identity, registration, roster-removal, build, and browser workflows.
2. Record production row count, role counts, and normalized-email uniqueness.
3. Apply migration `046_players_signed_api_boundary.sql`.
4. Verify every row remains, RLS remains enabled, browser grants and policies are gone, and service-role access remains.
5. Confirm the permissive Security Advisor warning for `players` is gone.
6. Merge only after database verification.

## Scope boundaries

This phase does not lock down `teams`, delete authentication accounts, alter team creation or membership confirmation APIs, or redesign roster UI. Team persistence is the next separate phase.
