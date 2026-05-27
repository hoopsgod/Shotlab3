# Live Supabase At-Home Leaderboard Verification

This repo contains **two layers** of persistence verification for At-Home Shots leaderboards:

1. **Mock/service verification** (`tests/supabase-leaderboard-persistence-verification.test.mjs`)
   - Proves service-layer save/read/aggregation behavior deterministically.
   - Proves empty/error/static-guard behavior without requiring network access.
2. **Live Supabase smoke test** (`tests/live-supabase-leaderboard-smoke.test.mjs`)
   - Proves real Supabase write -> read -> leaderboard ranking through the app service layer.

## Required environment variables for live smoke test

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` **or** `SUPABASE_SERVICE_ROLE_KEY`
- `TEST_TEAM_ID` (optional; generated test team id is used if omitted)
- `TEST_PLAYER_ID` or `TEST_PLAYER_A_ID` (optional; generated player id is used if omitted)
- `TEST_PLAYER_B_ID` (optional; generated second player id is used if omitted)

Only Supabase credentials are strictly required. If `SUPABASE_URL` or key is missing, the live smoke test is **skipped** (not failed), so CI stays green.

## Run commands

```bash
npm run verify:leaderboards:supabase
```

Equivalent:

```bash
node --test tests/live-supabase-leaderboard-smoke.test.mjs
```

## What a passing live result means

A passing run confirms all of the following against your configured Supabase project:

- shot logs are inserted through `createShotLogService()` into `shot_logs`
- saved records can be read back from Supabase
- `createLeaderboardService()` builds leaderboard rows from persisted shot logs
- when generated isolated player ids are used, the player with higher saved total ranks above the lower total player
- test rows are cleanup-targeted by `session_id` after the test (best effort)

## Scope clarity: mock vs live

- **Mock tests prove**: deterministic service behavior, edge cases, empty/error fallback behavior, and static anti-hardcode guard.
- **Live smoke proves**: actual Supabase persistence and retrieval path correctness in an integrated environment.

## Cloudflare deployment relevance

- This verification PR targets Supabase persistence tests and does not change Cloudflare runtime code or UI.
- Current production deploy command in this repo is Pages (`npm run deploy:cloudflare`).
- If a separate Cloudflare Workers deploy fails, treat it as unrelated to this PR unless Workers is part of your active production path.
