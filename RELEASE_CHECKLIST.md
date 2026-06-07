# ShotLab Release Candidate Checklist

Use this checklist before merging a release-candidate stability PR or shipping a production build.

## Player smoke test

- Register a new player account with a real email/password path.
- Log out, then log back in as that registered player.
- Confirm the player is assigned to the expected coach/team and sees team branding/context.
- Log at-home shots from the player dashboard.
- Refresh the page and confirm the saved shots remain visible in player totals.
- Confirm player dashboard totals update for today/week/season where shown.
- Confirm the player leaderboard shows the saved shot total and does not show `No leaderboard data yet` when saved `shot_logs` rows exist.

## Coach smoke test

- Log in as a registered coach for the same team.
- Confirm the roster includes the registered player.
- Confirm coach dashboard/player detail totals include the player's at-home shots.
- Confirm the coach At-Home Shots leaderboard shows the same saved player total as the player leaderboard.
- Confirm no development-only sync/debug panels or confusing warnings appear during a successful save and refresh.

## Demo smoke test

- Start Demo Player mode and confirm the player dashboard loads without backend credentials.
- Log demo at-home shots and confirm demo totals/leaderboards update locally.
- Start Demo Coach mode and confirm demo roster, dashboard totals, and leaderboards still load.
- Clear demo data and confirm the app returns to a clean non-demo state.

## Mobile Safari smoke test

- Test the production preview on an iPhone-sized viewport and on a physical iPhone when available.
- Confirm primary gameplay actions are not covered by modals, panels, or bottom navigation.
- Confirm buttons can be tapped on the first tap, including bottom navigation tabs.
- Confirm there is no horizontal layout overflow on the player dashboard, shot logger, leaderboards, or coach dashboard.
- Confirm loading states resolve after signup/login, shot logging, leaderboard refresh, and coach dashboard load.

## Cloudflare deployment notes

- Cloudflare Pages is the supported deployment target for this repo.
- Use `npm run build` with output directory `dist`; the `functions/` directory deploys as Cloudflare Pages Functions with that Pages build.
- A standalone Cloudflare Workers deployment is intentionally not required because this repo does not define a `wrangler.toml` Worker entrypoint. If a Workers-only status check fails, treat it as non-blocking unless it is explicitly wired to the Pages project.
- If branch protection requires a stale standalone Workers check, remove that requirement or reconnect it to the Cloudflare Pages project before merging.

## Known limitations

- Event, strength/conditioning, and coach drill leaderboard categories may remain empty until their durable participation records are populated.
- Offline/demo shot saves can remain local-only until a registered backend session and durable team membership are available.
- Debug console diagnostics are intentionally hidden unless `shotLabDebug=1`, `homeShotDebug=1`, or `debug=1` is present in the URL.

## Do-not-merge conditions

- `npm test` fails.
- `npm run build` fails.
- Registered player shots do not persist after refresh.
- Registered player shots are missing from either the player leaderboard or coach leaderboard.
- A successful normal user flow shows debug boxes, orange sync panels, raw backend diagnostics, or confusing error copy.
- Mobile Safari has blocked gameplay buttons, layout overflow, stuck loading states, or bottom navigation that requires multiple taps.
- Demo player or demo coach mode regresses.
- Roster-aware `shot_logs.player_id`, leaderboard fallback, coach/player leaderboard aggregation, or demo compatibility is removed.
