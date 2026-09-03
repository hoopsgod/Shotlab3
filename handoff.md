# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merge baseline: `0fbf3c79ca233f963c3b7747749715c2cc02a505` (PR #1524 merged)
- Post-merge Cloudflare: `https://643e9320.shotlab3.pages.dev`
- PR #1520 and PR #1524 are closed. Do not reopen their mobile-axis or assignment-state work unless a regression test proves a break.

## Protected contracts

- Preserve Phase 1A mobile geometry and horizontal-axis guardrails.
- Preserve Phase 1B Demo/registered state parity.
- Preserve Phase 1C focused visual/runtime guardrails.
- Preserve Phase 2 CSS/layout authority.
- Preserve Phase 3A assignment state/service ownership.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No desktop redesign, feature expansion, visual-baseline rewrite, or guardrail allowlist broadening.

## Current work

- Phase: **3B — Coach follow-up state and service ownership**
- Branch: `agent/phase3b-coach-follow-up-state-ownership`
- Base: `0fbf3c79ca233f963c3b7747749715c2cc02a505`
- Data domain: coach-only follow-up records and queue only.

## Phase 3 rules

1. One data domain per PR.
2. Stabilize selectors/services/state ownership before new product work.
3. Loading, empty, success, degraded local data, denied, and failure states must not be silently conflated.
4. Preserve usable local fallback data during remote failures and identify unsynced truth explicitly.
5. Route/domain failures must remain recoverable and must not blank unrelated app surfaces.
6. No typography, spacing, layout, or decorative changes except minimal truthful state messaging.
7. Add focused service/selector tests plus an integration/source contract for each slice.
8. Do not merge without explicit authorization.

## Phase 3B problem

- `coachFollowUpService.js` and `coachFollowUpQueue.js` both owned remote collection reads.
- A failed follow-up write was saved locally, but the stored record did not identify that it was still pending sync.
- A later successful queue refresh derived the visible queue from remote rows only, so a newer locally saved follow-up could disappear even though it remained in storage.
- The queue could therefore display `Synced coach-only records` while showing state that was not actually synced.

## Phase 3B implementation

- `coachFollowUpService.js` now owns the team collection read and merge policy through `loadCoachFollowUps()`.
- Local records written before a remote attempt carry local-only `syncPending` truth until the POST succeeds.
- Successful collection refreshes replace stale synced local rows with remote truth while preserving explicitly pending local writes, including when the remote still contains an older version of the same record.
- `loadCoachFollowUp()` delegates to the canonical collection loader instead of owning a second GET path.
- `coachFollowUpQueue.js` derives the queue from the service result and exposes a pending count; it no longer duplicates remote fetch/header/store merge logic.
- `coachFollowUpQueueEnhancer.js` reports pending local sync truth instead of claiming the queue is fully synced.
- No API route, database migration, auth rule, geometry rule, or visual layout is changed.

## Validation target

Before merge readiness:

- Coach follow-up integrity and queue tests pass, including failed-write pending state and successful-refresh preservation.
- Existing Coach follow-up/assignment browser flows remain green.
- Production build/performance budget stays green.
- Existing Phase 1A/1B/1C mobile guardrails stay green.
- Demo/registered parity, Phase 5 Hardening, and Production Acceptance stay green.
- Cloudflare Pages succeeds on the exact final PR head.
