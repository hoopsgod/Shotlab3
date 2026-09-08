# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merged baseline: `fcb3b1abc4f1b18cf0ad72991a3427b3c34ad990` (PR #1537 merged)
- PR #1520, #1524, #1525, #1526, #1527, #1529, #1530, #1531, #1532, #1533, #1534, #1535, and #1536 are closed. Do not reopen completed mobile-axis, assignment, coach follow-up, shot-log, RSVP, score, training-catalog, coach-priority, Events, Strength & Conditioning, Program-score, Player-identity, or Player-profile work unless a regression test proves a break.

## Protected contracts

- Preserve Phase 1A mobile geometry and horizontal-axis guardrails.
- Preserve Phase 1B Demo/registered state parity.
- Preserve Phase 1C focused visual/runtime guardrails.
- Preserve Phase 2 CSS/layout authority.
- Preserve all completed Phase 3 ownership contracts.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No UI/CSS/layout redesign, visual-baseline rewrite, dependency upgrade, allowlist broadening, API authorization expansion, or database-schema expansion.

## Current work

- Phase: **Post-Phase-3 product-validation closure**
- Branch: `agent/post-phase3-product-validation`
- Base: `fcb3b1abc4f1b18cf0ad72991a3427b3c34ad990`
- Scope: commit the deterministic route-enhancer output already covered by repository regression contracts: registered Events/S&C replacement hydration, precise RSVP presentation, Player In Season parity, and mobile S&C row containment.
- Do not broaden this slice into the visual redesign, onboarding, monetization, or architecture recommendations from the product evaluation.

## Team ownership problem

- Coach team identity/metadata can be committed locally before the signed `/v1/teams` POST is confirmed.
- Branding explicitly follows that local-first sequence: the app save occurs before signed Team persistence verification.
- If the POST fails, a later signed Team read or post-auth hydration can replace the locally intended values with stale remote values.
- Team POST semantics are partial-field upserts, not collection replacement. One failed branding or metadata edit must therefore never make the entire Team row locally authoritative.
- Team creation remains a separate server-confirmed route and is outside this ownership slice.

## Ownership correction

- Use compact pending marker `sl:tp`, scoped to exact requester + active team.
- Track only explicitly submitted mutable fields using a compact field mask: name, join code, school, level, and branding.
- Mark those fields before the signed POST and retain them on network/API failure.
- While pending, signed reads reconcile the active Team row field-by-field: only pending fields use the local value; all unrelated Team fields remain remote-authoritative.
- Pending authority is created only for Coach-role active-team updates; Player sessions and other requester/team contexts cannot inherit it.
- Successful signed sync clears only the submitted field mask, preserving any unrelated earlier pending fields.
- Legacy signed Team reads and post-auth hydration use the same field-level reconciliation policy.
- Preserve `/v1/teams` authorization, immutable ownership fields, join-code conflict rules, Demo-local behavior, Team creation semantics, UI/CSS, schema, and all prior Phase 3 contracts.

## Focused validation target

Before merge readiness:

- Failed branding save survives a stale signed read.
- Fresh remote name/school/level/join-code values still win when only branding is pending.
- Failed metadata updates preserve only the submitted metadata fields while fresh remote branding/peer fields still win.
- Successful retry clears pending ownership and restores remote authority.
- Cross-requester/team pending markers cannot override current remote truth.
- Player sessions cannot create Team pending authority.
- Legacy signed Team reads and post-auth hydration use the same field-level policy.
- Existing signed Team authorization, branding, logo, context, invite, and production-acceptance tests remain green.
- Production build/performance stays within the existing hard budgets.
- Phase 1A/1B/1C, Demo/registered parity, Phase 3 Release Certification, Phase 5 Hardening, Production Acceptance, and supporting release suites remain green.
- Cloudflare Pages succeeds on the exact final PR head.

## Performance warning

PR #1536's certified production tree left:

- JS gzip: `364,665 / 365,000` — **335 bytes headroom**
- CSS gzip: `87,987 / 88,000` — **13 bytes headroom**

Do not raise either budget. The Team ownership implementation must fit inside the existing budgets or offset runtime growth without weakening tests or moving visual baselines.

## Remaining ownership queue

Phase 3 ownership is complete through merged PR #1537. Do not invent another ownership phase unless new regression evidence identifies a concrete authority bug.

Not in the queue: Player identities, Player profiles, assignments, coach follow-ups, shot logs, RSVPs, `sl:scores`, Program scores, training catalog, coach priorities, Events, Strength & Conditioning, challenges, or season archives.

## Release rule

- Target merged baseline `fcb3b1abc4f1b18cf0ad72991a3427b3c34ad990` directly.
- Keep this PR to the documented post-Phase-3 validation corrections only.
- Do not raise performance budgets or alter visual baselines to pass.
- Re-run exact-head certification on the final PR head.
- Do not merge without explicit authorization after certification.
