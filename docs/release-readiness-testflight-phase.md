# Release Readiness / TestFlight Phase

## Goal

Move ShotLab from a visually certified web product to a native iPhone release candidate without weakening the accepted Phase 7 UI, runtime behavior, privacy posture, or performance budgets.

## Phase boundaries

This phase does not redesign product screens and does not invent Apple-account metadata. It hardens the native packaging/release path and separates three states that must not be conflated:

1. **Code-ready** — repository metadata, privacy, native configuration, web/native sync, and iPhoneOS compilation are green.
2. **Signed-device-ready** — Apple Team/bundle registration exists and the app installs successfully on a physical iPhone.
3. **TestFlight/App-Store-ready** — owner metadata is complete, physical-device QA is accepted, an internal TestFlight build is installed and verified, and App Store Connect has no unresolved submission blockers.

## Engineering acceptance

- Capacitor root/native configs use the same bundle identifier and `dist` web bundle.
- Xcode marketing version/build number match the release profile.
- iPhone-only, portrait-only, iOS 15+ target remains locked.
- App Transport Security remains fail-closed.
- Privacy manifest remains bundled and aligned with App Store privacy inventory.
- Release profile records the current Apple upload floor: Xcode 26+ and iOS 26 SDK+.
- Release-candidate archives rebuild and Capacitor-sync the current production web bundle before archive creation.
- Signed device/archive commands refuse to proceed without a configured Apple Team.
- App Store screenshot metadata uses a currently accepted 6.9-inch portrait size and one-to-ten count.
- CI compiles both a simulator build and an unsigned Release build against the iPhoneOS SDK on macOS.
- Fixed web performance budgets remain unchanged.

## External acceptance

The following cannot be truthfully completed by repository CI and remain explicit release-profile requirements until verified:

- Apple Developer Team ID
- App Store Connect app record
- public Privacy / Terms / Support URLs
- copyright / pricing
- updated age-rating questionnaire
- App Store privacy answers
- Coach and Player review accounts
- physical-device QA
- first internal TestFlight build

## Physical-device visual gate

The Phase 7 product is light-first, while the committed native launch/status shell is currently dark. Do not guess at a status-bar/native-shell change from browser screenshots. Physical-device QA must verify cold launch, status-bar legibility, Dynamic Island/safe-area seams, keyboard avoidance, and home-indicator spacing across Auth plus primary Coach and Player surfaces.

Only after that evidence exists should the native shell style be changed or accepted.

## Closure commands

### Repository / CI

```bash
npm ci
npm test
npm run build:performance
node scripts/testflight-readiness.mjs
```

### macOS

```bash
npm run native:sync:ios
npm run ios:validate
npm run ios:simulator-build
```

### Signed release candidate

```bash
node scripts/testflight-readiness.mjs --strict-owner --require-macos --require-signing
node scripts/ios-release.mjs release-candidate
```

The strict command is intentionally blocked until every external release requirement has been deliberately completed.
