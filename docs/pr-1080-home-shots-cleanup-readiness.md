# PR 1080 Home-Shots Cleanup Readiness

## Preview validation

Cloudflare Pages preview registered-player testing checklist for PR 1080 cleanup:

- Registered player logs in fresh and adds a home shot.
- No orange Team Sync Needs Attention panel appears after the save.
- Refreshing the player page keeps the saved shot visible.
- Logging out and back in keeps the saved shot visible.
- Coach dashboard shows the saved shot.
- Retry Sync does not appear for a successfully saved shot.
- Old local_pending/background_saved shot rows do not trigger the warning panel; true failed_sync rows still show Retry Sync.

## Merge readiness notes

- PR 1080 cleanup remains draft until the React/state Team Sync cleanup and Cloudflare Pages preview validation pass.

- Cloudflare Pages is the supported deployment target for this repository.
- The `functions/` directory is deployed as Cloudflare Pages Functions with the Pages build.
- A standalone Cloudflare Workers check is non-blocking for the PR 1080 cleanup because Cloudflare Pages is the supported deployment target; production merge should use the Cloudflare Pages preview/deploy status as the source of truth unless CI explicitly maps that check to the Pages project.
- If branch protection still requires a stale standalone Workers check, remove that stale requirement or reconnect it to the Pages project before merging.

## Expected home-shot behavior

- A valid registered player with a real team relationship saves home shots as `remote_saved` / `remote`.
- A post-save leaderboard refresh failure must not change the saved row to `failed_sync`.
- A post-save leaderboard refresh failure must not show the Team Sync Needs Attention panel.
- The coach dashboard reads server-confirmed saved shots.

## Cleanup guardrails

- No `index.html` MutationObserver or document-level script hides the Team Sync panel.
- React selectors pass only `failed_sync` rows to `HomeShotSyncRetryPanel`.
- Hydration converts stale local `local_pending` rows to `background_saved`; `background_saved` remains local-only and does not persist to remote `shot_logs`.
