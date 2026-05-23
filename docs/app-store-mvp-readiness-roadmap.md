# ShotLab App Store MVP Readiness Roadmap

## Date
- May 23, 2026 (UTC)

## 1) Minimum Shippable MVP (Scope Lock)

This is the **minimum beta candidate** for TestFlight / Play internal testing. Anything outside this list is post-MVP.

### In-scope (must ship)
- Coach account creation and login
- Player account creation and login
- Team creation (coach-owned)
- Player join via coach join code
- Coach-created drills (home + program)
- Player shot logging (daily makes)
- Player progress visibility (streak/completion snapshot)
- Basic leaderboard (player home shots)
- Persistent team data across sessions/devices

### Out-of-scope (post-MVP)
- New game-like UI modules
- Expanded social/feed features
- Advanced analytics beyond current snapshot metrics
- Complex push-notification orchestration
- Major visual redesign work

### MVP success criteria
- New coach can create a team and invite a player in <5 minutes
- Player can join, log shots, and see updated progress in <60 seconds
- Leaderboard loads without broken states for default player flows
- Data survives app restart/logout/login and multi-device reads

---

## 2) Backend Migration Path (Supabase-first)

## Target production architecture
- **Auth**: Supabase Auth (email/password first; social providers optional later)
- **Data**: Postgres via Supabase tables + RLS
- **Server logic**: Existing edge functions retained and normalized for prod contracts
- **Client persistence**: local cache for offline/latency tolerance, backend as source of truth

### Canonical domain tables (phase target)
- `users`
- `teams`
- `team_members`
- `drills`
- `sessions` (workout/program sessions)
- `shot_logs`
- `leaderboards` (materialized view or RPC-computed)
- `coach_priorities`

### Suggested migration phases
1. **Schema freeze + contract mapping**
   - Map all current front-end state slices to canonical tables.
   - Define required fields, IDs, timestamps, and foreign keys.
2. **Auth hardening**
   - Move all active sessions to Supabase session handling.
   - Remove legacy/local auth fallback from production path.
3. **Membership integrity**
   - Enforce `team_members` ownership + role constraints with RLS.
   - Gate all team reads/writes by membership.
4. **Write path migration**
   - Route drill, shot log, and coach-priority writes through backend-only validated endpoints.
5. **Leaderboard reliability**
   - Replace mixed permissive fallback with deterministic RPC/view behavior.
   - Return UX-safe empty states instead of permission-like errors in player home path.
6. **Observability + backfill**
   - Add migration/backfill scripts and production diagnostics for auth/team resolution.

### Data rules to enforce before beta
- All records carry stable `team_id` and actor identity
- No cross-team reads from player clients
- Soft-delete strategy defined for drills/sessions/logs
- Idempotent write contracts for shot logs

---

## 3) Demo-only / Non-production Audit

Below are current demo or local-only behaviors that must be gated or removed from production runtime.

### High-priority demo/runtime items
- Demo mode URL/sticky flag (`?demo=1`, `sl:demoMode`) still active.
- Demo account bootstrap and sign-in paths in auth flow.
- Demo data loader/clear tools exposed in coach tools.
- Default demo drill catalogs and seeded demo IDs.
- Local/session persistence fallbacks still used in active flows.

### File-level audit inventory
- `src/lib/demoMode.js` and `src/lib/src/lib/demoMode.js`
- `src/lib/demoData.js`
- `src/lib/demoBootstrap.ts`
- `src/main.jsx` (demo bootstrap invocation)
- `src/App.jsx` (demo users, demo sign-in, demo tooling, default demo drill constants)
- `src/components/CoachToolsPanel.jsx` (localStorage-only UI state)
- `src/lib/appPersistenceService.js` + local cache usage paths

### Required actions
- Add explicit `VITE_APP_ENV=production` guard that disables demo flows entirely.
- Remove demo CTA exposure from production auth UI.
- Hide/disable coach demo tools outside non-prod builds.
- Confirm all critical reads/writes succeed with backend only when online.

---

## 4) Native App Path (Capacitor Readiness)

## iOS/Android packaging readiness checklist

### Build system
- Add Capacitor project (`ios/`, `android/`) and pinned versions.
- Confirm deterministic web build output path for `npx cap sync`.
- Establish CI lanes for `web build -> cap sync -> native build`.

### Device UX baseline
- Verify safe-area behavior on notch/home-indicator devices.
- Ensure keyboard + input fields in auth/log-shot flows do not clip.
- Validate sticky headers/bottom nav on iOS Safari WebView and Android WebView.

### App identity assets
- App name, bundle IDs/applicationId
- Splash screen and adaptive icons (light/dark variants)
- Privacy strings (camera/photos if ever added later; currently keep minimal)
- Versioning strategy: semver + build number

### Offline and error-state baseline
- Define offline mode behavior for shot log attempts (queue vs fail-fast)
- User-visible retry states for leaderboard/network failures
- Session-expiry recovery UX (forced refresh + re-auth)

### Release readiness artifacts
- Privacy policy URL
- Terms URL
- Support URL/email
- Test accounts + scripted smoke checklist

---

## 5) Preserve visual direction / avoid feature creep

- Keep current visual system and interaction model.
- Only make readability/accessibility fixes that improve production confidence.
- Do not add new dashboard modules until MVP backend + native packaging are stable.

---

## Execution order (recommended)
1. Scope-lock MVP + freeze non-MVP work.
2. Demo/offline audit and production gating.
3. Supabase contract completion + RLS verification.
4. Leaderboard and player-home reliability hardening.
5. Capacitor bootstrap and device QA.
6. Internal beta release (TestFlight + Play Internal).

