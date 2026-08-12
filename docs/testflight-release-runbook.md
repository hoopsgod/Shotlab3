# ShotLab TestFlight Release Runbook

## Release baseline

- Product name: ShotLab
- Provisional bundle identifier: `com.shotlab.training`
- Marketing version: `1.0`
- Initial build number: `1`
- Web build directory: `dist`
- Capacitor: `8.4.2`
- Native dependency manager: Swift Package Manager
- Initial device scope: iPhone, portrait
- Minimum deployment target: iOS 15.0
- Release profile: `native/ios-release-profile.json`

The bundle identifier remains provisional until the Apple Developer account and App Store Connect record are confirmed. Change it in both `capacitor.config.json` and `native/ios-release-profile.json`, then run the signing configurator before the first signed archive if a different identifier is selected.

## Current Apple upload minimum

As verified on August 12, 2026, App Store Connect requires iOS uploads to be built with Xcode 26 or later using the iOS 26 SDK or later. The ShotLab release profile and release scripts enforce that floor. Re-check Apple's current submission requirements before a later release if this repository has been idle for a material period.

## What “code-ready” means

The repository can be code-ready before it is submit-ready. `node scripts/testflight-readiness.mjs` is allowed to finish with warnings for external inputs that cannot be created safely in source control.

Code-ready requires:

- the Capacitor and Xcode bundle identifiers to agree;
- marketing version and build number to agree with the release profile;
- iPhone-only and portrait-only target configuration;
- App Transport Security to remain fail-closed;
- the privacy manifest to remain bundled and aligned with the App Store privacy inventory;
- an accepted iPhone 6.9-inch screenshot specification with one to ten screenshots;
- no remote `server.url` native loading;
- current Apple Xcode/iOS SDK minimums recorded in the profile;
- native release scripts that rebuild and sync the current production web bundle before a device build or archive.

## External blockers that must remain visible

The current release profile intentionally keeps these items `pending` until they are completed outside the repository:

- Apple Developer Team ID
- App Store Connect app record
- Privacy policy public URL
- Terms public URL
- Support public URL
- Copyright owner/legal name
- Pricing decision
- Updated App Store age-rating questionnaire
- App Store Connect privacy answers
- Coach App Review account
- Player App Review account
- Physical-device QA
- First internal TestFlight build

Do not replace these values with guesses merely to make a check green.

## Generate or refresh the iOS project

Use Node.js 22 or newer.

```bash
npm ci
npm run native:doctor
npm run native:prepare:ios
node scripts/testflight-readiness.mjs
```

`native:prepare:ios` performs a production Vite build, installs the pinned Capacitor toolchain without modifying `package.json` or `package-lock.json`, creates the iOS project when absent, and otherwise runs a native sync. It also regenerates the committed native icon and splash assets.

Capacitor native projects are source artifacts. Keep `ios/` committed.

## Daily native workflow

```bash
npm run native:sync:ios
npm run native:open:ios
```

Run `native:sync:ios` after web code, configuration, native-plugin, or production-asset changes.

## macOS/Xcode validation

On a Mac with Xcode installed:

```bash
npm run ios:validate
npm run ios:simulator-build
```

Both commands enforce the Xcode 26 / iOS 26 SDK floor. The simulator build rebuilds and syncs the current production web bundle before compiling, so it cannot silently test stale committed WebView assets.

## Configure signing

Do not commit certificates, private keys, App Store Connect API keys, or passwords.

Once the Apple Developer Team ID is known:

```bash
SHOTLAB_DEVELOPMENT_TEAM=XXXXXXXXXX npm run ios:configure-signing
```

If the final App Store bundle identifier differs from `com.shotlab.training`, also provide `SHOTLAB_BUNDLE_ID` and update the root Capacitor/release-profile identifiers first.

Then run:

```bash
node scripts/testflight-readiness.mjs
npm run ios:device-build
```

The signed device command refuses to proceed without a configured Team ID.

## Required physical-device QA

Before the first TestFlight archive, test the Release-equivalent native shell on at least one current physical iPhone. Prefer testing both a smaller supported iPhone and a current large-screen/Dynamic Island device when available.

Verify:

- cold launch transitions cleanly from the native launch screen into the Phase 7 UI;
- status-bar text remains legible on Auth, Coach Home, Coach secondary pages, Player Home, and Player secondary pages;
- cream/light-first content does not expose a dark native seam around safe areas;
- Dynamic Island/status-bar and home-indicator safe areas are correct;
- the keyboard does not cover authentication, join-code, profile, or shot-log inputs;
- registered Coach login, team access, roster, events, leaderboards, invitations, and season flows work;
- registered Player login, shot logging, progress, events, program work, and leaderboards work;
- account deletion remains accessible;
- session expiration returns to a recoverable authentication state;
- offline or failed shot-log submissions show recovery UI and do not duplicate data;
- no demo controls, raw backend errors, debug panels, localhost URLs, preview URLs, or development-only affordances appear.

Do not mark `physicalDeviceQa` complete from simulator or browser screenshots alone.

## App Store metadata and screenshots

The current listing profile uses six iPhone 6.9-inch portrait screenshots at `1290 x 2796`, JPEG. Apple currently accepts one to ten screenshots and accepts `1260 x 2736`, `1290 x 2796`, or `1320 x 2868` for 6.9-inch portrait submissions. Screenshots must not contain alpha/transparency.

The repository stores screenshot copy/specification, but App Store Connect remains the source of truth for the actual uploaded media and metadata.

## Create the release-candidate archive

After signing is configured and physical-device QA is complete:

```bash
node scripts/testflight-readiness.mjs --strict-owner --require-macos --require-signing
node scripts/ios-release.mjs release-candidate
```

`node scripts/ios-release.mjs release-candidate` performs these safeguards before archiving:

1. verifies macOS, Xcode, and the iOS SDK;
2. rebuilds the current production web app;
3. runs Capacitor iOS sync so the archive contains the current web bundle;
4. regenerates native assets;
5. re-runs release readiness with signing required;
6. creates `build/ShotLab.xcarchive` using the Release configuration.

The strict readiness command is expected to fail until all owner/device/TestFlight requirements have been deliberately completed.

## Upload to TestFlight

Open the archive in Xcode Organizer, validate it, then distribute it to App Store Connect. Use internal TestFlight testing first. After the build finishes processing in App Store Connect:

- verify the processed bundle/version/build number;
- install through TestFlight on a physical iPhone;
- repeat the release smoke path using registered Coach and Player accounts;
- record any App Store Connect warnings;
- only then mark `internalTestFlightBuild` complete in the release profile.

External TestFlight testing can require Beta App Review. Do not treat an internal upload as App Store review approval.

## App Review submission gate

Do not submit the build for Apple review until all release-profile requirements are resolved and verified. In particular, do not submit with pending public URLs, placeholder copyright/pricing, unanswered privacy/age-rating metadata, missing review credentials, incomplete physical-device QA, or no verified internal TestFlight build.

The final repository gate is:

```bash
npm ci
npm test
npm run build:performance
node scripts/testflight-readiness.mjs --strict-owner --require-macos --require-signing
node scripts/ios-release.mjs release-candidate
```
