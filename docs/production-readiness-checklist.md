# Production Readiness Checklist (Beta -> App Stores)

## Product + Accounts
- [ ] Auth hardened for production (signup, login, recovery, account deletion).
- [ ] Backend persistence enabled for key entities (teams, users, drills, logs, leaderboard state).
- [ ] Team membership lifecycle verified (create, join, leave, role changes).
- [ ] Join code flows validated (generate, share, redeem, expiration/abuse handling).

## Legal + Policy
- [ ] Privacy Policy drafted, reviewed, and hosted on public URL.
- [ ] Terms of Service drafted, reviewed, and hosted on public URL.

## Mobile Release Assets
- [ ] iOS and Android app icons exported at required sizes.
- [ ] Splash screens and launch assets prepared for both platforms.

## Capacitor + iOS Readiness
- [ ] Capacitor config finalized for production bundle IDs/environments.
- [ ] iOS project builds cleanly in Xcode with signing/capabilities configured.
- [ ] Required permission usage descriptions are complete (camera/media/etc if used).

## Android Readiness
- [ ] Android package/application IDs and signing config finalized.
- [ ] Play target SDK and policy compliance checklist completed.
- [ ] Required Android permissions and privacy disclosures validated.

## Distribution + Quality Gates
- [ ] TestFlight build pipeline and internal tester group configured.
- [ ] Google Play internal testing track configured.
- [ ] Crash/error monitoring connected (runtime errors, API failures, release health).
- [ ] Stability smoke suite green on CI before beta promotion.
