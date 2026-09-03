# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merge baseline: `bae07347a87481847814f876b6afe458f34a63e0` (PR #1520 merged)
- Post-merge Cloudflare: `https://ed57c300.shotlab3.pages.dev`
- PR #1520 is closed. Do not reopen its mobile centering/filter-scroll work unless a regression test proves a break.

## Protected contracts

- Preserve Phase 1A mobile geometry and horizontal-axis guardrails.
- Preserve Phase 1B Demo/registered state parity.
- Preserve Phase 1C focused visual/runtime guardrails.
- Preserve Phase 2 CSS/layout authority; do not add competing mobile CSS ownership.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No desktop redesign, feature expansion, visual-baseline rewrite, or guardrail allowlist broadening.

## Current work

- Phase: **3A — Assignment state and service ownership**
- Branch: `agent/phase3a-assignment-state-ownership`
- Base: `bae07347a87481847814f876b6afe458f34a63e0`
- Data domain: player/coach assignments only.

## Phase 3 rules

1. One data domain per PR.
2. Stabilize selectors/services/state ownership before new product work.
3. Loading, empty, success, degraded cached data, denied, and failure states must not be silently conflated.
4. Preserve usable local fallback data during remote failures and identify degraded state truthfully.
5. Route/domain failures must remain recoverable and must not blank unrelated app surfaces.
6. No typography, spacing, layout, or decorative changes except minimal truthful state messaging.
7. Add focused service/selector tests plus an integration/source contract for each slice.
8. Do not merge without explicit authorization.

## Phase 3A implementation

- `playerAssignmentService.js` owns a shared assignment read-state contract: `success`, `empty`, `degraded`, `denied`, `failure`.
- Current-player and team assignment reads return `readState` without removing existing `ok`, `storageMode`, data, or error fields.
- `playerAssignmentHistoryService.js` reuses the same read-state contract for coach history reads.
- `PlayerCoachAssignmentCard.jsx` keeps cached assignment truth visible when refresh is degraded and renders explicit unavailable/denied messaging only when no assignment can be shown.
- `coachAssignmentDeadlineEnhancer.js` preserves the last known deadline map on hard failure/denial and owns only deadline/overdue decoration; it does not mutate the accountability summary owned by the accountability panel.
- Remote assignment delivery no longer announces an optimistic pre-POST write; successful remote truth is announced after the server response, while failed delivery retains the existing honest local fallback behavior.
- No CSS files, geometry allowlists, auth semantics, API routes, database migrations, or visual baselines are changed.

## Validation target

Before merge readiness:

- Focused assignment delivery/read-state tests pass.
- Assignment history/read-state tests pass.
- Assignment deadline recovery tests pass.
- Production build/performance budget stays green.
- Existing Phase 1A/1B/1C mobile guardrails stay green.
- Demo/registered parity and Production Acceptance stay green.
- Cloudflare Pages succeeds on the exact final PR head.
