# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merged baseline: `b3a0d3a934dc769ae1e0b84d17bd6ed13e964023` (PR #1533 merged)
- PR #1520, #1524, #1525, #1526, #1527, #1529, #1530, #1531, #1532, and #1533 are closed. Do not reopen their mobile-axis, assignment, coach follow-up, shot-log, RSVP, score-state, training-catalog, coach-priority, Events, or Strength & Conditioning ownership work unless a regression test proves a break.

## Protected contracts

- Preserve Phase 1A mobile geometry and horizontal-axis guardrails.
- Preserve Phase 1B Demo/registered state parity.
- Preserve Phase 1C focused visual/runtime guardrails.
- Preserve Phase 2 CSS/layout authority.
- Preserve completed Phase 3 assignment, coach-follow-up, shot-log, RSVP, score, training-catalog, coach-priority, Events, and Strength & Conditioning ownership contracts.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No UI/CSS/layout redesign, visual-baseline rewrite, dependency upgrade, allowlist broadening, API authorization expansion, or database-schema expansion.

## Current work

- Phase: **Phase 3 closure — Program score failed-write ownership**
- Branch: `agent/phase3-program-score-state-ownership`
- Base: `b3a0d3a934dc769ae1e0b84d17bd6ed13e964023`
- Data domain: `sl:program-scores` / signed `/v1/program-scores` append/upsert state only.

## Program score ownership problem

- Registered Player and Coach Program-result mutations call local-first `P("sl:program-scores", ...)` and then require a strict signed write. A failed POST therefore leaves the intended Program result locally while the UI reports failure.
- Startup and post-auth signed hydration can later replace that local collection with older remote state, hiding the failed Program result before it is retried.
- `/v1/program-scores` POST is append/upsert by score ID, not collection replacement. The API also has a separate authorized player/team DELETE path, so blanket local/remote union is unsafe because it could resurrect intentionally deleted Program results.
- Coaches may record a Program result for another active roster player. Pending ownership therefore cannot require the row player identity to equal the requester.

## Program score ownership correction

- Use compact pending marker `sl:pp`, scoped to normalized requester + exact team + pending Program score IDs.
- Mark exact Program score IDs before the signed POST. Leave unresolved IDs pending on network/API/malformed-response failure.
- Successful server confirmation clears only confirmed IDs.
- Startup and post-auth hydration keep remote rows authoritative and append only exact same-requester/team pending local IDs that are absent remotely.
- A scoped team read ignores pending ownership from another team.
- Successful authorized player/team deletion clears matching pending IDs so deleted Program results cannot be resurrected; unrelated pending Program IDs remain pending.
- Preserve coach-recorded-for-player semantics, Player self-write restrictions, Program endpoint authorization, Demo-local behavior, UI/CSS, and all existing home-score (`sl:scores`) ownership contracts.

## Validation target

Before merge readiness:

- Failed Player Program write remains locally visible across stale remote hydration and retains exact pending ID ownership.
- Failed Coach Program write for another roster player remains locally visible without requester/player conflation.
- Cross-requester and cross-team pending state has no authority.
- Successful retry/server confirmation clears only confirmed pending IDs.
- Remote `[]` is authoritative after pending clears.
- Successful authorized deletion clears only pending IDs for the deleted team/player and does not resurrect deleted results.
- Post-auth hydration applies the same Program pending-ID reconciliation as startup/service reads.
- Existing Program score authorization, coach verification, Player self-write, and deletion tests remain green.
- Protected `sl:scores` Phase 3E source/behavior contracts remain unchanged.
- Production build/performance budget stays green without raising limits.
- Phase 1A/1B/1C, Demo/registered parity, Phase 3 Release Certification, Phase 5 Hardening, Production Acceptance, and supporting release suites remain green.
- Cloudflare Pages succeeds on the exact final PR head.

## Performance warning

Accepted PR #1533 exact-head performance left only:

- JS gzip: `364,998 / 365,000` — **2 bytes headroom**
- CSS gzip: `87,987 / 88,000` — **13 bytes headroom**

Do not raise either budget. Any Program-score runtime growth must fit or be offset by same-domain compaction.

## Remaining ownership queue

After Program scores, keep one domain per PR in this order unless new evidence changes risk:

1. **Player identity collection** — `sl:players` local-first mutations plus replacement-capable sync require pending/replacement ownership without resurrecting removed identities.
2. **Player profiles** — `sl:player-profiles` local-first additions/edits can be overwritten; preserve only explicitly pending local truth.
3. **Team metadata/branding** — `sl:teams` local-first metadata updates can be replaced by remote reads; team creation remains a separate remote-confirmed flow.

Not in the queue: assignments, coach follow-ups, shot logs, RSVPs, `sl:scores`, training catalog, coach priorities, Events, Strength & Conditioning, challenges, or season archives.

## Release rule

- Target merged baseline `b3a0d3a934dc769ae1e0b84d17bd6ed13e964023` directly.
- Keep this PR to Program score ownership only.
- Do not raise performance budgets or alter visual baselines to pass.
- Re-run exact-head certification on the final PR head.
- Do not merge without explicit authorization after certification.
