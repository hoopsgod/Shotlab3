# ShotLab Incremental Architecture Migration Plan

## Purpose (this pass)
This plan is intentionally **incremental**. It is designed for small, merge-safe PRs that preserve existing behavior and shipping momentum.

## Current high-risk areas (observed in this repo)
1. **`src/App.jsx` is a hotspot (3k+ lines, mixed concerns).**
   - It currently mixes routing-like flow control, auth session behavior, data mutation logic, presentation, constants, and large inline style/CSS blocks in one file.
2. **Feature boundaries are partially present but inconsistently enforced.**
   - Some domain code lives in `src/features/*`, while many UI and flow-specific components still live in `src/components/*` and are pulled directly into `App.jsx`.
3. **Service/infrastructure layering is transitional.**
   - There are wrapper layers (`src/services/...`) over `src/lib/...`, but ownership and intended import boundaries are not yet explicit.
4. **Token/source-of-truth duplication exists.**
   - `src/styles/tokens.js` and `src/spacing.js` both define spacing/token-like values, while CSS variables in `src/styles/design-system.css` are also in use.
5. **Routing foundation exists but is minimal.**
   - `src/app/routes/AppRoutes.jsx` currently returns `<App />` for all paths; route constants exist but are not yet enforced as true screen boundaries.
6. **Type and domain model boundaries are implicit.**
   - Data shapes are mostly inferred from usage/constants, which raises risk during incremental refactors.

---

## Migration principles (non-negotiable)
- No rewrite.
- Small PRs (target ~100-300 LOC touched per PR unless moving files).
- Behavior preservation first; visual redesign is out of scope.
- One architectural move at a time.
- Each phase must be independently revertible.
- Add guardrails (tests/checklists) before risky moves.

---

## Phase 0 — Guardrails and baselines (start here)
**Objective**
- Create a safe baseline so later structure changes can be validated quickly.

**Scope**
- Document current architecture constraints and add a lightweight migration checklist for PR authors.
- Capture baseline build/lint commands in docs (no behavior changes).

**Files likely affected**
- `docs/architecture-migration-plan.md` (this file)
- Optional: `docs/architecture-checklist.md`

**Why this is safe**
- Documentation-only change.

**What not to touch**
- No production source behavior.

**Success criteria**
- Team has a shared sequence and guardrails before code moves begin.

---

## Phase 1 — Decompose `App.jsx` by extraction only
**Objective**
- Reduce risk concentration in `src/App.jsx` without changing behavior.

**Scope**
- Extract stable, self-contained constants/config from `App.jsx` into nearby modules.
- Extract pure helper functions (no React hooks side effects) into dedicated files.
- Keep `App.jsx` as orchestration/composition layer; do not re-architect runtime flow yet.

**Files likely affected**
- `src/App.jsx`
- New files under `src/app/config/` (e.g., app-level constants), `src/shared/utils/` (pure helpers)

**Why this is safe**
- Mostly move-only + import rewiring; logic stays identical.

**What not to touch**
- No state ownership changes.
- No auth/session flow changes.
- No Firebase/storage behavior changes.
- No layout redesign.

**Success criteria**
- `App.jsx` line count decreases in small PRs.
- Each extraction has zero behavior diff and passes build checks.

---

## Phase 2 — Establish explicit feature boundaries (players/coach/branding/auth)
**Objective**
- Make ownership clear so future changes land in feature folders, not `App.jsx`/global components.

**Scope**
- Move obviously feature-owned components/utilities into:
  - `src/features/players/...`
  - `src/features/coach/...`
  - `src/features/branding/...`
  - `src/features/auth/...`
- Keep shared primitives in `src/shared/ui` and only truly cross-feature components in `src/components`.

**Files likely affected**
- Existing files in `src/components/*`
- Feature folders under `src/features/*`
- `src/App.jsx` imports only (wiring)

**Why this is safe**
- Mostly file moves + path updates; behavior can remain identical.

**What not to touch**
- No major component rewrites.
- No prop contract redesign unless required for move-only cleanup.

**Success criteria**
- New feature work can be added without editing global component folders.
- App compiles with unchanged runtime behavior.

---

## Phase 3 — Service-layer cleanup via import boundaries
**Objective**
- Clarify where app code gets data/auth/analytics access.

**Scope**
- Make `src/services/*` the application-facing layer.
- Restrict direct imports from `src/lib/*` to service adapters where possible.
- Add small comments/docs for each service boundary (auth, analytics, storage).

**Files likely affected**
- `src/services/analytics/analyticsService.js`
- `src/services/storage/cloudStoreAdapter.js`
- `src/features/auth/services/authService.js`
- `src/lib/*` (minimal, only if needed for adapter cleanup)
- `src/App.jsx` import paths

**Why this is safe**
- Interface-preserving wrapper cleanup; no backend contract changes.

**What not to touch**
- No broad Firebase/session redesign.
- No persistence schema changes.

