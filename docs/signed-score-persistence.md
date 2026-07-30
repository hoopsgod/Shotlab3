# ShotLab Signed Score Persistence

## Objective

Move the `scores` table behind ShotLab's authenticated Cloudflare API boundary and remove direct browser access.

## Authorization model

- Coaches and players may read score rows only for teams they can access.
- Only a player may create or update that player's own score row.
- A coach session cannot create score rows.
- Existing score IDs cannot be claimed by another player or moved to another team.
- The API exposes explicit deletion for a player's own scores and for a coach deleting one player's scores inside a writable team.

Identity is resolved through the signed session stack introduced in PR 1276:

1. legacy HttpOnly session cookie;
2. verified Supabase bearer token;
3. official demo identity on the approved demo host;
4. development-only identity header on local or test hosts.

Production email headers are not identity proof.

## Browser integration

The existing `supabase.from("scores")` adapter call is intercepted before a direct Supabase REST URL is built:

- score reads call `GET /v1/scores`;
- score upserts call `POST /v1/scores`;
- all other persistence tables retain their current behavior.

This keeps the current app flow stable without rewriting `App.jsx`.

## Database lockdown

Migration `041_scores_signed_api_boundary.sql`:

- removes the public `Allow all` policy;
- removes the older anon/authenticated score policies that validated only field shape;
- revokes all table privileges from `PUBLIC`, `anon`, and `authenticated`;
- retains explicit service-role read/write/delete access;
- leaves RLS enabled with no browser-facing policy.

## Current deletion boundary

The API and browser service expose authorized score deletion, but the existing account and coach cleanup screens still perform local collection cleanup. Direct UI invocation of the deletion endpoint is a separate follow-up slice. This phase must not be represented as complete server-side account deletion for every data table.

## Deployment order

1. Pass the Signed Score Persistence workflow and full product regression matrix.
2. Apply migration `041_scores_signed_api_boundary.sql` to production Supabase.
3. Verify no public, anon, or authenticated score grants or policies remain.
4. Verify service-role access and RLS remain enabled.
5. Confirm the Supabase advisor no longer reports the permissive `scores` policy.
6. Merge only after database verification.

## Rollback

Rollback requires restoring the prior browser policies and grants before reverting the client adapter. Do not restore the old `Allow all` policy as a permanent fix. A safer rollback is to restore only the specific score policies required by a confirmed production flow while the signed API issue is corrected.