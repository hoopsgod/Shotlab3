# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merged baseline: `4fc7fdc729282e7996af545c5e8146ce74fc01d7` (PR #1531 merged)
- PR #1520, #1524, #1525, #1526, #1527, #1529, #1530, and #1531 are closed. Do not reopen their mobile-axis, assignment, coach follow-up, shot-log, RSVP, score-state, training-catalog, or coach-priority ownership work unless a regression test proves a break.

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
- Preserve merged PR #1530 training-catalog read-only hydration ownership.
- Preserve merged PR #1531 coach-priority failed-delivery ownership.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No desktop redesign, feature expansion, visual-baseline rewrite, guardrail allowlist broadening, dependency upgrade, API authorization expansion, or database-schema expansion.

## Current work

- Phase: **Phase 3 closure — Events replacement/hydration ownership**
- Branch: `agent/phase3-events-replacement-ownership`
- Base: `4fc7fdc729282e7996af545c5e8146ce74fc01d7`
- PR: `#1532`
- Data domain: `sl:events` / signed team Events replacement writes, startup reads, and registered post-auth hydration only.

## Phase 3 rules

1. One data domain per PR.
2. Stabilize selectors/services/state ownership before new product work.
3. Loading, empty, success, degraded local data, denied, and failure states must not be silently conflated.
4. Preserve usable local fallback data during remote failures, but never give ordinary stale local data authority over successful remote truth.
5. Route/domain failures must remain recoverable and must not blank unrelated app surfaces.
6. No typography, spacing, layout, or decorative changes except minimal truthful state messaging.
7. Add focused service/selector tests plus an integration/source contract for each slice.
8. Do not merge without explicit authorization after exact-head certification.

## Events ownership problem

- Coach Events mutations are local-first. Event creation uses `strictLocal:true`, while event removal also updates `sl:events` locally before signed replacement delivery is known.
- `/v1/events` is an authenticated team-wide replacement endpoint. Omitted events are intentionally deleted, and their RSVPs are deleted with them.
- A failed Events replacement can therefore leave valid intended local truth that later startup or post-auth hydration can overwrite.
- Deleting the final event is a special case: the legacy adapter normally short-circuits empty write arrays, so the actual coach deletion path must explicitly authorize `events: []` to reach the signed replacement endpoint.
- Startup `DB.get()` also treats empty arrays as no data; without an explicit Events authority rule, a successful authoritative empty remote collection can fall back to stale local Events.
- Old draft PR #1528 proposed preserving every local-only event during hydration. That blanket union is unsafe under replacement semantics because it can resurrect intentionally deleted Events. Do not revive or merge #1528 as written.

## Events ownership correction

- Use compact pending marker `sl:ep`, scoped to normalized requester identity plus exact team ID.
- Mark an Events replacement pending immediately before the signed `/v1/events` POST begins. A failed or interrupted replacement leaves the marker and intended local collection intact.
- While the exact requester/team marker is pending, signed Events reads return the intended local collection and post-auth hydration skips the stale remote Events read. This includes an intentionally empty local collection after a failed final-event deletion.
- Pending ownership from another requester/team has no authority over the active team.
- Clear `sl:ep` only after the signed replacement succeeds. After it clears, remote Events truth is authoritative again.
- Only the explicit coach `removeEvent` path sets `{replace:true}` on `sl:events`; this allows an intentional final-event deletion to send `events: []` while ordinary empty cache/initialization writes remain non-authoritative and do not hit the signed Events endpoint.
- Keep the Supabase adapter capable of carrying an authorized empty Events replacement once `DB.set` has explicitly selected replacement mode.
- Make a successful Events startup read authoritative even when the returned collection is empty; only `local_pending` Events reads retain local authority.
- Do not use blanket local/remote union reconciliation for registered Events authority.
- Preserve RSVP ownership, authorization, endpoint/database behavior, UI, CSS, visual baselines, and all performance budgets.

## Closure finding from first PR head

