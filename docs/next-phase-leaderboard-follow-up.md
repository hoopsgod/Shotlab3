# Next Phase: Leaderboard Expansion Follow-up

This PR establishes a safe leaderboard read model sourced from shot logs and keeps demo/local mode resilient when Supabase, shot logs, identity, or team context are unavailable.

## Planned next PR scope

1. Coach-visible team leaderboard enhancements.
2. Drill-specific leaderboard views.
3. Leaderboard refresh/error/empty-state polish.

## Guardrails that remain in place

- No forced login.
- No social feed additions.
- No subscription work.
- No dashboard redesign.
- No exposure of raw technical Supabase errors to end users.
