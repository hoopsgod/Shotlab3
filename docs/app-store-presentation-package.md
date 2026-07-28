# ShotLab App Store Presentation Package

## Status

The listing copy and screenshot plan are prepared for App Store Connect. Public legal/support URLs, copyright owner, pricing, age-rating answers, and App Review credentials remain owner-supplied fields.

This package does not claim that metadata has been entered in App Store Connect or that screenshots have been uploaded.

## Listing copy

The machine-readable source is `native/app-store-listing.json`.

### Name

ShotLab

### Subtitle

Basketball Training, Connected

### Promotional text

Turn daily basketball work into visible progress with coach priorities, shot logging, team events, strength sessions, leaderboards, and season insight.

### Positioning

ShotLab is a coach-connected basketball development platform. The listing should lead with the daily Player experience, then prove that the Coach experience provides the program structure behind it.

The value sequence is:

1. The player knows what to do today.
2. Training work becomes visible progress.
3. Coach priorities stay connected to player action.
4. Coaches can operate the full program from one place.
5. Player intelligence makes follow-up more precise.
6. Event readiness reduces manual chasing.

## Screenshot set

The automated screenshot job produces six 1290 × 2796 JPEG assets for the iPhone 6.9-inch display class.

Each asset uses:

- a real ShotLab screen rendered from deterministic, non-personal seed data;
- a restrained dark athletic background;
- one benefit-led headline;
- one supporting sentence;
- a rounded app frame without fake Apple hardware or unsupported feature claims;
- no transparency;
- no browser chrome;
- no external stock imagery;
- no personal or production account information.

### Sequence

1. **Player Daily Command Center** — establishes the daily-use value proposition.
2. **Player At Home** — shows shot logging, daily drills, and progress.
3. **Player Program** — connects the player to coach priorities.
4. **Coach Mission Control** — shows program-wide operations.
5. **Coach Player Intelligence** — demonstrates actionable development insight.
6. **Coach Event Readiness** — demonstrates attendance and response management.

## Asset generation

```bash
npm ci
npm install --no-save @playwright/test@1.55.1
npx playwright install chromium
npm run build
npx playwright test --config=playwright.screenshots.config.mjs
node scripts/validate-app-store-screenshots.mjs
```

Generated assets are written to:

`artifacts/app-store/iphone-6.9/`

The assets are intentionally CI artifacts rather than committed binary files. This keeps the repository reviewable and ensures screenshots can be regenerated from the exact release candidate.

## Copy and asset constraints

The verification contract enforces:

- app name no longer than 30 characters;
- subtitle no longer than 30 characters;
- promotional text no longer than 170 characters;
- description no longer than 4,000 characters;
- keywords no longer than 100 UTF-8 bytes;
- one to ten screenshots;
- exactly six planned screenshots for this launch set;
- exact 1290 × 2796 dimensions;
- JPEG output, which cannot contain an alpha channel;
- unique file names and sequence numbers;
- no unresolved URLs or credentials falsely represented as complete.

## Owner review before upload

Before the assets are uploaded to App Store Connect, the owner should review the generated artifact set on a calibrated display and confirm:

1. the text accurately describes the submitted build;
2. the team branding shown is acceptable as generic launch imagery;
3. no screenshot exposes production data;
4. the final screenshot order supports the desired sales story;
5. the public Privacy, Terms, and Support URLs are live;
6. Coach and Player App Review accounts are stable and non-expiring;
7. the copyright owner, pricing, and age-rating answers are finalized.

## Apple source references

- App information fields: https://developer.apple.com/help/app-store-connect/reference/app-information/app-information
- Platform version information: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
- Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
- App Review information: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/provide-app-review-information
