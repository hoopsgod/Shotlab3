# Signed Player Challenge Persistence

Player Challenges are persisted through `GET/POST /v1/player-challenges` on Cloudflare Pages Functions.

## Boundary

- Browser roles have no direct privileges on `public.player_challenges`.
- The service role is used only inside the Pages Function.
- An active player can read only challenges where they are the challenger or opponent.
- Coaches and cross-team identities cannot read, create, or answer challenges.
- A player may create a challenge only for another active player on the same roster.
- Only the named opponent may answer; the server calculates the result.

## Compatibility

- Demo challenges remain device-local.
- Existing local outgoing pending challenges are promoted idempotently after a signed player session is restored.
- Invalid or unavailable API responses never replace the local cache.
- New writes report a visible failure instead of claiming that an undelivered challenge was sent.

## Release proof

1. Run `node --test tests/signed-player-challenge-persistence.test.mjs`.
2. Run `npm run build`.
3. Verify the migration with `BEGIN` / `ROLLBACK`, then apply it once.
4. Confirm RLS, grants, policy count, indexes, and zero initial rows.
5. After deployment, an unsigned request to `/v1/player-challenges` must return `401`.
6. Demo GET/POST must report `storage_mode: "demo_local"` without inserting rows.
