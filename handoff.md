# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merge baseline: `cc5ee5278e15a832a721cd1eb9984048b01c6c85` (PR #1525 merged)
- PR #1520, #1524, and #1525 are closed. Do not reopen their mobile-axis, assignment-state, or coach follow-up ownership work unless a regression test proves a break.

## Protected contracts

- Preserve Phase 1A mobile geometry and horizontal-axis guardrails.
- Preserve Phase 1B Demo/registered state parity.
- Preserve Phase 1C focused visual/runtime guardrails.
- Preserve Phase 2 CSS/layout authority.
- Preserve Phase 3A assignment state/service ownership.
- Preserve Phase 3B coach follow-up state/service ownership.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No desktop redesign, feature expansion, visual-baseline rewrite, or guardrail allowlist broadening.

## Current work

- Phase: **3C — Shot-log post-auth hydration and state ownership**
- Branch: `agent/phase3c-shot-log-state-ownership`
- Base: `cc5ee5278e15a832a721cd1eb9984048b01c6c85`
- Data domain: `sl:shotlogs` / signed shot-log reads and hydration only.

## Phase 3 rules

1. One data domain per PR.
2. Stabilize selectors/services/state ownership before new product work.
3. Loading, empty, success, degraded local data, denied, and failure states must not be silently conflated.
4. Preserve usable local fallback data during remote failures and identify unsynced truth explicitly.
5. Route/domain failures must remain recoverable and must not blank unrelated app surfaces.
6. No typography, spacing, layout, or decorative changes except minimal truthful state messaging.
7. Add focused service/selector tests plus an integration/source contract for each slice.
8. Do not merge without explicit authorization.

## Phase 3C problem

- `remotePersistence.mergeHydratedRows("sl:shotlogs", ...)` already owns shot-log reconciliation semantics.
- That merge keeps unmatched failed/local retry rows and lets remote rows replace matching IDs as authoritative `remote_saved` truth.
- Registered post-auth hydration in `legacySignedCollectionPersistence.js` bypassed that policy and wrote `/v1/shot-logs` directly over `sl:shotlogs`.
- A login or post-auth hydration could therefore erase a locally retained failed shot record before it was retried, even though the application already had a correct domain merge policy.

## Phase 3C implementation

- Route post-auth `sl:shotlogs` hydration through the existing `mergeHydratedRows` shot-log policy before storage replacement.
- Keep all other authenticated collection hydration behavior unchanged.
- Preserve unmatched failed local rows as local retry truth.
- Let matching remote rows replace stale local copies and become `remote_saved` / `remote` authority.
- Add a focused integration contract that proves both behaviors through the real post-auth hydrator.
- No API route, database migration, auth rule, geometry rule, visual layout, or shot-entry product behavior change.

## Validation target

Before merge readiness:

- Phase 3C focused shot-log hydration ownership test passes.
- Existing signed shot-log persistence and remote hydration merge tests pass.
- Production build/performance budget stays green.
- Existing Phase 1A/1B/1C mobile guardrails stay green.
- Demo/registered parity, Phase 5 Hardening, and Production Acceptance stay green.
- Cloudflare Pages succeeds on the exact final PR head.
