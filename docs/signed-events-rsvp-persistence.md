# ShotLab Signed Events and RSVP Persistence

## Objective

Move `events` and `rsvps` behind ShotLab's authenticated Cloudflare API boundary and remove direct browser access to both tables.

## Authorization model

### Events

- Coaches and players may read events only for teams they can access.
- Only a coach with writable access to a team may create, update, or delete that team's events.
- Event IDs cannot be moved across teams.
- Deleting an event also deletes its team-scoped RSVP rows.

### RSVPs

- Coaches may read and manage RSVP rows for their team.
- Players may read only their own RSVP rows.
- Players may create, update, or remove only their own RSVP rows.
- Cached rows belonging to other players are ignored during a player synchronization and cannot be modified or deleted.
- RSVP rows must reference an event in the same team.
- RSVP IDs cannot be claimed across teams or across player identities.

## Browser integration

The existing shared persistence adapter still calls the Supabase-shaped interface used by `App.jsx`. The global fetch bridge narrowly reroutes only these direct REST paths:

- `.../rest/v1/events` to `/v1/events`;
- `.../rest/v1/rsvps` to `/v1/rsvps`.

Other Supabase Auth and REST requests are unchanged. The bridge returns the same array-shaped response expected by the existing adapter, so no `App.jsx` rewrite is required.

The existing `strictLocal` option on event creation requires a successful local cache write; it does not disable remote synchronization.

## Collection synchronization

Coach event writes are treated as the authoritative collection for one team. Missing event IDs are deleted, and their RSVP rows are deleted in the same API operation.

Coach RSVP writes are authoritative for the team RSVP collection. Player RSVP writes are authoritative only for that player's own RSVP rows. This preserves coach management while preventing a player from deleting or changing another player's response.

## Database lockdown

Migration `043_events_rsvps_signed_api_boundary.sql`:

- enables RLS on both tables;
- removes the public `Allow all` policies;
- revokes all table privileges from `PUBLIC`, `anon`, and `authenticated`;
- retains explicit service-role read, insert, update, and delete access;
- leaves both tables with no browser-facing policy.

## Deployment order

1. Pass the Signed Events and RSVP Persistence workflow and the full product regression matrix.
2. Apply migration `043_events_rsvps_signed_api_boundary.sql` to production Supabase.
3. Verify all existing event and RSVP rows are preserved.
4. Verify RLS remains enabled and no public, anon, or authenticated grants or policies remain.
5. Verify service-role access remains.
6. Confirm the permissive advisor findings for `events` and `rsvps` are gone.
7. Merge only after database verification.

## Scope boundaries

This phase does not change event or RSVP UI, event calculations, season archives, strength and conditioning sessions, teams, players, profiles, scores, program scores, or shot logs. It does not claim the remaining permissive core-table policies are resolved.

## Rollback

Restore a narrowly scoped signed API path before changing the browser adapter. Do not restore the old public `Allow all` policies as a permanent fix.
