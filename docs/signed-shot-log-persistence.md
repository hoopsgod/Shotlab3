# ShotLab Signed Shot-Log Persistence

## Objective

Move `shot_logs` reads behind ShotLab's authenticated Cloudflare API, enforce verified identity on the existing home-shot write route, and remove direct browser table access.

## Write boundary

Durable home-shot writes continue through `/v1/home-shots/log`.

The route-specific middleware now requires a verified identity from the signed session stack:

1. legacy HttpOnly session cookie;
2. verified Supabase bearer token;
3. approved demo identity on the ShotLab demo host;
4. development-only identity headers on local or test hosts.

The verified identity must match both the compatibility `x-user-id` header and the submitted player identity before the unchanged write handler runs. The existing handler's membership, roster, repair, validation, and persistence behavior is preserved.

## Read boundary

`GET /v1/shot-logs`:

- returns rows only for teams the requester can read;
- accepts an optional team filter;
- supports both coach and player team access;
- returns no remote rows for demo sessions.

The shared browser adapter intercepts `shot_logs` reads before direct Supabase REST URL construction.

## Duplicate-write removal

The home-shot route already performs the durable service-role upsert. Generic `shot_logs` upserts from the shared persistence adapter are now acknowledged as `dedicated_home_shot_api` and do not perform a second table write.

## Bearer propagation

A same-origin fetch bridge adds current ShotLab identity headers only to `/v1/` requests. It does not modify external Supabase Auth or REST requests. This preserves legacy-cookie sessions while allowing Supabase-auth users to send their bearer token to existing manual API calls without rewriting `App.jsx`.

## Database lockdown

Migration `042_shot_logs_signed_api_boundary.sql`:

- removes the public `Allow all` policy;
- revokes all table privileges from `PUBLIC`, `anon`, and `authenticated`;
- retains explicit service-role read, insert, update, and delete access;
- keeps RLS enabled with no browser-facing policy.

## Scope boundaries

This phase does not:

- change home-shot calculations or leaderboard logic;
- modify the player logging UI;
- wire server-side account or coach cleanup deletion for shot logs;
- change `scores`, `program_scores`, events, RSVPs, teams, players, or profiles;
- resolve the remaining permissive core-table policies.

## Deployment order

1. Pass the Signed Shot-Log Persistence workflow and full product regression matrix.
2. Apply migration `042_shot_logs_signed_api_boundary.sql` to production Supabase.
3. Verify RLS remains enabled and all 104 existing rows are preserved.
4. Verify no public, anon, or authenticated policies or table grants remain.
5. Verify service-role access remains.
6. Confirm the permissive `shot_logs` advisor warning is gone.
7. Merge only after database verification.

## Rollback

Rollback requires restoring a narrowly scoped browser access path before reverting the adapter. Do not restore the old public `Allow all` policy as a permanent fix. The preferred rollback is to correct the signed API while keeping direct browser writes disabled.
