# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merge baseline: `71e14e4d532febf3dde2df052e0b4b4fa048e44e` (PR #1526 merged)
- PR #1520, #1524, #1525, and #1526 are closed. Do not reopen their mobile-axis, assignment, coach follow-up, or shot-log ownership work unless a regression test proves a break.

## Protected contracts

- Preserve Phase 1A mobile geometry and horizontal-axis guardrails.
- Preserve Phase 1B Demo/registered state parity.
- Preserve Phase 1C focused visual/runtime guardrails.
- Preserve Phase 2 CSS/layout authority.
- Preserve Phase 3A assignment state/service ownership.
- Preserve Phase 3B coach follow-up state/service ownership.
- Preserve Phase 3C shot-log hydration/state ownership.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No desktop redesign, feature expansion, visual-baseline rewrite, or guardrail allowlist broadening.

## Current work

- Phase: **3D — RSVP replacement and pending-sync state ownership**
- Branch: `agent/phase3d-rsvp-state-ownership`
- Base: `71e14e4d532febf3dde2df052e0b4b4fa048e44e`
- Data domain: `sl:rsvps` / signed RSVP collection reads, replacement writes, and post-auth hydration only.

## Phase 3 rules

1. One data domain per PR.
2. Stabilize selectors/services/state ownership before new product work.
3. Loading, empty, success, degraded local data, denied, and failure states must not be silently conflated.
4. Preserve usable local fallback data during remote failures and identify unsynced truth explicitly.
5. Route/domain failures must remain recoverable and must not blank unrelated app surfaces.
6. No typography, spacing, layout, or decorative changes except minimal truthful state messaging.
7. Add focused service/selector tests plus an integration/source contract for each slice.
8. Do not merge without explicit authorization.

## Phase 3D problem

- The signed RSVP API uses replacement semantics: Coach writes own the team RSVP collection; Player writes own that Player's RSVP collection.
- `DB.get("sl:rsvps")` already has a canonical RSVP normalization/merge path, but registered post-auth hydration still replaced `sl:rsvps` directly from remote state.
- RSVP mutations update React/local storage before remote confirmation, while the generic persistence adapter did not identify a failed RSVP write as pending truth.
- A failed RSVP addition could therefore disappear after a later signed hydration.
- A failed RSVP removal could be resurrected by stale remote truth.
- The generic adapter also skipped remote persistence when the intended RSVP replacement collection was empty, so removing the final RSVP could fail to reach the server at all.

## Phase 3D implementation

- Add an identity-keyed pending marker (`sl:rp:<identity>` -> active team) so failed RSVP truth is scoped to both requester and team without carrying duplicate state machinery.
- Mark RSVP replacement writes pending before the signed API request and clear the marker only after server success.
- While that marker is active for the signed-in identity/team, signed RSVP reads use the intended local collection rather than stale remote state.
- Preserve that same pending local collection through registered post-auth hydration; expose `pending: ["sl:rsvps"]` in hydration results so unsynced truth remains explicit.
- Treat `sl:rsvps` as a signed replacement collection so an empty collection still reaches `/v1/rsvps` and can delete the final response remotely.
- Keep Events, S&C, API authorization, database schema, layout, typography, and visual baselines unchanged.
- Preserve the existing production JavaScript budget by compacting duplicate legacy persistence descriptors and replacing a behavior-equivalent two-value schedule `Set` lookup during route enhancement; no budget was raised.

## Validation target

Before merge readiness:

- Phase 3D focused RSVP ownership tests pass for failed addition, failed final deletion, identity scoping, successful confirmation, signed reads, and post-auth hydration.
- Existing signed Events/RSVP authorization and remote RSVP normalization/merge tests pass.
- Production build/performance budget stays green.
- Existing Phase 1A/1B/1C mobile guardrails stay green.
- Demo/registered parity, Phase 5 Hardening, and Production Acceptance stay green.
- Cloudflare Pages succeeds on the exact final PR head.
