# ShotLab App Store Review Package

## Status

Engineering is being hardened for TestFlight from the merged Phase 7 product. Owner-supplied App Store Connect metadata, Apple Developer identity/signing, physical-device validation, and the first internal TestFlight build remain deliberately pending.

This document is a release handoff. It does not claim that App Store Connect metadata has been entered or that Apple has reviewed the app.

## Product identity

- Product name: ShotLab
- Bundle identifier: `com.shotlab.training` (provisional until the Apple Developer/App Store Connect record is confirmed)
- Version: `1.0`
- Build: `1`
- Primary category: Sports
- Device family: iPhone
- Orientation: Portrait
- Minimum iOS version: 15.0
- Product appearance: Phase 7 light-first UI with intentional dark performance moments
- Native launch/status shell: currently dark; must be accepted on a physical iPhone before release
- Custom encryption: No
- Advertising or cross-app tracking: No

As verified on August 12, 2026, App Store Connect requires iOS uploads to be built with Xcode 26 or later using the iOS 26 SDK or later. The release profile and release scripts enforce that minimum.

## App purpose

ShotLab is a coach-connected basketball training and team operations app. Coaches manage teams, player invitations, drills, events, strength and conditioning sessions, leaderboards, progress, and season archives. Players complete assigned training, log shots and drill results, manage attendance commitments, review rankings, and track development.

## Account and review flows

### Coach review flow

1. Sign in with the owner-provided coach review account.
2. Open the Coach dashboard.
3. Review Players, Events, Drills, Strength and Conditioning, Leaderboards, Activity, and Season Archive.
4. Create or inspect a player invitation.
5. Confirm account deletion and data-request controls are reachable from account settings.

### Player review flow

1. Sign in with the owner-provided player review account.
2. Review the Daily Training Command Center.
3. Open At Home and Program training workspaces.
4. Review Events, Strength and Conditioning, Leaderboards, and Profile.
5. Log a test result only when the review account is configured for disposable review data.
6. Confirm account deletion and data-request controls are reachable from Profile.

Production demo access is disabled by default. App Review must receive real, non-expiring review accounts or controlled review credentials. Do not submit development Demo Player or Demo Coach accounts as review credentials.

## App privacy inventory

The machine-readable disclosure source is `native/app-store-connect-privacy.json`. The native privacy manifest is `ios/App/App/PrivacyInfo.xcprivacy`.

### Data linked to the user for app functionality

- Name
- Email address
- User ID
- Fitness and exercise data, including shot makes, drill scores, training progress, attendance, and strength and conditioning activity
- Other user content, including coach-created drills, notes, events, and team branding settings

### Conditional analytics data

The application contains an internal analytics transport that is inactive unless `VITE_ANALYTICS_ENDPOINT` is configured in the submitted production build. When enabled, the App Store privacy answers must include:

- Device ID — linked to the user, analytics, not used for tracking
- Product Interaction — linked to the user, analytics, not used for tracking

Before archive creation, verify whether the production build includes `VITE_ANALYTICS_ENDPOINT`. The privacy manifest conservatively declares these categories so a configured analytics build does not under-report collection.

### Data not collected by the current app

- Precise or coarse location
- Contacts
- Photos or videos
- Audio data
- Payment information
- Purchase history
- Browsing history
- Advertising data

ShotLab does not currently request camera, microphone, photo-library, location, contacts, HealthKit, or Motion and Fitness permissions.

## Native privacy and security declarations

- `PrivacyInfo.xcprivacy` is included in the Xcode app target resources.
- Tracking is explicitly disabled.
- Tracking domains are empty.
- Required-reason API declarations for ShotLab-owned native code are empty because the current Swift application code does not call a covered API.
- Third-party SDK privacy manifests remain the responsibility of their respective SDK bundles and must be reviewed in Xcode's generated privacy report before submission.
- App Transport Security explicitly disallows arbitrary loads, arbitrary web-content loads, and local-network exceptions.
- Capacitor uses bundled web assets and does not configure a remote `server.url`.
- Capacitor does not configure `server.allowNavigation` domains.

## Legal and support surfaces

The app already contains accessible Privacy, Terms, Support, Data Request, and Delete Account surfaces. Before submission, the owner must provide public HTTPS URLs that resolve without authentication and match the in-app content.

Required owner inputs:

- Privacy policy URL: pending
- Terms URL: pending
- Support URL: pending
- Coach App Review account: pending
- Player App Review account: pending
- Copyright owner/legal name: pending
- Pricing decision: pending
- App Store age-rating questionnaire: pending
- App Store privacy answers: pending

Do not replace these values with guessed URLs, placeholder metadata, or temporary pages simply to make a gate green.

## Account deletion

ShotLab supports account creation, so the in-app deletion flow must remain easy to find and must initiate deletion of the account and associated personal data rather than only deactivating access. If final deletion is asynchronous, the app and policy must state the expected processing period and provide confirmation.

Before submission, verify the deletion flow against both review accounts and confirm removed player data no longer appears in active rosters, leaderboards, activity, events, or strength and conditioning attendance.

## TestFlight release blockers

1. Confirm the final bundle identifier registration in Apple Developer.
2. Provide the 10-character Apple Developer Team ID.
3. Create/confirm the matching App Store Connect app record.
4. Apply automatic signing with `npm run ios:configure-signing`.
5. Provide public Privacy, Terms, and Support URLs.
6. Complete copyright, pricing, age-rating, and App Store privacy metadata.
7. Create stable Coach and Player App Review accounts.
8. Run physical-iPhone QA, including safe areas, status-bar legibility, keyboard behavior, registered Coach/Player flows, offline recovery, and account deletion.
9. Generate Xcode's privacy report and reconcile third-party SDK manifests.
10. Create and validate the Release archive from the current synced production web bundle.
11. Upload the archive to App Store Connect and install the processed build through internal TestFlight.
12. Repeat the smoke path from the installed TestFlight build before treating the release as App Store-submission-ready.

## Verification commands

Static/code-ready validation:

```bash
npm ci
node scripts/configure-ios-privacy-readiness.mjs
git diff --exit-code -- ios/App/App.xcodeproj/project.pbxproj ios/App/App/Info.plist
npm run ios:release-readiness
node --test tests/app-store-privacy-review-readiness.test.mjs tests/testflight-release-readiness.test.mjs
npm run build:performance
```

macOS/native validation:

```bash
npm run native:sync:ios
npm run ios:validate
npm run ios:simulator-build
```

Signed release candidate, only after the external blockers are complete:

```bash
npm run ios:release-readiness:strict
npm run ios:release-candidate
```

## Apple source references

The release requirements in this package should be checked against Apple's current App Store Connect Help, App Review Guidelines, App Privacy documentation, screenshot specifications, and upcoming SDK minimum requirements immediately before submission.
