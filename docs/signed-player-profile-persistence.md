# Signed Player Profile Persistence

## Objective

Move `public.player_profiles` behind ShotLab's authenticated Cloudflare API boundary and remove direct browser access to roster identity and invitation metadata.

## Authorization model

- Coaches and assistant coaches may read and upsert profiles only for teams they manage.
- Players may read only their own claimed profile.
- Player synchronization ignores cached rows belonging to other players.
- Players may update only their own claimed row.
- Players may not claim an uninvited roster shell through generic persistence.
- Coaches may create unclaimed roster shells but may not reassign an existing claimed identity.
- Existing profile IDs cannot be moved across teams or claimed by another user.
- Demo profiles remain local.

## Browser integration

The fetch bridge intercepts only direct Supabase REST calls to `player_profiles` and reroutes them to `/v1/player-profiles`. Other Supabase Auth and REST requests remain unchanged.

Before hydration, cached profiles are reduced to:

- the signed-in player's own identity; or
- the active team for coaches and assistant coaches.

A successful signed read replaces the cached profile collection, preventing stale cross-player or cross-team records from being merged back into memory.

## Database compatibility

The signed API writes only columns that exist in production:

- `id`
- `user_id`
- `team_id`
- `first_name`
- `last_name`
- `jersey_number`
- `created_at`
- invitation metadata columns

Unsupported generic fields such as `email` and `updated_at` are ignored rather than sent to PostgREST.

## Database lockdown

Migration `045_player_profiles_signed_api_boundary.sql`:

- keeps RLS enabled;
- removes the permissive `Allow all` policy;
- revokes all privileges from `PUBLIC`, `anon`, and `authenticated`;
- retains controlled service-role access;
- preserves all existing rows and foreign-key relationships.

## Deployment order

1. Pass the dedicated authorization, build, invitation, and browser workflows.
2. Record the production row count and invitation/profile relationship baseline.
3. Apply migration `045_player_profiles_signed_api_boundary.sql`.
4. Verify all profile rows are preserved.
5. Verify RLS remains enabled, no browser grants or policies remain, and service-role access remains.
6. Confirm the permissive Security Advisor warning for `player_profiles` is gone.
7. Merge only after production database verification.

## Scope boundaries

This phase does not lock down `players` or `teams`, alter onboarding RPCs, redesign roster UI, delete accounts, or change invitation foreign keys. Those tables remain separate follow-up phases.
