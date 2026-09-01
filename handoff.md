# ShotLab Phase 1 Handoff

## Permanent boundary for this phase series

- **All Phase 1 changes, tests, evidence, and certification in this phase series are mobile-only.**
- Desktop redesign, desktop visual certification, desktop-specific enhancements, and expansion of desktop scope are excluded.
- Shared code may be touched only when necessary to protect the mobile contract and must not redesign desktop behavior.
- Product/CSS behavior changes remain **not permitted** in Phase 1C.

## Current review boundary

- Subphase: **Phase 1C — mobile focused visual, console, and critical-request regression coverage**
- Status: committed mobile visual baselines are in the PR; final exact-head certification is the remaining gate.
- Branch: `agent/phase1c-visual-runtime-guardrails`
- Base branch: `march-3-reset-85393dd`
- Phase 1C base SHA: `ab5c449ce0334d863dbd6fcc69ca16946f125abe`
- Authoritative candidate SHA: use the current PR #1522 head and confirm it matches `artifacts/phase1c/exact-head-sha.txt`; do not certify an older SHA.

## Accepted Phase 1A baseline

- PR #1519 merged at exact head `051e1845189ec54330eb3695329c7f224d4b9f94`.
- Merge commit: `d7b5086e8b3f47dbd2f6d330f889f2973ad01130`.
- Mobile Chromium/WebKit geometry matrix, one-pixel rail contract, horizontal gesture lock, and deliberate-overflow negative proof passed before merge.

## Accepted Phase 1B baseline

- PR #1521 merged at exact head `d8f831b6bb77b06b534a7c18abe418203ce949a6`.
- Merge commit / Phase 1C base: `ab5c449ce0334d863dbd6fcc69ca16946f125abe`.
- Mobile Chromium/WebKit deterministic Demo/registered state parity passed.
- Inherited Phase 1A mobile Chromium regression rerun passed.
- Exact-head Cloudflare preview before merge: `https://19569d86.shotlab3.pages.dev`.
- No application source, CSS, layout, persistence, auth, or product behavior changes were introduced by Phase 1B.

## Phase 1C mobile guardrails

- Committed Playwright visual baselines cover mobile login, Coach Mission Control Demo/registered empty state, Coach Players, Coach Events, Player Home, Player Progress, hostile branding/long names, and 320/430 shared-shell edges.
- The focused matrix uses mobile viewports at 320px, 390px, and 430px; inherited Phase 1A also covers 375px.
- Every focused app surface enforces mobile viewport containment and the accepted Phase 1A geometry/centering contract.
- Runtime guard fails on uncaught page exceptions, console errors, failed critical requests, and critical API responses >= 400.
- Critical request classification covers auth/team restore, roster/player, events, assignments, leaderboards, progress/score/shot data, season archives, and relevant Supabase auth/data traffic.
- Fixtures are credential-free and reuse the accepted Phase 1B deterministic state model.
- Motion, time, fonts, images, caret, and scroll position are stabilized; mobile layout regions are not masked.
- The 13 baseline PNGs were generated only after Phase 1C, inherited Phase 1B mobile parity, and inherited Phase 1A mobile geometry all passed on the bootstrap head.
- Final workflow is read-only and compares against committed baselines; it cannot silently update them.

## Final validation gate

Before Phase 1C can be accepted:

1. Run Phase 1C normally against the committed mobile baselines on the final exact head.
2. Re-run accepted Phase 1B mobile parity and Phase 1A mobile Chromium geometry on that same exact head.
3. Inspect the fresh mobile screenshot artifact set manually; a green comparison alone is insufficient.
4. Verify zero unexpected console errors, page exceptions, failed critical requests, or critical HTTP failures.
5. Verify the newest Cloudflare Pages deployment maps to the final exact Phase 1C head.
6. Keep PR #1522 unmerged until explicit merge authorization.

Do not begin Phase 2 from this branch.
