# ShotLab Phase 1 — Mobile Layout / Readability Repair Handoff

## Pull request

- PR: #1550 — https://github.com/hoopsgod/Shotlab3/pull/1550
- Branch: `agent/phase1-mobile-layout-readability-repair`
- Base: `march-3-reset-85393dd`
- Merge: intentionally not performed by this closure pass.
- Exact head SHA, live GitHub check state, and Cloudflare Pages deployment status must be taken from the PR's final exact-head certification comment. This file avoids embedding a self-referential commit SHA.

## Scope

This Phase 1 pass is limited to mobile geometry, readability, deterministic evidence, and release guardrails. It does not redesign ShotLab, add product features, begin Phase 2, raise performance budgets, weaken assertions, broaden allowlists, or rewrite accepted visual baselines merely to make CI pass.

Covered surfaces:

- Sign-in input and CTA bounded/full-width geometry.
- Coach Dashboard Program Pulse and assignment-status layout.
- Players search/filter wrapping, page-overflow protection, and supporting-copy contrast.
- Schedule one-column mobile filter composition and placeholder readability.
- Drills metric label/detail wrapping and minimum readable sizes.

## Deterministic acceptance evidence

The dedicated Phase 1 Playwright workflow exercises 320, 375, 390, 430, 768, and 1280 px widths. The 390 px run captures sign-in, dashboard, Players, Schedule, and Drills screenshots plus geometry/readability metrics. Baseline and candidate evidence use the same deterministic routes and startup synchronization so the gate measures the target UI rather than a transient loading/sync screen.

The assignment-status CSS contract has one effective authority: five columns where space permits, changing to a balanced 2+3 grid at phone widths of 420 px and below. Source-contract coverage prevents a higher-specificity runtime style from silently restoring the previous three-column override.

## Registered Coach limitation

Deterministic demo and registered/parity guardrails remain part of release safety, but real registered-Coach visual confirmation still requires an authenticated account/session that CI can legitimately use. Do not describe that real-account visual check as completed unless it was actually performed on the exact certified head.

## Certification rule

Treat this PR as merge-ready only when the exact head has no unresolved in-scope review finding, the required exact-head test/build workflows are successful, and the Cloudflare Pages deployment for that same SHA is confirmed. Pending or skipped checks are not passes.
