# Apple Signing + First Physical-iPhone/TestFlight Phase

## Goal

Take the merged release-ready ShotLab product from unsigned/code-ready to a real signed iPhone build and a processed internal TestFlight build without changing the accepted Phase 7 product UI.

This phase is not complete merely because Xcode compiles. It closes only after:

1. the real Apple Developer team is configured for `com.shotlab.training`;
2. a signed build runs on a physical iPhone;
3. physical-device QA is accepted;
4. a Release archive is uploaded to App Store Connect;
5. Apple finishes processing the build;
6. the internal TestFlight build is installed on a physical iPhone; and
7. the Coach and Player smoke path passes from the TestFlight-installed build.

## Current certified baseline

- Production base: `b8a593dc595277aa1020ab31ba34bca5b3005d8c`
- Product: ShotLab
- Bundle identifier: `com.shotlab.training`
- Version/build: `1.0 (1)`
- Device family: iPhone only
- Orientation: portrait
- Minimum deployment target: iOS 15.0
- Upload floor recorded by the release gate: Xcode 26+ / iOS 26 SDK+
- Current release state: code-ready; Apple account/signing/device/TestFlight evidence pending

## Phase guardrails

- Do not change the Phase 7 visual system as part of signing work.
- Do not commit certificates, private keys, `.p12` files, provisioning profiles, App Store Connect API private keys, Apple passwords, or session tokens.
- Do not invent a Team ID, App Store Connect record, review account, or legal/metadata answer to make a check green.
- Keep the first TestFlight audience internal. External testing is a later decision and can trigger Beta App Review.
- Do not mark physical-device QA complete from Simulator, browser, or GitHub Actions evidence.

## New handoff contract

`native/first-testflight-handoff.json` records the owner/device/TestFlight state without storing credentials.

`node scripts/apple-signing-first-build.mjs` provides three levels of preflight:

```bash
# Static handoff validation; owner inputs may remain warnings.
node scripts/apple-signing-first-build.mjs

# Mac/Xcode must be present.
node scripts/apple-signing-first-build.mjs --require-macos

# Final local preflight before the first physical-device pass.
node scripts/apple-signing-first-build.mjs --require-macos --require-team --require-device
```

The strict local preflight expects:

- `SHOTLAB_DEVELOPMENT_TEAM` — the real 10-character Apple Developer Team ID;
- `SHOTLAB_DEVICE_UDID` — the connected/trusted physical iPhone identifier.

## Apple-account handoff

The owner must complete or confirm these account-level facts before a signed release candidate can be truthfully produced:

1. Active Apple Developer Program membership.
2. Explicit App ID for `com.shotlab.training`.
3. Matching App Store Connect app record.
4. Real 10-character Apple Developer Team ID.
5. Xcode signed into an Apple Account with access to the team.

Once the Team ID is known, configure the Xcode project locally:

```bash
SHOTLAB_DEVELOPMENT_TEAM=ABCDEFGHIJ npm run ios:configure-signing
```

Then open `ios/App/App.xcodeproj` and confirm the App target uses **Automatically manage signing** and the intended Apple team.

## First physical-iPhone gate

Connect and trust the release iPhone, enable Developer Mode, then record its device identifier in the shell session:

```bash
export SHOTLAB_DEVELOPMENT_TEAM=ABCDEFGHIJ
export SHOTLAB_DEVICE_UDID=<physical-iphone-udid>
node scripts/apple-signing-first-build.mjs --require-macos --require-team --require-device
```

Run the app on the physical iPhone from Xcode. Do not accept the device gate until all checks in `native/first-testflight-handoff.json` pass, including:

- cold launch and launch-to-Phase-7 transition;
- Dynamic Island/status-bar and home-indicator safe areas;
- authentication and keyboard behavior;
- registered Coach login/navigation;
- registered Player login/navigation;
- shot-log persistence;
- RSVP persistence;
- offline recovery without duplicate writes;
- account deletion reachability;
- background/foreground and session recovery.

## First signed archive

After physical-device QA is accepted:

```bash
node scripts/testflight-readiness.mjs --strict-owner --require-macos --require-signing
node scripts/ios-release.mjs release-candidate
```

The release command rebuilds and syncs the current production web bundle before archiving and creates `build/ShotLab.xcarchive`.

For the first upload, use Xcode Organizer to validate and distribute the archive to App Store Connect. This keeps the initial certificate/provisioning/upload diagnosis visible in Apple’s own UI.

## First internal TestFlight gate

After upload:

1. Wait for App Store Connect to finish processing the build.
2. Resolve any export-compliance or processing warnings.
3. Add build `1.0 (1)` to the internal group `ShotLab Internal`.
4. Install the build from the TestFlight app on a physical iPhone.
5. Repeat the Coach and Player smoke path from the TestFlight-installed build.
6. Record crashes, session failures, safe-area defects, stale/duplicate data, or App Store Connect warnings before advancing.

Only after this succeeds should `physicalDeviceQa`, `internalTestFlightBuild`, and the matching handoff fields be moved out of `pending`.

## External owner inputs still outside source control

The first internal TestFlight build can proceed before the full App Store marketing package is finished, but final App Review submission still requires the public Privacy/Terms/Support URLs, copyright, pricing, updated age-rating answers, App Store privacy answers, and stable Coach/Player review accounts tracked in the release profile.
