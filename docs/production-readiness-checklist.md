# Production Readiness Checklist (App Store + Google Play)

## Date
- May 23, 2026 (UTC)

## A) Product/Auth/Data Readiness

- [ ] **Auth (coach/player)**
  - [ ] Supabase auth is required for production runtime.
  - [ ] No demo sign-in path is available in production builds.
  - [ ] Session expiry/re-auth path is tested on device.
- [ ] **Persistence**
  - [ ] Backend is source of truth for team, drills, sessions, shot logs, and progress data.
  - [ ] Local persistence is cache-only, with clear merge/retry rules.
  - [ ] Migration/backfill plan exists for legacy/local data.

## B) Legal/Compliance Readiness

- [ ] **Privacy Policy**
  - [ ] Public URL added and accessible from app sign-in/settings.
  - [ ] Describes account, team, and shot data handling.
- [ ] **Terms of Service**
  - [ ] Public URL added and accessible from app sign-in/settings.
  - [ ] Includes acceptable use, account ownership, and termination policy.

## C) Brand/App Asset Readiness

- [ ] **App Icons**
  - [ ] iOS app icon set finalized for required sizes.
  - [ ] Android adaptive icon + legacy icon finalized.
- [ ] **Splash Screen**
  - [ ] iOS launch/splash assets configured and validated.
  - [ ] Android splash screen configured and validated.

## D) Native Wrapper + Device QA

- [ ] **Native wrapper**
  - [ ] Capacitor wrapper initialized and synced with web build.
  - [ ] Bundle IDs/application IDs finalized for release tracks.
- [ ] **Device QA**
  - [ ] Login, join team, shot log, and leaderboard flows pass on real iOS devices.
  - [ ] Login, join team, shot log, and leaderboard flows pass on real Android devices.
  - [ ] Safe-area, keyboard, and scroll interactions validated.

## E) Distribution Readiness

- [ ] **TestFlight**
  - [ ] Internal TestFlight build uploaded.
  - [ ] Smoke checklist executed with coach+player test accounts.
- [ ] **Play Internal Testing**
  - [ ] Internal testing build uploaded to Play Console.
  - [ ] Smoke checklist executed with coach+player test accounts.

## F) Exit Gate for Public Beta

Ship to wider beta only when:
- [ ] All A-E sections are complete.
- [ ] Build + test suite pass on release branch.
- [ ] No demo-only behaviors are reachable in production runtime.
