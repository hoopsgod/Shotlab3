# ShotLab TestFlight Release Runbook

## Native baseline

- Product name: ShotLab
- Provisional bundle identifier: `com.shotlab.training`
- Web build directory: `dist`
- Capacitor: `8.4.2`
- Native dependency manager: Swift Package Manager
- Initial device scope: iPhone, portrait

The bundle identifier is provisional until the Apple Developer account and App Store Connect record are created. Change it in both `capacitor.config.json` and `native/ios-release-profile.json` before the first signed archive if a different identifier is selected.

## Generate the iOS workspace

Use Node.js 22 or newer.

```bash
npm ci
npm run native:doctor
npm run native:prepare:ios
```

`native:prepare:ios` performs a production Vite build, installs the pinned Capacitor toolchain without modifying `package.json` or `package-lock.json`, creates the iOS project when absent, and otherwise runs a native sync.

Commit the generated `ios/` directory after the first successful generation. Capacitor treats native projects as source artifacts, not disposable build output.

## Daily native workflow

```bash
npm run native:sync:ios
npm run native:open:ios
```

Run `native:sync:ios` after web code, configuration, or native-plugin changes. `native:open:ios` requires macOS and opens the generated project in Xcode.

## Xcode release setup

1. Select the ShotLab app target.
2. Choose the Apple Developer team.
3. Confirm the bundle identifier matches the App Store Connect record.
4. Set the marketing version and increment the build number.
5. Keep the app iPhone-first and portrait-only for the initial beta unless product scope changes.
6. Replace generated placeholder icons and launch assets with approved ShotLab production artwork.
7. Test on a physical iPhone with the smallest supported screen and a current large-screen iPhone.
8. Archive with the Release configuration and upload through Xcode Organizer.

## Required pre-TestFlight checks

- Registered coach login, team access, roster, events, leaderboards, and player invitation flows work.
- Registered player login, shot logging, daily progress, events, and leaderboards work.
- Account deletion and data-deletion request surfaces remain accessible.
- Session expiration returns the user to a recoverable authentication state.
- Offline or failed shot-log submissions provide a visible retry path and do not create duplicates.
- The iOS keyboard does not cover authentication, join-code, profile, or shot-log inputs.
- Safe areas are correct around the status bar, Dynamic Island, and home indicator.
- No demo controls, debug panels, raw backend errors, or development URLs appear in the production build.

## App Store Connect items still required

The current release profile intentionally marks these as pending:

- Privacy policy URL
- Terms URL
- Support URL
- Coach review account
- Player review account

Do not submit the build for Apple review until all five are supplied and verified.

## Release gate

Run before every native release candidate:

```bash
npm ci
npm test
npm run build
npm run native:verify:ios -- --require-build --require-ios
npm run native:doctor
```
