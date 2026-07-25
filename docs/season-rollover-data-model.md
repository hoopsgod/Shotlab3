# Season rollover data model

- `season_archives`: immutable historical source of truth.
- `active_seasons`: current and completed season identities; one active row per team.
- `season_player_memberships`: season-specific roster membership preserving durable player identity.
- `season_rollovers`: idempotency receipt tying one transition ID to one created season.

Historical activity remains in archives and existing live tables. The rollover creates a new boundary rather than clearing or reassigning historical rows.
