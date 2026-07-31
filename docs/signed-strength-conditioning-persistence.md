# Signed Strength & Conditioning Persistence

ShotLab stores team S&C schedules, commitments, and completion logs in three
team-scoped Supabase tables:

- `sc_sessions`
- `sc_rsvps`
- `sc_logs`

All three tables have RLS enabled and grant no direct privileges to `anon` or
`authenticated`. Cloudflare Pages Functions use `service_role` credentials
behind `/v1/strength-conditioning`.

## Authorization

- Coaches may read and replace all three collections for teams they manage.
- Players may read the shared team schedule.
- Players may read and replace only their own RSVP and completion-log rows.
- Players cannot create, edit, or delete team S&C sessions.
- Cross-team reads and writes are rejected.
- Demo identities remain local-only and never write Supabase rows.

## Rollout

Migration `052_strength_conditioning_signed_api.sql` is backward-compatible:
creating empty service-only tables does not change the current client. Apply it
before deploying the signed route.

After deployment:

1. Verify unsigned `/v1/strength-conditioning` requests return `401`.
2. Verify demo GET/POST requests return `demo_local`.
3. Confirm the demo smoke creates no database rows.
4. Confirm RLS remains enabled and browser roles have no table privileges.

The client keeps its existing local copy as a fallback. Existing coach-created
sessions are promoted in session-first order so dependent RSVPs cannot race the
schedule on the first synchronized load.
