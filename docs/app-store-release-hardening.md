# ShotLab App Store Release Hardening

This release layer improves production resilience without requiring an Apple Developer account, App ID registration, signing certificates, a connected iPhone, or TestFlight access.

## What is already in place

ShotLab already provides public and in-app trust surfaces:

- `/privacy`
- `/terms`
- `/support`
- `/delete-account`
- `/data-request`
- Signed-in account and data deletion from the Profile experience

The release-hardening work reuses those routes rather than creating a second legal system.

## Offline training behavior

Home-shot entries are written to device storage before remote confirmation. When a remote save cannot complete for a temporary network or membership condition, the entry remains available as `local_pending`.

The runtime release boundary now:

1. Detects loss and restoration of network access.
2. Preserves locally saved training data while offline.
3. Checks pending home-shot entries after launch and reconnection.
4. Syncs only entries belonging to the authenticated player.
5. Skips demo data and entries already confirmed remotely.
6. Marks successful entries `remote_saved`.
7. Leaves permanent failures available for the existing manual retry interface.

The automatic recovery limit is 20 pending entries per pass to prevent an uncontrolled request burst after a long offline period.

## Session-expiration behavior

When Supabase authentication is enabled, ShotLab validates the active session:

- after startup
- when the app regains focus
- when the app becomes visible again
- every five minutes while open
- before automatic pending-shot sync

If the refresh token or session is no longer valid, ShotLab:

1. Clears only persisted authentication state.
2. Preserves locally stored training data.
3. Returns to the sign-in experience.
4. Displays a clear session-expiration notice.

Normal user-initiated logout remains separate from unexpected session expiration.

## Production demo policy

Demo mode is disabled by default in a production build. The startup shell does not initialize demo bootstrap behavior, and demo entry controls are removed from the interactive surface.

Demo mode remains available in either of these controlled environments:

- Vite development mode or localhost
- a deployment with `VITE_ENABLE_DEMO_MODE=true`

Use the explicit flag only for a controlled review, sales, or staging deployment. Do not enable it for the public App Store production build.

## Validation

The release-hardening workflow verifies:

- production demo access is opt-in
- stale demo sessions are removed from production
- pending-shot recovery is scoped to the authenticated player
- successful reconnection sync marks rows as remote-confirmed
- authentication failures preserve local pending data
- the startup shell mounts the release boundary
- network and auth lifecycle listeners remain installed
- production build completion

## Apple-side boundary

This work does not:

- register `com.shotlab.training`
- select an Apple Developer Team
- configure certificates or provisioning profiles
- install ShotLab on a physical iPhone
- create or upload a TestFlight archive

Those steps remain intentionally paused until the owner is ready.
