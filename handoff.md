# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merged baseline: `7423e85b0da3fecca8ed55ae67c7abb9164dfd89` (PR #1534 merged)
- PR #1520, #1524, #1525, #1526, #1527, #1529, #1530, #1531, #1532, #1533, and #1534 are closed. Do not reopen completed mobile-axis, assignment, coach follow-up, shot-log, RSVP, score, training-catalog, coach-priority, Events, Strength & Conditioning, or Program-score work unless a regression test proves a break.

## Protected contracts

- Preserve Phase 1A mobile geometry and horizontal-axis guardrails.
- Preserve Phase 1B Demo/registered state parity.
- Preserve Phase 1C focused visual/runtime guardrails.
- Preserve Phase 2 CSS/layout authority.
- Preserve all completed Phase 3 ownership contracts.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No UI/CSS/layout redesign, visual-baseline rewrite, dependency upgrade, allowlist broadening, API authorization expansion, or database-schema expansion.

## Current work

- Phase: **Phase 3 closure — Player identity replacement ownership**
- Branch: `agent/phase3-player-identity-state-ownership`
- Base: `7423e85b0da3fecca8ed55ae67c7abb9164dfd89`
- Data domain: `sl:players` / signed `/v1/players` replacement state only.

## Player identity ownership problem

- Registered identity and roster flows write `sl:players` locally before the signed `/v1/players` replacement is confirmed.
- A failed replacement can therefore leave the intended local identity/roster state while later signed reads or post-auth hydration restore older remote state.
- `/v1/players` replacement has destructive semantics: omitting the requester may intentionally delete the requester's app identity, and coaches may detach managed players. Blanket local/remote union is therefore unsafe because it can resurrect intentionally removed identity state.

## Ownership correction

- Use compact pending marker `sl:ip`, scoped to the exact normalized requester + active team.
- Mark replacement ownership before the signed POST and retain it on network/API failure.
- While the exact requester/team is pending, service reads, legacy signed reads, and post-auth hydration preserve the locally intended authorized snapshot instead of stale remote rows.
- Pending local Coach snapshots are limited to the requester plus the active managed-team roster; Player snapshots are limited to the requester.
- Cross-requester and cross-team pending state has no authority.
- Successful signed replacement clears pending ownership immediately; subsequent reads are remote-authoritative again.
- A pending requester deletion may legitimately hydrate without an identity row; it is reported as pending rather than as a broken authenticated-identity hydration.
- Preserve existing `/v1/players` authorization, role immutability, team-assignment rules, roster detach behavior, Demo-local behavior, UI/CSS, schema, and all prior Phase 3 contracts.

## Validation target

Before merge readiness:

- Failed same-team Coach replacement survives stale signed reads.
- Failed requester deletion remains absent and is not resurrected by stale remote truth.
- Successful retry clears pending ownership and restores remote authority.
- Cross-requester/team pending markers cannot override current remote truth.
- Legacy signed reads and post-auth hydration use the same pending policy.
- Existing signed Player identity authorization/privacy/replacement tests remain green.
- Production build/performance stays within the existing hard budgets.
- Phase 1A/1B/1C, Demo/registered parity, Phase 3 Release Certification, Phase 5 Hardening, Production Acceptance, and supporting release suites remain green.
- Cloudflare Pages succeeds on the exact final PR head.

## Performance warning

Accepted PR #1534 exact-head performance left only:

- JS gzip: `364,998 / 365,000` — **2 bytes headroom**
- CSS gzip: `87,987 / 88,000` — **13 bytes headroom**

Do not raise either budget. Any runtime growth must fit or be offset within this player-identity slice.

## Remaining ownership queue

After Player identities, keep one domain per PR unless new evidence changes risk:

1. **Player profiles** — `sl:player-profiles` local-first additions/edits can be overwritten; preserve only explicitly pending local truth.
2. **Team metadata/branding** — `sl:teams` local-first metadata updates can be replaced by remote reads; team creation remains a separate remote-confirmed flow.

Not in the queue: assignments, coach follow-ups, shot logs, RSVPs, `sl:scores`, Program scores, training catalog, coach priorities, Events, Strength & Conditioning, challenges, or season archives.

## Release rule

- Target merged baseline `7423e85b0da3fecca8ed55ae67c7abb9164dfd89` directly.
- Keep this PR to Player identity ownership only.
- Do not raise performance budgets or alter visual baselines to pass.
- Re-run exact-head certification on the final PR head.
- Do not merge without explicit authorization after certification.
