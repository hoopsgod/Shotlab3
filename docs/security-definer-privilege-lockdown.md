# Security Definer Privilege Lockdown

## Objective

Remove direct anonymous and signed-in client execution from `SECURITY DEFINER` functions that are intended to be called only through ShotLab's Cloudflare service-role API boundary.

## Locked functions

- `public.resolve_app_user_uuid(text)`
- `public.get_team_home_shots_leaderboard(text, text, integer, text)`
- `public.get_team_home_shots_leaderboard(uuid, text, integer)`

For each function, migration `039_security_definer_privilege_lockdown.sql`:

- revokes `EXECUTE` from `PUBLIC`, `anon`, and `authenticated`;
- explicitly grants `EXECUTE` to `service_role`;
- leaves the function body, arguments, return type, and fixed search path unchanged.

## Why this is safe

ShotLab browser source does not invoke these RPCs directly. They are called through Cloudflare functions that use the Supabase service-role key:

- the Home Shots leaderboard route mediates both leaderboard RPC overloads;
- team, invite, archive, season, home-shot, and priority APIs use `resolve_app_user_uuid` through the shared service-role RPC client.

Removing direct REST/RPC execution blocks callers from bypassing those API controls while preserving the existing server paths.

## Season rollover follow-up

Migration `039` intentionally left these authenticated season-rollover helpers unchanged:

- `public.is_active_team_coach(text)`
- `public.start_new_season(jsonb)`

That temporary exception is removed by the staged season boundary:

1. `049_season_rollover_signed_api_boundary.sql` adds
   `public.start_new_season(jsonb, text)` with a fixed empty search path and
   `service_role`-only execution.
2. The Cloudflare `/v1/seasons` route validates a signed session, verifies team
   write access, and supplies the server-verified requester to that RPC.
3. `050_season_rollover_signed_api_lockdown.sql` removes direct browser access
   to the season tables and drops both legacy authenticated functions.

The split avoids an outage: old production code remains usable while the new
signature is prepared, and the legacy surface is removed only after the new
route is live.

## Deployment sequence

1. Pass the dedicated privilege-lockdown contracts and full product regression matrix.
2. Apply migration `039_security_definer_privilege_lockdown.sql` to production Supabase.
3. Verify `anon_execute=false`, `authenticated_execute=false`, and `service_role_execute=true` for all three locked signatures.
4. Confirm the Supabase security advisor no longer reports public or authenticated execution for these functions.
5. Merge only after database verification.

## Scope boundary

This phase does not change permissive RLS policies on older business tables and does not finish application-wide API identity migration. Those remain separate, higher-risk phases.
