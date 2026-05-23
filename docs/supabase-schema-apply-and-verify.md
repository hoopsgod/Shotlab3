# Supabase Schema Apply + Read-Only Verification (MVP-safe)

This phase only confirms connectivity and required table availability. It does **not** migrate app data or force auth.

## 1) Apply schema migration

Run migrations in order against your Supabase project (for example using Supabase SQL editor or CI migration tooling).

- Ensure the latest foundation migration exists: `migrations/028_team_auth_foundation_schema.sql`
- Apply any missing migrations before this file.

## 2) Verify MVP tables (read-only)

ShotLab provides a developer-only runtime utility:

- In dev console: `window.__shotlabSupabaseSchemaStatus()`
- It performs read-only `select` probes for these tables:
  - `users`
  - `teams`
  - `team_members`
  - `join_codes`
  - `drills`
  - `coach_priorities`
  - `shot_logs`
  - `sessions`
  - `leaderboard_entries`

Possible statuses:

- `demo_safe`: Supabase env vars missing; demo mode remains active.
- `available`: Supabase configured and all MVP tables reachable.
- `unavailable`: Supabase configured but one or more tables unavailable.

## 3) Cloudflare Pages environment variables

Set these in Cloudflare Pages project settings (Production + Preview as needed):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

After setting vars, redeploy the site.

## 4) Guardrails for this phase (what not to do yet)

Do **not** do any of the following in this phase:

- force login
- migrate player data
- write real shot logs
- create real accounts in production flows
- visually rework dashboards for backend state

Demo/local mode must continue to boot safely even if Supabase is missing or unreachable.
