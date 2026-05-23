# MVP Production Scope + Backend Readiness

## Date
- May 23, 2026 (UTC)

## Purpose
This document defines the **minimum real product scope** for ShotLab and the architecture steps needed to move from polished demo behavior to App Store / Google Play-ready behavior.

## 1) Demo-only / Local-only Systems Inventory

The following systems are still demo-oriented, local-only, or placeholder-based and must be gated/removed from production runtime.

| Area | Current behavior | Evidence | Production requirement |
|---|---|---|---|
| Demo mode toggle | URL and localStorage can force demo runtime (`?demo=1`, `sl:demoMode`) | `src/lib/demoMode.js`, `src/lib/src/lib/demoMode.js` | Disable in production builds; permit only dev/staging flags |
| Demo coach/player identities | Demo sign-in/user bootstrap logic exists | `src/App.jsx`, `src/lib/demoBootstrap.ts` | Replace with authenticated Supabase users only |
| Mock/demo datasets | Demo drills/players/activities are seeded locally | `src/lib/demoData.js`, `src/App.jsx` | Read from backend domain tables scoped to team membership |
| Demo coach tools | UI actions for loading/clearing demo state | `src/components/CoachToolsPanel.jsx` | Hide in production builds; keep only in internal QA mode |
| Local-only persistence fallback | Core app state can persist/read from local/session storage | `src/lib/appPersistenceService.js` | Backend as source of truth; local cache only for resilience |
| Fake/temporary team state | Join/restore flows include compatibility/legacy behaviors | `src/lib/authFlow.js`, `functions/v1/teams/restore-context/index.js` | Canonical team membership resolution tied to authenticated user |
| Temporary join code compatibility | Invite and legacy code bridge logic still carries migration shims | `functions/v1/team-invites/context/start.js`, `functions/v1/team-memberships/confirm-context.js`, `migrations/*invite*` | Stable join-code issuance/consumption contract with expiry + audit trail |
| Placeholder activity/leaderboard states | Empty/loading/fallback states are mixed with permissive mock behavior | `src/lib/activityFeed.js`, `src/components/HomeShotsLeaderboardCard.jsx`, `functions/v1/leaderboards/home-shots.js` | Deterministic backend responses, explicit empty states, no demo-masked errors |

### Exit criteria for demo/local cleanup
- No production path can authenticate as demo users.
- No production path reads demo seed data as primary content.
- Team and leaderboard views render from backend-owned entities only.
- Local storage is cache/UX optimization, not canonical product state.

---

## 2) MVP Backend/Data Roadmap

### Core product entities (MVP required)
- **Accounts**
  - Coach accounts
  - Player accounts
- **Team model**
  - Teams
  - Team membership (coach/player role)
  - Join codes (issue, consume, expire, audit)
- **Training model**
  - Drills
  - Sessions
  - Shot logs
- **Insight model**
  - Leaderboards
  - Coach priorities
  - Progress history

### Canonical data contracts (target)
- `users` (identity, role profile)
- `teams` (ownership, branding metadata)
- `team_members` (role + status + joined_at)
- `join_codes` (team_id, code_hash, expires_at, consumed_by)
- `drills` (coach-authored definitions)
- `sessions` (scheduled/completed training context)
- `shot_logs` (player shot events and aggregates)
- `coach_priorities` (coach focus items tied to team/player)
- `progress_history` (materialized snapshots for trend charts)
- `leaderboard_views` or RPC-backed leaderboard responses

### Phase plan (architecture-first)
1. **Contract freeze and ownership mapping**
   - Map every active front-end state slice to one backend owner table.
   - Define id strategy (`uuid`), timestamps, and role-based read/write matrix.
2. **Auth and identity hardening**
   - Supabase-authenticated coach/player flows become required path.
   - Remove/retire legacy auth and demo account fallback from production runtime.
3. **Team membership integrity**
   - Enforce all team data access through `team_members` + RLS.
   - Join code consume path writes membership transactionally.
4. **Training write path normalization**
   - Route drills/sessions/shot logs through validated backend contracts.
   - Enforce idempotency for client retries.
5. **Leaderboard + progress reliability**
   - Shift to deterministic SQL view/RPC inputs.
   - Ensure empty-state semantics are explicit (no permission-like ambiguity).
6. **Observability and recovery hooks**
   - Add audit fields and diagnostics for join/auth failures.
   - Add backfill scripts for historical data cleanup.

### Non-goals for this phase
- Full backend migration of all features in one PR.
- Any visual redesign or net-new UX modules.

---

## 3) Code Organization Changes for This Phase (No Full Migration)

This PR phase should stay mostly planning/structure oriented:
- Keep existing UI/UX behavior stable.
- Add/maintain documentation and checklists that define backend ownership boundaries.
- Keep demo/runtime gating tasks explicit and implementation-ready.

Suggested near-term code-organization follow-ups:
- Centralize runtime environment gating for demo utilities.
- Introduce a domain-contract document per entity group (`accounts`, `teams`, `training`, `insights`).
- Split persistence adapters into:
  - `remoteSourceOfTruth` (required in prod)
  - `localCacheAdapter` (optional resilience layer)

---

## 4) Production Readiness Checklist (Store Readiness)

See `docs/production-readiness-checklist.md` for the actionable checklist covering:
- auth
- persistence
- privacy policy
- terms
- app icons
- splash screen
- native wrapper
- TestFlight
- Play internal testing

---

## 5) Acceptance Mapping

| Acceptance requirement | Coverage |
|---|---|
| Demo-only systems clearly identified | Section 1 inventory and exit criteria |
| MVP backend needs documented | Section 2 entity + phase roadmap |
| PR remains architecture/planning focused | Section 3 scope boundaries |
| UI/UX preserved | Explicitly constrained in Sections 3 and non-goals |
| Build/tests pass | Validated by repo checks in PR test run |
