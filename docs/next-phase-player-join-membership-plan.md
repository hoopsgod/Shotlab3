# Next Phase Plan (Post Player Join-Code Foundation PR)

This PR establishes the **player join-code + team-membership foundation** with demo-safe fallbacks.

## Next PR scope

1. **Persistent player identity**
   - Introduce durable identity linkage for players so team membership survives refresh, logout/login, and device changes.
   - Keep demo/local mode non-blocking while identity persistence rolls out.

2. **Persistent shot logs**
   - Move shot logs from transient/demo-first behavior to durable per-player storage.
   - Preserve backwards-safe fallback behavior when backend services are unavailable.

3. **Real leaderboard entries**
   - Wire leaderboard rows to persistent player identities + shot logs.
   - Ensure leaderboard rendering remains safe in missing-data and backend-unavailable states.

## Explicitly deferred from this PR

- Forced login
- Full onboarding redesign
- Shot-log migration execution details
- Subscription/social features
- Dashboard redesign
