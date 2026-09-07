# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merged baseline: `e68e8a295d2c0d612f6895875f7a29a9376030a1` (PR #1535 merged)
- PR #1520, #1524, #1525, #1526, #1527, #1529, #1530, #1531, #1532, #1533, #1534, and #1535 are closed. Do not reopen completed mobile-axis, assignment, coach follow-up, shot-log, RSVP, score, training-catalog, coach-priority, Events, Strength & Conditioning, Program-score, or Player-identity work unless a regression test proves a break.

## Protected contracts

- Preserve Phase 1A mobile geometry and horizontal-axis guardrails.
- Preserve Phase 1B Demo/registered state parity.
- Preserve Phase 1C focused visual/runtime guardrails.
- Preserve Phase 2 CSS/layout authority.
- Preserve all completed Phase 3 ownership contracts.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No UI/CSS/layout redesign, visual-baseline rewrite, dependency upgrade, allowlist broadening, API authorization expansion, or database-schema expansion.

## Current work

- Phase: **Phase 3 closure — Player profile pending ownership**
- Branch: `agent/phase3-player-profile-state-ownership`
- Base: `e68e8a295d2c0d612f6895875f7a29a9376030a1`
- Data domain: `sl:player-profiles` / signed `/v1/player-profiles` upsert state only.

## Player profile ownership problem

- Registered profile additions/edits can be written locally before the signed `/v1/player-profiles` POST is confirmed.
- If that POST fails, later signed reads or post-auth hydration can overlay stale remote fields and erase the locally intended edit.
- Profile POST semantics are row-level upsert, not collection replacement. Therefore a pending edit must never make unrelated roster profiles locally authoritative.

## Ownership correction

- Use compact pending marker `sl:pp`, scoped to exact requester + active team + explicitly submitted profile IDs.
- Mark the submitted profile IDs before the signed POST and retain them on network/API failure.
- While the exact requester/team is pending, reconcile signed reads row-by-row: explicitly pending local profile IDs override stale remote rows, while all unrelated rows remain remote-authoritative.
- Player-role pending rows are additionally restricted to the requester identity; cached profiles for other players cannot gain authority.
- Successful sync clears only the submitted pending IDs; unrelated earlier pending IDs remain pending until their own successful sync.
- Legacy signed reads and post-auth hydration use the same row-level reconciliation policy.
- Preserve existing `/v1/player-profiles` authorization, team-management rules, identity-claim protections, Demo-local behavior, UI/CSS, schema, and all prior Phase 3 contracts.

## Focused validation target

Before merge readiness:

- Failed profile edit survives a stale signed read.
- Only the explicitly pending profile row stays local-authoritative; fresh remote peer rows still win.
- Successful retry clears completed ownership and restores remote authority.
- Cross-requester/team pending markers cannot override current remote truth.
- Player-scoped pending state cannot elevate another cached profile.
- Legacy signed reads and post-auth hydration use the same row-level policy.
- Existing signed Player profile authorization/privacy tests remain green.
- Production build/performance stays within the existing hard budgets.
- Phase 1A/1B/1C, Demo/registered parity, Phase 3 Release Certification, Phase 5 Hardening, Production Acceptance, and supporting release suites remain green.
- Cloudflare Pages succeeds on the exact final PR head.

## Performance warning

PR #1535's certified production tree left only:

- JS gzip: `364,958 / 365,000` — **42 bytes headroom**
- CSS gzip: `87,987 / 88,000` — **13 bytes headroom**

Do not raise either budget. Any runtime growth in this profile-ownership slice must fit or be offset without weakening tests or moving visual baselines.

## Remaining ownership queue

After Player profiles, keep one domain per PR unless new evidence changes risk:

1. **Team metadata/branding** — `sl:teams` local-first metadata updates can be replaced by remote reads; team creation remains a separate remote-confirmed flow.

Not in the queue: Player identities, assignments, coach follow-ups, shot logs, RSVPs, `sl:scores`, Program scores, training catalog, coach priorities, Events, Strength & Conditioning, challenges, or season archives.

## Release rule

- Target merged baseline `e68e8a295d2c0d612f6895875f7a29a9376030a1` directly.
- Keep this PR to Player profile ownership only.
- Do not raise performance budgets or alter visual baselines to pass.
- Re-run exact-head certification on the final PR head.
- Do not merge without explicit authorization after certification.
