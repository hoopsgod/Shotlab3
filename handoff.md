# ShotLab Phase 1 Handoff

## Current review boundary

- Subphase: **Phase 1C — focused visual, console, and critical-request regression coverage**
- Status: implementation started from the accepted Phase 1B production merge
- Branch: `agent/phase1c-visual-runtime-guardrails`
- Base branch: `march-3-reset-85393dd`
- Base SHA: `ab5c449ce0334d863dbd6fcc69ca16946f125abe`
- Product/CSS behavior changes: **none permitted**

## Accepted Phase 1A baseline

- PR #1519 merged at exact head `051e1845189ec54330eb3695329c7f224d4b9f94`.
- Merge commit: `d7b5086e8b3f47dbd2f6d330f889f2973ad01130`.
- Chromium/WebKit geometry matrix, one-pixel rail contract, horizontal gesture lock, and deliberate-overflow negative proof passed before merge.

## Accepted Phase 1B baseline

- PR #1521 merged at exact head `d8f831b6bb77b06b534a7c18abe418203ce949a6`.
- Merge commit / Phase 1C base: `ab5c449ce0334d863dbd6fcc69ca16946f125abe`.
- Phase 1B Chromium/WebKit deterministic Demo/registered state parity passed.
- Inherited Phase 1A Chromium regression rerun passed.
- Exact-head Cloudflare preview before merge: `https://19569d86.shotlab3.pages.dev`.
- No application source, CSS, layout, persistence, auth, or product behavior changes were introduced by Phase 1B.

## Phase 1C implementation scope

- Deterministic Playwright visual snapshots for login, Coach Mission Control Demo/registered empty state, Coach Players, Coach Events, Player Home, Player Progress, branding stress, and 320/430 shared-shell edges.
- Fresh screenshot artifacts are written under `artifacts/phase1c/screenshots/` while committed Playwright PNGs provide the regression baseline.
- Every focused surface also records viewport/geometry and runtime evidence under `artifacts/phase1c/runtime/`.
- Runtime guard fails on uncaught page exceptions, console errors, failed critical requests, and critical API responses >= 400.
- Critical request classification covers auth/team restore, roster/player, event, assignment, leaderboard, progress/score/shot, season archive, and relevant Supabase auth/data traffic.
- Fixtures remain credential-free and reuse the accepted Phase 1B deterministic state model.
- Motion, time, fonts, images, and scroll position are stabilized for screenshot repeatability; layout regions are not masked.

## Baseline bootstrap rule

The first Phase 1C CI run may generate the PNG visual baselines from this unchanged accepted product tree and intentionally stop after uploading them. Those exact generated PNGs must then be committed. Subsequent runs compare against the committed visual baseline and fail on material screenshot drift.

## Validation gate

Before Phase 1C can be accepted:

1. Commit the generated exact-tree visual baseline PNGs.
2. Re-run Phase 1C normally against a production build.
3. Re-run accepted Phase 1B parity and Phase 1A Chromium geometry on the same exact head.
4. Inspect the fresh screenshot artifact set manually; a green snapshot comparison alone is not sufficient.
5. Verify zero unexpected console errors/page exceptions/critical request failures.
6. Verify the Cloudflare Pages deployment maps to the final exact Phase 1C head.
7. Keep the PR unmerged until explicit review/authorization.

Do not begin Phase 2 from this branch.
