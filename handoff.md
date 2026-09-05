# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merge baseline: `87c824aa4624f166b7ad9326ad08ea8b548e5dc4` (PR #1527 merged)
- PR #1520, #1524, #1525, #1526, and #1527 are closed. Do not reopen their mobile-axis, assignment, coach follow-up, shot-log, or RSVP ownership work unless a regression test proves a break.

## Protected contracts

- Preserve Phase 1A mobile geometry and horizontal-axis guardrails.
- Preserve Phase 1B Demo/registered state parity.
- Preserve Phase 1C focused visual/runtime guardrails.
- Preserve Phase 2 CSS/layout authority.
- Preserve Phase 3A assignment state/service ownership.
- Preserve Phase 3B coach follow-up state/service ownership.
- Preserve Phase 3C shot-log hydration/state ownership.
- Preserve Phase 3D RSVP replacement/pending-sync state ownership.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No desktop redesign, feature expansion, visual-baseline rewrite, or guardrail allowlist broadening.

## Current work

- Phase: **3E — player drill-score pending-sync and hydration state ownership**
- Branch: `agent/phase3e-score-state-ownership`
- Base: `87c824aa4624f166b7ad9326ad08ea8b548e5dc4`
- Data domain: `sl:scores` / signed player drill-score writes, startup reads, and registered post-auth hydration only.

## Phase 3 rules

1. One data domain per PR.
2. Stabilize selectors/services/state ownership before new product work.
3. Loading, empty, success, degraded local data, denied, and failure states must not be silently conflated.
4. Preserve usable local fallback data during remote failures and identify unsynced truth explicitly.
5. Route/domain failures must remain recoverable and must not blank unrelated app surfaces.
6. No typography, spacing, layout, or decorative changes except minimal truthful state messaging.
7. Add focused service/selector tests plus an integration/source contract for each slice.
8. Do not merge without explicit authorization.

## Phase 3E problem

- Player drill-score writes persist `sl:scores` locally before the existing strict signed remote write completes.
- A failed `/v1/scores` write can therefore leave a newer intended score safely retained in local storage while the UI correctly reports that team-dashboard sync failed.
- Startup `DB.get("sl:scores")` currently prefers any non-empty remote score set over the local collection, so a reload can hide the newer failed local score before post-auth hydration runs.
- Registered post-auth hydration also replaces `sl:scores` wholesale with `/v1/scores`, so it can erase the retained failed score entirely.
- A blanket local/remote union is not acceptable because authorized score deletion exists and stale non-pending local rows must not be resurrected.

## Phase 3E implementation

- Use one compact pending-score sidecar, `sl:sp`, containing the exact normalized requester, team, and failed/in-flight score IDs.
- Mark score IDs pending before the signed score POST and remove only the IDs confirmed by a successful server response.
- Validate pending ownership against the registered session identity and the existing private identity/team scope token before preserving local score truth.
- Reconcile score startup reads and post-auth hydration through the same score-domain policy: remote rows remain authoritative; only locally retained rows whose exact IDs are still marked pending may survive when absent remotely.
- When a pending ID appears remotely, remote truth replaces the local copy and the marker is cleared for that ID.
- A successful authorized delete of the current player's score collection clears that player's pending score ownership for the deleted team.
- `sl:program-scores`, shot logs, RSVP, S&C, API authorization, database schema, layout, typography, and visual baselines remain unchanged.
- Do not raise the existing JavaScript or CSS performance budgets. The post-#1527 baseline has only 13 bytes of gzip margin, so runtime additions must be offset with behavior-equivalent compaction if necessary.

## Validation target

Before merge readiness:

- A failed signed score write remains explicitly pending and survives both startup reads and post-auth hydration.
- Non-pending local scores absent from successful remote truth are not preserved by the Phase 3E reconciliation path.
- Matching remote score rows become authoritative and clear matching pending IDs.
- Pending score state is isolated by identity and team and cannot leak across a team switch.
- Successful own-score deletion clears stale pending ownership for that player/team.
- `sl:program-scores` behavior remains unchanged.
- Existing signed score authorization/persistence tests pass.
- Production build/performance budget stays green without raising limits.
- Existing Phase 1A/1B/1C mobile guardrails stay green.
- Demo/registered parity, Phase 5 Hardening, Phase 3 Release Certification, and Production Acceptance stay green.
- Cloudflare Pages succeeds on the exact final PR head.
