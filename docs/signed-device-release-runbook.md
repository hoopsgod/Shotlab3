# ShotLab Signed-Device and TestFlight Runbook

## Release identity

- App name: ShotLab
- Bundle identifier: `com.shotlab.training`
- Version: `1.0`
- Build: `1`
- Deployment target: iOS 15.0
- Initial device scope: iPhone only
- Orientation: portrait only
- Product appearance: Phase 7 light-first UI with intentional dark performance moments
- Apple upload floor: Xcode 26+ using the iOS 26 SDK or later

The repository identity is stable, but the bundle identifier must still exist as an explicit App ID in the publishing Apple Developer account and have a matching App Store Connect record before the first signed/TestFlight release.

## Configure Apple signing

1. Confirm active Apple Developer Program membership.
2. Create or confirm the explicit App ID `com.shotlab.training`.
3. Create or confirm the matching App Store Connect app record.
4. Find the real 10-character Team ID in Apple Developer membership details.
5. On the Mac that will perform the first device/archive pass, run:

```bash
SHOTLAB_DEVELOPMENT_TEAM=ABCDEFGHIJ npm run ios:configure-signing
```

6. Open `ios/App/App.xcodeproj` in Xcode.
7. Confirm the App target has **Automatically manage signing** enabled and the intended team selected.

Do not commit certificates, private keys, `.p12` files, provisioning profiles, App Store Connect API private keys, Apple passwords, or session tokens.

## Signing/device preflight

Static validation can run anywhere:

```bash
node scripts/apple-signing-first-build.mjs
```

On the release Mac:

```bash
node scripts/apple-signing-first-build.mjs --require-macos
```

Before the first physical-iPhone acceptance pass:

```bash
export SHOTLAB_DEVELOPMENT_TEAM=ABCDEFGHIJ
export SHOTLAB_DEVICE_UDID=<physical-iphone-udid>
node scripts/apple-signing-first-build.mjs --require-macos --require-team --require-device
```

## First physical iPhone build

Requirements:

- macOS with Xcode 26 or later and an iOS 26 SDK or later
- an Apple Account in Xcode with access to the publishing team
- a trusted physical iPhone
- Developer Mode enabled on the iPhone

Prepare current assets and native state:

```bash
npm ci
npm run native:sync:ios
npm run ios:validate
```

For the first install, select the physical device in Xcode and use **Run**. Accept the device gate only after the checks in `native/first-testflight-handoff.json` pass: safe areas, keyboard behavior, registered Coach and Player flows, shot/RSVP persistence, offline recovery, account deletion reachability, relaunch/session recovery, and background/foreground behavior.

Simulator or browser evidence cannot close the physical-device gate.

## Prepare the first TestFlight archive

After physical-device QA is accepted:

```bash
node scripts/testflight-readiness.mjs --strict-owner --require-macos --require-signing
node scripts/ios-release.mjs release-candidate
```

The release command rebuilds and Capacitor-syncs the current production web bundle before creating `build/ShotLab.xcarchive`, preventing a stale web payload from being archived.

For the first upload, open Xcode Organizer, validate the archive, and choose the App Store Connect distribution flow. Keep the first TestFlight audience internal.

## TestFlight completion gate

A TestFlight upload is not complete when Xcode finishes uploading. App Store Connect must process the build first. After processing:

1. Resolve any compliance or processing warning.
2. Add build `1.0 (1)` to the internal group `ShotLab Internal`.
3. Install the build from the TestFlight app on a physical iPhone.
4. Repeat the registered Coach and Player smoke path.
5. Record crashes, session issues, visual safe-area defects, stale data, duplicate writes, and App Store Connect warnings.

Do not mark `physicalDeviceQa` or `internalTestFlightBuild` complete until this evidence exists.

The detailed phase handoff is `docs/apple-signing-first-testflight-phase.md`.
