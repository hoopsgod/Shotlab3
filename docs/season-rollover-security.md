# Season rollover security boundaries

The browser builds a reviewable plan, but the browser is not trusted to authorize or persist a rollover.

The `/v1/seasons` route validates a signed Supabase or legacy session, verifies
the requester has coach write access to the team, and validates plan shape,
size, dates, membership count, and transition identity. The service-only
`start_new_season(jsonb, text)` RPC independently resolves the server-verified
requester, checks active coach, assistant-coach, or team-owner authorization,
verifies the source archive belongs to the team, and creates the active season,
returning memberships, and transition receipt in one transaction.

Direct `anon` and `authenticated` access to the season tables and rollover RPC
is removed after the signed Cloudflare route is deployed. Demo rollover remains
local-only and does not write to Supabase.

Direct table reads and writes are not granted to browser roles. Season data is
accessed only through authenticated Cloudflare endpoints backed by
service-role database calls. The transactional RPC is the only supported write
path.

The immutable `season_archives` table is referenced but never updated or deleted.
