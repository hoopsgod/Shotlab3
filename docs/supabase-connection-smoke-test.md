# Supabase Connection Smoke Test (Safe Rollout)

This phase enables a **non-blocking** Supabase connection check only.

## Guarantees
- No forced login changes.
- No migration of shot logs, teams, players, or leaderboards in app code paths.
- Missing Supabase env vars keep demo/local behavior active.
- Supabase probe failures are contained and do not crash startup.

## Environment
Create a `.env` (or `.env.local`) with:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If either key is missing, ShotLab reports demo mode and continues in demo-safe mode.

## Developer-only backend status utility
In development builds, run this in browser devtools:

```js
await window.__shotlabBackendStatus()
```

Returned shape:

- `code`: one of `demo_mode_active`, `supabase_configured`, `supabase_reachable`, `supabase_unavailable`
- `label`: human-readable status
- `ok`: boolean health bit

## Safe schema migration verification (Supabase)
Use Supabase CLI against a non-production project first:

```bash
supabase db push --db-url "$SUPABASE_DB_URL" --include-all
```

Or run a specific migration manually in SQL editor (recommended for phased rollout):

- `migrations/028_team_auth_foundation_schema.sql`

Then verify expected tables exist and app startup still succeeds with and without Vite Supabase env vars.

## Smoke checklist
1. Start app without Supabase env vars → app boots, demo dashboards work.
2. Start app with Supabase env vars → app boots.
3. While Supabase is reachable: `await window.__shotlabBackendStatus()` returns reachable/configured.
4. Simulate backend outage (invalid URL or blocked network) → app still boots; status reports unavailable.
5. Confirm no login is forced and existing demo flows remain usable.
