# ShotLab Phase Handoff

## Accepted baseline

- Base branch: `march-3-reset-85393dd`
- Frozen merged baseline: `df7023cac110bc011da4d306eb89f5dbf5c44625` (PR #1532 merged)
- PR #1520, #1524, #1525, #1526, #1527, #1529, #1530, #1531, and #1532 are closed. Do not reopen their mobile-axis, assignment, coach follow-up, shot-log, RSVP, score-state, training-catalog, coach-priority, or Events ownership work unless a regression test proves a break.

## Protected contracts

- Preserve Phase 1A mobile geometry and horizontal-axis guardrails.
- Preserve Phase 1B Demo/registered state parity.
- Preserve Phase 1C focused visual/runtime guardrails.
- Preserve Phase 2 CSS/layout authority.
- Preserve completed Phase 3 assignment, coach-follow-up, shot-log, RSVP, score, training-catalog, coach-priority, and Events ownership contracts.
- Preserve production performance budgets and exact-head Cloudflare certification.
- No UI/CSS/layout redesign, visual-baseline rewrite, dependency upgrade, allowlist broadening, API authorization expansion, or database-schema expansion.

## Current work

- Phase: **Phase 3 closure — Strength & Conditioning replacement-state ownership**
- Branch: `agent/phase3-strength-conditioning-state-ownership`
- Base: `df7023cac110bc011da4d306eb89f5dbf5c44625`
- Data domain: `sl:sc-sessions`, `sl:sc-rsvps`, `sl:sc-logs` / signed `/v1/strength-conditioning` replacement state only.

## S&C ownership problem

- Registered S&C mutations are local-first and then perform strict signed replacement writes. A failed write therefore leaves valid intended local state that startup or post-auth hydration can overwrite with older remote state.
- `/v1/strength-conditioning` writes one resource at a time (`sessions`, `rsvps`, or `logs`) and replacement semantics delete omitted rows. Coach session deletion can require three sequential replacements: sessions, linked RSVPs, and linked logs.
- A coarse domain-wide pending marker is unsafe because one resource may succeed while a later resource fails.
- Startup hydration rewrites migrated S&C collections through generic `DB.set`; those cache rewrites must not become signed replacement mutations.
- The legacy Supabase empty-array guard can short-circuit an intentional final S&C collection deletion before it reaches the signed endpoint.
- Successful remote empty collections must remain authoritative after pending ownership clears; blanket local/remote union is not acceptable under replacement semantics.

## S&C ownership correction

- Use compact pending marker `sl:scp`, scoped to normalized requester + exact team + a per-resource bitmask: sessions=1, RSVPs=2, logs=4.
- Set only the active resource bit immediately before its signed POST. Leave that bit set on network/API/malformed-response failure. Clear only that resource bit after confirmed success.
- Preserve other pending bits during partial success so a three-resource session deletion can reconcile independently.
- Pending ownership from another requester/team has no authority.
- Pending startup reads return the exact local resource, including an intentionally empty collection and legacy local row shapes.
- Post-auth hydration fetches the shared S&C state once, preserves only resources whose exact pending bit is active, and accepts remote truth for confirmed resources.
- Successful non-pending S&C reads are remote-authoritative even when `[]`.
- Make S&C generic startup/cache rewrites local-only. Only the real S&C mutation paths opt into signed replacement with `{replace:true}`.
- Allow explicitly authorized empty S&C replacement arrays through the Supabase adapter so final deletions reach `/v1/strength-conditioning`.
- Preserve existing coach/player authorization, player-owned replacement scope, session deletion semantics, Demo-local behavior, UI/CSS, and all performance budgets.

## Validation target

Before merge readiness:

- Failed non-empty and empty S&C replacements preserve exact local intended truth and set the correct requester/team/resource bit.
- Partial multi-resource failure preserves only unresolved resource ownership; successful retries clear only confirmed bits.
- Pending startup reads do not contact stale remote state for that resource.
- Post-auth hydration preserves pending resources while remote wins nonpending resources from the same response.
- Cross-requester/team pending state cannot override current remote truth.
- Successful remote empty S&C collections remain authoritative after pending clears.
- Startup/cache rewrites do not issue signed S&C replacement writes.
- Real add/delete/RSVP/log mutations explicitly use replacement authority, including `[]` final deletions.
- Existing signed S&C authorization/privacy/replacement tests remain green.
- Route enhancers remain idempotent in both dev and build orchestration.
- Production build/performance budget stays green without raising limits.
- Phase 1A/1B/1C, Demo/registered parity, Phase 3 Release Certification, Phase 5 Hardening, Production Acceptance, and supporting release suites remain green.
- Cloudflare Pages succeeds on the exact final PR head.

## Performance warning

Accepted PR #1532 exact-head performance left only:

- JS gzip: `364,872 / 365,000` — **128 bytes headroom**
- CSS gzip: `87,987 / 88,000` — **13 bytes headroom**

Do not raise either budget. Any S&C runtime growth must fit or be offset by same-domain compaction.

## Remaining ownership queue

After S&C, keep one domain per PR in this order unless new evidence changes risk:

1. **Program scores** — `sl:program-scores` local-first strict writes can be hidden by later remote state; authorized deletion means blanket union is unsafe.
2. **Player identity collection** — `sl:players` local-first mutations plus replacement-capable sync require pending/replacement ownership without resurrecting removed identities.
3. **Player profiles** — `sl:player-profiles` local-first additions/edits can be overwritten; preserve only explicitly pending local truth.
4. **Team metadata/branding** — `sl:teams` local-first metadata updates can be replaced by remote reads; team creation remains a separate remote-confirmed flow.

Not in the queue: assignments, coach follow-ups, shot logs, RSVPs, `sl:scores`, training catalog, coach priorities, Events, challenges, or season archives.

## Release rule

- Target merged baseline `df7023cac110bc011da4d306eb89f5dbf5c44625` directly.
- Keep this PR to the S&C endpoint/domain only.
- Do not raise performance budgets or alter visual baselines to pass.
- Re-run exact-head certification on the final PR head.
- Do not merge without explicit authorization after certification.
