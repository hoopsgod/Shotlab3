# Next Phase Plan (Post Player Join-Code Foundation PR)

This PR establishes the **player join-code + team-membership foundation** with demo-safe fallbacks.

## Next PR scope

1. **Persistent shot logs tied to player/team membership**
   - Move shot logs from transient/demo-first behavior to durable per-player storage.
   - Tie writes/reads to hydrated player identity + team context from this phase.
   - Preserve backwards-safe fallback behavior when backend services are unavailable.

2. **Real leaderboard entries**
   - Wire leaderboard rows to persistent player identities + shot logs.
   - Ensure leaderboard rendering remains safe in missing-data and backend-unavailable states.

## Explicitly deferred from this PR

- Forced login
- Full onboarding redesign
- Shot-log migration execution details
- Subscription/social features
- Dashboard redesign
