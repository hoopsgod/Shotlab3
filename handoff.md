# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merged baseline: `e01f33cc85adc10c3ff248db0c0408e81a5e9337` (PR #1530 merged)
- PR #1520, #1524, #1525, #1526, #1527, #1529, and #1530 are closed. Do not reopen their mobile-axis, assignment, coach follow-up, shot-log, RSVP, score-state, or training-catalog ownership work unless a regression test proves a break.

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
- Preserve PR #1530 training-catalog read-only hydration ownership exactly; do not mix its domain into this slice.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No desktop redesign, feature expansion, visual-baseline rewrite, guardrail allowlist broadening, dependency upgrade, API authorization expansion, or database-schema expansion.

## Current work

- Phase: **Phase 3 closure — coach-priority failed-delivery ownership**
- Branch: `agent/phase3-coach-priority-state-ownership`
- Base: `e01f33cc85adc10c3ff248db0c0408e81a5e9337`
- Data domain: `sl:coach-priorities` failed/in-flight registered coach publishing and subsequent team-priority hydration only.

## Phase 3 rules

1. One data domain per PR.
2. Stabilize selectors/services/state ownership before new product work.
3. Loading, empty, success, degraded local data, denied, and failure states must not be silently conflated.
4. Preserve usable local fallback data during remote failures, but never give ordinary stale local data authority over successful remote truth.
5. Route/domain failures must remain recoverable and must not blank unrelated app surfaces.
6. No typography, spacing, layout, or decorative changes except minimal truthful state messaging.
7. Add focused service/selector tests plus an integration/source contract for each slice.
8. Do not merge without explicit authorization.

## Coach-priority ownership problem

- The coach priority publish path intentionally writes the new team priority draft to `sl:coach-priorities` before the signed `/v1/team-priorities` POST completes.
- If that POST fails, the compatibility bridge truthfully tells the coach that priorities were saved on this device but could not be delivered and should be retried.
- The next successful registered `getPlayerPriorities()` call currently merges `{ ...localPriorities, ...remotePriorities }`, so the stale remote row replaces the same-team local draft.
- The failed draft can therefore disappear on the next successful hydration even though the product explicitly promised it was retained locally for retry.
- Team priorities have authenticated GET and team-scoped upsert POST behavior; there is no delete contract requiring tombstone reconciliation in this slice.

## Coach-priority ownership correction

- Use one compact local pending-delivery sidecar, `sl:cp`, scoped to normalized requester identity and exact team IDs.
- Mark only registered teams that are about to attempt a signed priority POST.
- A failed or interrupted signed POST leaves that team pending and preserves its local draft across subsequent successful hydration for the same requester.
- Successful remote hydration remains authoritative for every non-pending team and for a pending marker owned by a different requester.
- Clear each team from pending ownership only after its signed POST succeeds.
- After pending ownership clears, subsequent successful remote hydration is authoritative again.
- Demo-local priority behavior, signed authorization, server sanitization, endpoint behavior, database schema, visual surfaces, CSS, and route enhancers remain unchanged.
- Do not raise JavaScript or CSS performance budgets. The accepted #1530 baseline has only 538 bytes of total JS gzip headroom and 13 bytes of CSS gzip headroom.

## Confirmed remaining ownership queue

The closure audit is now bounded. After the coach-priority slice, the remaining confirmed state-authority domains are:

1. **Events replacement/hydration** — local-first event creation can survive a failed remote sync, while post-auth hydration replaces `sl:events`; old draft PR #1528 is unsafe as written because a blanket local/remote union can resurrect intentionally deleted events under replacement semantics.
2. **Strength & Conditioning replacement state** — `sl:sc-sessions`, `sl:sc-rsvps`, and `sl:sc-logs` use local-first strict remote replacement writes; startup/post-auth remote truth can erase failed local intent. Treat S&C as one endpoint/domain and preserve deletion semantics.
3. **Program scores** — `sl:program-scores` uses local-first strict remote score writes, but Phase 3E intentionally excluded it; startup/post-auth hydration can hide a failed local Program result. Existing authorized player-score deletion means blanket union is not acceptable.
4. **Player identity collection** — `sl:players` mutations use local-first persistence and signed replacement-capable sync; startup can merge, but post-auth hydration replaces the collection. Pending/replacement ownership must not resurrect intentionally removed identities.
5. **Player profile collection** — `sl:player-profiles` mutations use local-first persistence and upsert-only signed sync; post-auth hydration can overwrite failed local additions/edits. Preserve only explicitly pending local truth.
6. **Team metadata/branding** — `sl:teams` updates such as join-code regeneration and branding use local-first persistence; successful remote reads can replace undelivered local updates, including at startup. Team creation itself remains a separate remote-confirmed create flow and should not be redesigned.

Not in the remaining queue:

- Assignments, coach follow-ups, shot logs, RSVPs, and `sl:scores` are already protected by completed Phase 3 slices.
- Training catalog is protected by merged PR #1530.
- Challenges use remote-confirmed registered writes before local cache/state updates.
- Season archives are inserted into local/archive state only after durable remote persistence succeeds.

Do not combine the confirmed queue into one PR. Preserve one-domain-per-PR sequencing and exact-head certification after each accepted merge baseline.

## Release rule

- This branch now targets merged baseline `e01f33cc85adc10c3ff248db0c0408e81a5e9337` directly.
- Re-run all required exact-head certification on the final PR head.
- Do not merge this slice without explicit authorization after certification.

## Validation target

Before merge readiness:

- A failed registered coach-priority POST leaves the intended same-team draft locally and records pending ownership for that requester/team.
- A later successful GET cannot overwrite that exact pending local team draft for the same requester.
- Pending ownership from another requester cannot override successful remote truth.
- A successful retry clears the exact team pending marker.
- Once pending ownership clears, successful remote hydration is authoritative again.
- Existing successful coach priority publishing, Demo-local behavior, server sanitization, and authorization contracts remain unchanged.
- Existing coach-priority delivery integrity tests pass.
- Production build/performance budget stays green without raising limits.
- Existing Phase 1A/1B/1C mobile guardrails stay green.
- Demo/registered parity, Phase 3 Release Certification, Phase 5 Hardening, Production Acceptance, and supporting release suites stay green.
- Cloudflare Pages succeeds on the exact final PR head.
