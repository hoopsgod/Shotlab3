# PR 1235 verification plan

## Automated

- `node --test tests/season-rollover.test.mjs`
- `node --test tests/season-rollover-service.test.mjs`
- `node --test tests/season-rollover-contract.test.mjs`
- `node --test tests/season-rollover-route-contract.test.mjs`
- Archive and archive-aware leaderboard regression tests
- `npm run build`

## Registered coach smoke test

1. Apply migration 034 in Supabase.
2. Sign in as an authorized registered coach.
3. Open season management and choose a durable archive owned by that team.
4. Enter a unique season name and valid dates.
5. Mark one archived active player Returning and leave another Not Returning.
6. Select one drill template, event template, and S&C template when available.
7. Review the explicit no-history-copy statement.
8. Submit once, then immediately repeat the same transition request.
9. Confirm exactly one active season and one returning season membership exist.
10. Confirm the new season has no score, attendance, RSVP, streak, completed-event, or completed-S&C history.
11. Confirm the archive remains byte-for-byte unchanged.
12. Confirm current/offseason and all-time leaderboards still load without double counting.

## Failure tests

- Player role receives 403.
- Coach from another team receives 403.
- Missing archive receives 404.
- Existing active season receives 409.
- Invalid date range receives 400.
- Failed server request creates no local active season.
