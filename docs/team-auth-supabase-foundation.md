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
