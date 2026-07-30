# ShotLab Session Table Lockdown

## Objective

Remove the obsolete `public.sessions` table from browser persistence and close its permissive RLS policy without changing active authentication behavior.

## Active session stores

ShotLab now has three distinct session concerns:

1. `sl:session` — local application identity and routing context stored on the device.
2. Supabase Auth — access and refresh tokens managed through Supabase Auth endpoints.
3. `legacy_auth_sessions` — API-only opaque legacy sessions stored as SHA-256 token hashes and referenced by an HttpOnly cookie.

`public.sessions` is not an authentication authority and should not be remotely writable by browser roles.

## Changes

- Removes `STORAGE_KEYS.sessions` from `TABLE_MAP`, preventing the generic persistence adapter from reading or writing `public.sessions`.
- Keeps the local `sl:session` key unchanged.
- Drops the legacy `Allow all` policy on `public.sessions`.
- Revokes all table privileges from `PUBLIC`, `anon`, and `authenticated`.
- Preserves service-role access for controlled maintenance or compatibility work.
- Does not delete or mutate existing rows.

## Deployment order

1. Pass Session Table Lockdown and full regression workflows.
2. Apply `migrations/040_session_table_lockdown.sql` to production Supabase.
3. Verify no `anon` or `authenticated` grants remain and no permissive policy exists.
4. Verify local login, refresh, logout, demo entry, and registered-user restore flows.
5. Merge only after database verification.

## Scope boundaries

This phase does not modify teams, players, profiles, events, RSVPs, shot logs, scores, season archives, or product UI. Those legacy permissive tables require separate table-by-table migrations.
