# Live Supabase At-Home Leaderboard Verification

This repo uses **two layers** of persistence verification for At-Home Shots leaderboards:

1. **Mock/service verification** (`tests/supabase-leaderboard-persistence-verification.test.mjs`)
   - Proves service-layer save/read/aggregation behavior deterministically.
   - Proves empty/error/static-guard behavior without requiring network access.
2. **Live Supabase smoke test** (`tests/live-supabase-leaderboard-smoke.test.mjs`)
   - Proves real Supabase write -> read -> leaderboard ranking through the app service layer.

## Required secrets/env for live smoke

Required:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` **or** `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `TEST_TEAM_ID`
- `TEST_PLAYER_A_ID` (or legacy `TEST_PLAYER_ID` for local usage)
- `TEST_PLAYER_B_ID`

## Local smoke test workflow

Run these commands locally:

```bash
npm ci
npm run build
node --test tests/supabase-leaderboard-persistence-verification.test.mjs
npm run verify:leaderboards:supabase
```

### Local skipped behavior

- If local `SUPABASE_URL` or key env vars are missing, the live smoke test is **skipped** (not failed).
- This is expected for local/dev environments where Supabase credentials are intentionally not configured.

## GitHub Actions smoke test workflow

Manual workflow file: `.github/workflows/live-supabase-leaderboard-verification.yml`

- Workflow name: **Live Supabase Leaderboard Verification**
- Trigger: `workflow_dispatch` only (manual run)
- It does **not** run automatically on every PR or push.

### How to run in GitHub

1. Add repository secrets in `Settings > Secrets and variables > Actions`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
   - Optional: `TEST_TEAM_ID`, `TEST_PLAYER_A_ID`, `TEST_PLAYER_B_ID`
2. Open **Actions** in GitHub.
3. Select **Live Supabase Leaderboard Verification**.
4. Click **Run workflow**.

### Missing-secrets behavior in GitHub Actions

- The workflow runs a preflight validation step.
- If required secrets are missing, the workflow **fails fast** with a clean message listing the required missing secrets.
- No secret values are printed; only missing secret names are reported.

## What passing proves

A passing full run confirms all of the following against the configured Supabase project:

- shot logs are inserted through `createShotLogService()` into `shot_logs`
- saved records can be read back from Supabase
- `createLeaderboardService()` builds leaderboard rows from persisted shot logs
- when isolated player ids are used, the player with higher saved total ranks above the lower total player
- test rows are cleanup-targeted by `session_id` after the test (best effort)

## Scope clarity: mock vs live

- **Mock tests prove** deterministic service behavior, edge cases, empty/error fallback behavior, and static anti-hardcode guard.
- **Live smoke proves** actual Supabase persistence and retrieval correctness in an integrated environment.

## Cloudflare deployment relevance

- This verification workflow targets Supabase persistence tests and does not change Cloudflare runtime code or UI.
- Current production deploy command in this repo is Pages (`npm run deploy:cloudflare`).