- Exact head `57bc53bd36ef758b3df9429033326d9c0975880e` passed the focused Signed Events/RSVP workflow, Production Performance Budget, Phase 3 Release Certification, Production Acceptance, and several supporting suites.
- Broader registered runtime checks correctly failed because the first implementation treated every empty `sl:events` write as a remote replacement. Runtime parity captured `[remote-persist] upsert failed {key: sl:events, table: events, ...}` during a harmless registered empty Events write.
- That failure is treated as a real authority defect, not a visual flake. The repair narrows empty Events replacement to the explicit coach deletion path only. All prior exact-head results are diagnostic only; full certification must rerun on the repaired head.

## Confirmed remaining ownership queue

After this Events slice, the remaining confirmed state-authority domains are:

1. **Strength & Conditioning replacement state** — `sl:sc-sessions`, `sl:sc-rsvps`, and `sl:sc-logs` use local-first strict remote replacement writes; startup/post-auth remote truth can erase failed local intent. Treat S&C as one endpoint/domain and preserve deletion semantics.
2. **Program scores** — `sl:program-scores` uses local-first strict remote score writes, but Phase 3E intentionally excluded it; startup/post-auth hydration can hide a failed local Program result. Existing authorized player-score deletion means blanket union is not acceptable.
3. **Player identity collection** — `sl:players` mutations use local-first persistence and signed replacement-capable sync; startup can merge, but post-auth hydration replaces the collection. Pending/replacement ownership must not resurrect intentionally removed identities.
4. **Player profile collection** — `sl:player-profiles` mutations use local-first persistence and upsert-only signed sync; post-auth hydration can overwrite failed local additions/edits. Preserve only explicitly pending local truth.
5. **Team metadata/branding** — `sl:teams` updates such as join-code regeneration and branding use local-first persistence; successful remote reads can replace undelivered local updates, including at startup. Team creation itself remains a separate remote-confirmed create flow and should not be redesigned.

Not in the remaining queue:

- Assignments, coach follow-ups, shot logs, RSVPs, `sl:scores`, training catalog, and coach priorities are already protected by completed ownership slices.
- Challenges use remote-confirmed registered writes before local cache/state updates.
- Season archives are inserted into local/archive state only after durable remote persistence succeeds.

Do not combine the confirmed queue into one PR. Preserve one-domain-per-PR sequencing and exact-head certification after each accepted merge baseline.

## Release rule

- Target merged baseline `4fc7fdc729282e7996af545c5e8146ce74fc01d7` directly.
- Keep old draft PR #1528 separate; PR #1532 supersedes its unsafe reconciliation model.
- Re-run all required exact-head certification on the final repaired PR head.
- Do not raise JavaScript or CSS performance budgets.
- Do not merge this slice without explicit authorization after certification.

## Validation target

Before merge readiness:

- Failed Events addition preserves the exact local intended collection and records pending ownership for the same requester/team.
- Failed final-event deletion preserves an explicit pending empty Events collection and sends `events: []` when retried.
- Ordinary empty Events cache/initialization writes do not become remote replacement requests.
- Pending signed Events reads do not contact stale remote state.
- Post-auth hydration skips Events while the exact requester/team replacement is pending and reports `sl:events` as pending.
- Pending ownership from another team/requester cannot override successful current-team remote truth.
- Successful Events replacement clears the exact pending marker.
- Once pending clears, successful remote Events truth is authoritative, including an intentionally empty remote collection.
- Existing signed Events/RSVP authorization, RSVP Phase 3D ownership, event visibility/create-flow, and replacement deletion contracts remain green.
- The new Events enhancer runs in both dev and production build orchestration and remains idempotent with the prior RSVP enhancer.
- Production build/performance budget stays green without raising limits.
- Existing Phase 1A/1B/1C mobile guardrails stay green.
- Demo/registered parity, Phase 3 Release Certification, Phase 5 Hardening, Production Acceptance, and supporting release suites stay green.
- Cloudflare Pages succeeds on the exact final PR head.
