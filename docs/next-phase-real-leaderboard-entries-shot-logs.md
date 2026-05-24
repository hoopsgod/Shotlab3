# Next Phase: Real Leaderboard Entries From Shot Logs

This phase introduces a safe leaderboard read model backed by persistent shot logs, with a strict fallback to demo/local behavior.

## What this phase delivers

- A leaderboard service/repository layer for:
  - player shot leaderboard loading
  - team leaderboard loading
  - rank calculation from shot logs
- Derived leaderboard entries from shot log fields where available:
  - `player_id`
  - `team_id`
  - `total_makes`
  - `total_attempts` / `total_reps`
  - `drill_id` / `session_id`
  - `updated_at`
- Safe fallback behavior when backend context is unavailable:
  - missing Supabase configuration
  - missing team/player context
  - backend unavailable
  - empty shot logs
- Empty-state UX copy for low-data teams:
  - “No leaderboard data yet. Log shots to enter the rankings.”

## Guardrails preserved

- Demo/local mode remains first-class and never blocked by leaderboard load failures.
- No forced login is introduced by leaderboard fetches.
- Dashboard startup does not depend on leaderboard success.
- Default leaderboard failures resolve to empty-state UI instead of noisy red technical errors.

## Validation scope in this phase

- missing Supabase env vars => demo/local safe
- missing team context => no crash
- empty shot logs => clean empty leaderboard
- valid shot logs => ranked entries
- backend unavailable => safe fallback
- app startup independent of leaderboard readiness

## Next PR (planned)

1. Coach-visible team leaderboard expansion.
2. Drill-specific leaderboard views.
3. Leaderboard refresh/error/empty-state polish and interaction tuning.
