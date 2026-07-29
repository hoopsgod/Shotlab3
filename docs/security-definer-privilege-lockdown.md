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

## Intentionally unchanged

The following authenticated season-rollover helpers are not part of this lockdown:

- `public.is_active_team_coach(text)`
- `public.start_new_season(jsonb)`

Migration `035_tighten_season_rollover_privileges.sql` already revokes anonymous execution while preserving the intentional authenticated RPC flow. They require a separate redesign before authenticated execution could be removed.

## Deployment sequence

1. Pass the dedicated privilege-lockdown contracts and full product regression matrix.
2. Apply migration `039_security_definer_privilege_lockdown.sql` to production Supabase.
3. Verify `anon_execute=false`, `authenticated_execute=false`, and `service_role_execute=true` for all three locked signatures.
4. Confirm the Supabase security advisor no longer reports public or authenticated execution for these functions.
5. Merge only after database verification.

## Scope boundary

This phase does not change permissive RLS policies on older business tables and does not finish application-wide API identity migration. Those remain separate, higher-risk phases.