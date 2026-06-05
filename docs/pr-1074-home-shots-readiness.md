# PR 1074 Home-Shots Readiness

## Preview validation

Cloudflare Pages preview registered-player testing checklist for PR 1074:

- Registered player logs in fresh and adds a home shot.
- No orange Team Sync Needs Attention panel appears after the save.
- Refreshing the player page keeps the saved shot visible.
- Logging out and back in keeps the saved shot visible.
- Coach dashboard shows the saved shot.
- Retry Sync does not appear for a successfully saved shot.
- Old failed/local_pending shot rows do not keep triggering the warning panel after a new successful remote save.

## Merge readiness notes

- PR 1074 remains draft until the updated repair-token/spoofing safeguards and the PR 1074 Cloudflare Pages preview validation pass.

- Cloudflare Pages is the supported deployment target for this repository.
- The `functions/` directory is deployed as Cloudflare Pages Functions with the Pages build.
- A standalone Cloudflare Workers check is non-blocking for PR 1074 because Cloudflare Pages is the supported deployment target; production merge should use the Cloudflare Pages preview/deploy status as the source of truth unless CI explicitly maps that check to the Pages project.
- If branch protection still requires a stale standalone Workers check, remove that stale requirement or reconnect it to the Pages project before merging.

## Expected home-shot behavior

- A valid registered player with a real team relationship saves home shots as `remote_saved` / `remote`.
- A post-save leaderboard refresh failure must not change the saved row to `failed_sync`.
- A post-save leaderboard refresh failure must not show the Team Sync Needs Attention panel.
- The coach dashboard reads server-confirmed saved shots.
