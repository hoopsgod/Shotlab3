# Next Phase: Shot Logs Foundation

This PR establishes a safe persistence foundation for player shot logs while preserving existing demo/local behavior.

## Included in this phase
- Safe shot-log service/repository operations for create/load/summarize.
- Defensive fallback when Supabase config is missing, context is missing, or backend calls fail.
- Minimal UI wiring in existing **Log Shots / At Home Log** flow.

## Explicitly deferred to next PR
The next PR after this one will implement:
- Real leaderboard entries derived from shot logs.
- Team leaderboard read model.
- Leaderboard empty/loading/error states.

## Out of scope in this phase
- Leaderboard migration.
- Social feed changes.
- Subscriptions.
- Forced login.
- Dashboard redesign.
