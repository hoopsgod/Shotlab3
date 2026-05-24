# Next Phase Plan (Post Team Foundation PR)

This PR establishes coach team creation + join-code foundations only.

## Next PR scope

1. **Player join-code flow**
   - Build a player-facing join-code entry flow using the new team service primitives.
   - Validate code state and provide clear success/failure UX.

2. **Player team membership**
   - Persist player-to-team membership in Supabase for authenticated and legacy-safe paths.
   - Ensure safe fallback behavior in demo/local mode.

3. **Persistent player identity**
   - Introduce durable player identity linkage so joins survive refresh/re-login.
   - Keep coach and player dashboard compatibility while identity persistence is rolled out.

## Explicitly deferred from this PR

- Full player account migration
- Shot log migration
- Leaderboard migration
- Subscription/social features
- Dashboard redesign
