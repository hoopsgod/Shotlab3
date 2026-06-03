# PR 1046 Home-Shots Readiness

## Preview validation

Cloudflare Pages preview registered-player testing passed on June 3, 2026:

- Home-shot save succeeds for a registered player.
- The saved shot remains visible after refresh.
- No error popup appears during normal load/save.
- Coach view shows the saved shot.

## Merge readiness notes

- Cloudflare Pages is the supported deployment target for this repository.
- The `functions/` directory is deployed as Cloudflare Pages Functions with the Pages build.
- A standalone Cloudflare Workers check is non-blocking for PR 1046 unless CI explicitly maps that check to the Cloudflare Pages project.
- If branch protection still requires a stale standalone Workers check, remove that stale requirement or reconnect it to the Pages project before merging.

## Expected home-shot behavior

- A valid registered player with a real team relationship saves home shots as `remote_saved` / `remote`.
- A post-save leaderboard refresh failure must not change the saved row to `failed_sync`.
- A post-save leaderboard refresh failure must not show the Team Sync Needs Attention panel.
- The coach dashboard reads server-confirmed saved shots.
