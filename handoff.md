# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merge baseline: `912beece42e1fcac143af01c0610c0751e6ae041` (PR #1529 merged)
- PR #1520, #1524, #1525, #1526, #1527, and #1529 are closed. Do not reopen their mobile-axis, assignment, coach follow-up, shot-log, RSVP, or score-state ownership work unless a regression test proves a break.

## Protected contracts

- Preserve Phase 1A mobile geometry and horizontal-axis guardrails.
- Preserve Phase 1B Demo/registered state parity.
- Preserve Phase 1C focused visual/runtime guardrails.
- Preserve Phase 2 CSS/layout authority.
- Preserve Phase 3A assignment state/service ownership.
- Preserve Phase 3B coach follow-up state/service ownership.
- Preserve Phase 3C shot-log hydration/state ownership.
- Preserve Phase 3D RSVP replacement/pending-sync state ownership.
- Preserve Phase 3E player drill-score pending-sync/hydration ownership.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No desktop redesign, feature expansion, visual-baseline rewrite, guardrail allowlist broadening, dependency upgrade, API authorization expansion, or database-schema expansion.

## Current work

- Phase: **Phase 3 closure — training-catalog hydration/replacement ownership**
- Branch: `agent/phase3-training-catalog-state-ownership`
- Base: `912beece42e1fcac143af01c0610c0751e6ae041`
- Data domain: signed team training catalog only (`/v1/training-catalog`, custom home drills, and custom program drills).

## Phase 3 rules

1. One data domain per PR.
2. Stabilize selectors/services/state ownership before new product work.
3. Loading, empty, success, degraded local data, denied, and failure states must not be silently conflated.
4. Preserve usable local fallback data during remote failures, but never allow stale local data to overwrite successful authoritative remote truth implicitly.
5. Route/domain failures must remain recoverable and must not blank unrelated app surfaces.
6. No typography, spacing, layout, or decorative changes except minimal truthful state messaging.
7. Add focused service/selector tests plus an integration/source contract for each slice.
8. Do not merge without explicit authorization.

## Closure-audit result

The post-#1529 ownership audit found one higher-risk remaining state-authority defect before Phase 3 can be considered complete:

- Registered `hydrateCatalog()` performs a successful signed GET.
- If that successful remote result is empty, the current client treats local custom drills as migration truth and immediately calls `syncCatalog()`.
- The signed synchronization endpoint is replacement-based and intentionally deletes omitted custom drills.
- Therefore a stale coach device can observe an intentionally empty authoritative remote catalog and recreate deleted drills merely by hydrating the app.
- Hydration is consequently acting as an implicit write path and can reverse valid server deletion truth.

Coach-priority failed-delivery ownership remains a lower-priority audit candidate, but it is outside this one-domain PR and must not be mixed into the training-catalog correction.

## Training-catalog ownership correction

- Registered successful hydration is read-only.
- Successful remote truth is authoritative even when the returned custom catalog is empty.
- Hydration must never POST, promote, or resurrect local custom drills as a side effect of a successful registered read.
- Explicit coach synchronization through `syncCatalog()` remains the only registered write authority and retains the existing signed authorization, team scope, replacement behavior, and static-demo filtering.
- Demo-local catalog behavior remains unchanged.
- Failed or malformed remote hydration continues to fail without replacing caller-held local fallback state.
- No endpoint, migration, database, authentication, visual, CSS, route-enhancer, or performance-budget change is authorized for this slice.

## Validation target

Before merge readiness:

- A successful registered empty catalog GET performs no POST and returns the empty remote catalog as authoritative truth.
- Stale local custom home/program drills cannot be resurrected by hydration after an intentional server-side deletion/replacement.
- An explicit coach `syncCatalog()` still posts custom drills, excludes static demo defaults, and uses the existing signed identity boundary.
- Player read / coach write authorization remains unchanged.
- Replacement synchronization still removes omitted custom drills only within the authorized team.
- Malformed or failed remote hydration does not silently replace usable caller-held local state.
- Existing Signed Training Catalog Persistence contracts pass.
- Production build/performance budget stays green without raising limits.
- Existing Phase 1A/1B/1C mobile guardrails stay green.
- Demo/registered parity, Phase 3 Release Certification, Phase 5 Hardening, Production Acceptance, and supporting release suites stay green.
- Cloudflare Pages succeeds on the exact final PR head.