**Success criteria**
- Most app/feature code depends on `services`, not `lib`.
- Build and smoke behavior stay unchanged.

---

## Phase 4 — State layering and render-path uncluttering
**Objective**
- Untangle state ownership so render logic is easier to reason about.

**Scope**
- Separate “app shell state” from “feature state” gradually.
- Introduce thin custom hooks near domains (e.g., coach view state, player view state) when extraction is straightforward.
- Move heavy derived calculations from render body to memoized selectors/helpers.

**Files likely affected**
- `src/App.jsx`
- `src/screens/PlayersScreen.jsx`
- `src/features/coach/components/CoachCommandCenter.jsx`
- New hook files in `src/features/*/hooks` as needed

**Why this is safe**
- Controlled, local extractions with no UI redesign.

**What not to touch**
- No global state library migration in this phase.
- No cross-cutting API contract changes.

**Success criteria**
- Fewer unrelated state variables in `App.jsx`.
- Clear ownership notes for each major state cluster.

---

## Phase 5 — Routing foundation (without full navigation rewrite)
**Objective**
- Turn existing route constants/foundation into real screen entry seams.

**Scope**
- Incrementally map one route at a time in `src/app/routes/AppRoutes.jsx`.
- Start with non-destructive top-level route separation (e.g., coach/player landing containers) while reusing existing components.
- Keep deep-linking and unknown-route fallback simple and backward-compatible.

**Files likely affected**
- `src/app/routes/AppRoutes.jsx`
- `src/app/routes/routePaths.js`
- Minimal container files under `src/screens` or `src/features/*`

**Why this is safe**
- Progressive route adoption with fallback to current app behavior.

**What not to touch**
- No full router migration of every flow at once.
- No permission/auth model rewrite in routing layer.

**Success criteria**
- At least one additional explicit route path renders a stable screen boundary.
- Existing default path behavior is preserved.

---

## Phase 6 — Token/source-of-truth cleanup
**Objective**
- Eliminate styling token ambiguity that increases refactor risk.

**Scope**
- Define canonical token source priority (CSS vars first, JS compatibility wrappers second).
- Gradually replace duplicate constants where safe.
- Add short docs on when to use `src/styles/tokens.js` vs CSS variables vs `src/spacing.js`.

**Files likely affected**
- `src/styles/tokens.js`
- `src/spacing.js`
- `src/styles/design-system.css`
- Touch points in `src/App.jsx` and heavily used UI primitives

**Why this is safe**
- Mostly naming/consistency alignment without UI redesign.

**What not to touch**
- No broad visual restyling.
- No large-scale class rename campaign.

**Success criteria**
- Reduced duplicate token definitions and clear source-of-truth guidance.

---

## Phase 7 — TypeScript foundation and explicit domain models (thin slice)
**Objective**
- Introduce type safety incrementally for the highest-churn boundaries.

**Scope**
- Start with JSDoc typedefs or `.d.ts`/small `.ts` islands for core models (Player, Drill, Event, TeamBranding, AuthUser).
- Apply types first to utilities/services with low UI coupling.
- Expand only after migration friction is understood.

**Files likely affected**
- `src/features/players/data/*`
- `src/features/branding/constants/*` and `utils/*`
- `src/shared/utils/*`
- Optional: `src/types/*`

**Why this is safe**
- Small, additive typing that does not force immediate component conversion.

**What not to touch**
- No repo-wide JS→TS conversion.
- No mass rename of file extensions in one PR.

**Success criteria**
- Core domain shapes are documented and validated at compile/editor level in at least one vertical slice.

---

## Reliability guardrails to add during phases
- Keep a rolling “migration smoke checklist” run on every PR:
  - app build
  - lint
  - basic auth boot path
  - player and coach landing path smoke
- Prefer adding targeted tests around extracted helpers before moving complex logic.
- For any move from `App.jsx`, require “no behavior change” note in PR template/checklist.

---

## Recommended first execution order (blunt)
1. **Phase 0 immediately** (already started by this doc).
2. **Phase 1 next** because `App.jsx` concentration is the largest technical risk and biggest merge-conflict magnet.
3. **Phase 2** to stop new boundary drift.
4. **Phase 3** to stabilize service imports before state/routing work.
5. **Phase 4 and Phase 5** in parallel small slices when Phase 1-3 have reduced churn.
6. **Phase 6 then Phase 7** after ownership boundaries are clearer.

If only one phase can be funded now: **do Phase 1**. It yields immediate risk reduction with the lowest behavior-change surface.

---

## Known planning ambiguities (where repo is inconsistent)
- `App.jsx` currently contains both orchestration and large style/token payloads, so extraction order must be decided PR-by-PR based on conflict risk.
- Some components under `src/components` may be shared despite looking feature-specific; ownership confirmation is required before moving.
- Existing route foundation is intentionally minimal; exact route rollout depends on current production URL assumptions.
