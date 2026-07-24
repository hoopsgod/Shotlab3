# Season rollover security boundaries

The browser builds a reviewable plan, but the browser is not trusted to authorize or persist a rollover.

The `/v1/seasons` route validates shape, size, dates, membership count, and transition identity. The `start_new_season` database RPC then independently verifies `auth.uid()` is an active coach or assistant coach for the team, verifies the source archive belongs to the team, and creates the active season, returning memberships, and transition receipt in one transaction.

Direct table writes are not granted to authenticated clients. Tables are read-only through RLS for authorized coaches. The transactional RPC is the only supported write path.

The immutable `season_archives` table is referenced but never updated or deleted.
