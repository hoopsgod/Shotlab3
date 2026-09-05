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
- Preserve Phase 3D RSVP replacement/pending-sync ownership.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No desktop redesign, feature expansion, visual-baseline rewrite, or guardrail allowlist broadening.

## Current work

- Phase: **3E — Events hydration/state ownership**
- Branch: `agent/phase3e-event-hydration-ownership`
- Base: `87c824aa4624f166b7ad9326ad08ea8b548e5dc4`
- Data domain: `sl:events` / registered post-auth Events hydration only.

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

- Coach event creation intentionally persists through `P("sl:events", ..., { strictLocal:true })`, so a valid event may exist locally before remote persistence is complete.
- `remotePersistence.mergeHydratedRows("sl:events", ...)` already defines the canonical reconciliation policy: keep local-only events and let matching remote IDs replace stale local copies.
- Registered post-auth hydration bypassed that existing policy and wrote `/v1/events` directly over `sl:events`.
- A later login/hydration could therefore erase a valid local-only event whenever the remote Events payload was stale or incomplete.

## Phase 3E implementation

- Route only the Events binding in registered post-auth hydration through the existing `mergeHydratedRows` policy.
- Preserve local-only Events rows when remote hydration is incomplete.
- Let matching remote Event IDs remain authoritative.
- Keep RSVP pending ownership, shot-log merge ownership, all other authenticated collection hydration, API authorization, database schema, layout, typography, and visual baselines unchanged.
- Add a focused integration contract using the real post-auth hydrator and include it in the existing Signed Events/RSVP persistence workflow.
- Do not raise the production JavaScript budget; keep the runtime delta minimal because the accepted baseline is already near the hard ceiling.

## Validation target

Before merge readiness:

- Phase 3E focused event hydration ownership test passes.
- Existing signed Events/RSVP and Phase 3D RSVP contracts pass unchanged.
- Existing event visibility/create-flow and remote event merge contracts stay green.
- Production build/performance budget stays green without a budget increase.
- Existing Phase 1A/1B/1C mobile guardrails stay green.
- Demo/registered parity, Phase 5 Hardening, and Production Acceptance stay green.
- Cloudflare Pages succeeds on the exact final PR head.
