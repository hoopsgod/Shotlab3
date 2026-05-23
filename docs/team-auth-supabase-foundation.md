# Team + Auth + Supabase Foundation

## Runtime mode and safety

ShotLab now resolves backend mode at startup:

- `supabase` mode when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist.
- `demo` mode fallback when env vars are missing.

This preserves local/demo preview and avoids startup crashes.

## Service architecture

`src/lib/teamAuthFoundation.js` introduces a backend-ready service interface for:

- `users`
- `teams`
- `team_members`
- `join_codes`
- `coach_priorities`
- `drills`
- `shot_logs`
- `sessions`
- `leaderboard_entries`

In demo mode these endpoints return safe no-op results, preserving current local behavior.
In Supabase mode these endpoints use the existing lightweight `supabase.from(...).upsert/select` adapters.

## Viral team loop support

Architecture now explicitly supports the loop:

1. Coach account (user role = `coach`)
2. Coach creates team (`teams`)
3. Coach shares join code (`join_codes`)
4. Player joins team (`team_members`, role = `player`)
5. Player logs shots (`shot_logs`)
6. Leaderboard entries (`leaderboard_entries`)

## Proposed database schema

See migration: `migrations/028_team_auth_foundation_schema.sql`.

Included tables:

- `users`
- `teams`
- `team_members`
- `join_codes`
- `drills`
- `coach_priorities`
- `shot_logs`
- `sessions`
- `leaderboard_entries`

## Next phase enabled by auth session foundation

This PR intentionally adds only session detection + safe listener behavior so ShotLab can stay in demo mode when no authenticated user exists.

With this in place, next phase can add (without breaking startup safety):

1. Coach account bootstrap using authenticated Supabase user identity.
2. Player account registration + sign-in paths tied to team membership.
3. Team creation flows linked to coach identity.
4. Join code redemption flows that attach authenticated players to teams.
5. Persistent shot logs scoped to authenticated users and team context.

No login gating, data migration, or social/subscription behavior is required for this foundation.
