# Next phase: leaderboard rollout order

This foundation PR intentionally limits scope to architecture/service-level support and safe empty-state behavior.

## Required follow-up PR order

1. Build the **real drill-name leaderboard UI** backed by `leaderboard_type=drill_shots`.
2. Build the **real event participation leaderboard** backed by durable attendance participation records.
3. Build the **real strength and conditioning participation leaderboard** backed by durable S&C completion records.

## Data requirements for participation leaderboards

Before phases 2 and 3 can render live rankings, the app needs stable team-scoped participation tables with at least:

- `team_id`
- `player_id`
- participation/completion timestamp
- source type (`event` or `strength_conditioning`)
- a reliable "completed/attended" state

Until those records are available, the leaderboard service should continue returning safe empty results without startup crashes, forced login, or raw backend errors in UI.
