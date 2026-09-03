# ShotLab Mobile Phase Handoff

## Permanent mobile boundary

- **All work in this phase series is mobile-only.**
- Desktop redesign, desktop visual certification, desktop-specific enhancements, and expansion of desktop scope are excluded.
- Shared code may be touched only when necessary to protect or simplify the mobile contract and must not redesign desktop behavior.

## Frozen Phase 1 production baseline

- Phase 1A PR #1519 merged; mobile geometry, one-pixel rail, horizontal gesture lock, and controlled overflow negative proof accepted.
- Phase 1B PR #1521 merged; deterministic Demo/registered mobile parity accepted.
- Phase 1C PR #1522 merged.
- Final Phase 1C certified PR head: `ff303aaa69b855d30ffbac69ac5dd919a8f7423c`.
- Production merge commit / Phase 2 base: `63a2ee51f37f94c30d0390b7b2f48a3b829de550`.
- Certified PR head and production merge commit share Git tree `5a54f540f6d60bd61040e27998dbe97665e17d21`.
- Exact production Cloudflare deployment for the merge commit: `https://8435af01.shotlab3.pages.dev`.
- Cloudflare Pages check for `63a2ee51...`: success.
- Post-merge `production-acceptance` check on `63a2ee51...`: success, including 4 mobile-Chromium live production tests.
- Post-merge `live-preview-smoke` check on `63a2ee51...`: success.
- Phase 1C final exact-head run passed 13/13 focused mobile visual/runtime tests, 6/6 Phase 1B mobile parity tests, and 20 executable Phase 1A mobile geometry tests; the controlled negative fixture remained intentionally skipped in the inherited rerun.

## Current work

- Phase: **Post-Phase 2 mobile scroll-owner closure**
- Branch: `agent/phase1b-parity-state-guardrails` (PR #1520, rewritten onto the current default branch)
- Base branch: `march-3-reset-85393dd`
- Base SHA: `d2a66b95a1631d23c795b13647ed4db6c228cbca` (Phase 2 PR #1523 merged)
- Goal: keep Coach Players and Coach Events on distinct, deterministic mobile horizontal-scroll ownership without changing product navigation behavior.

## Phase 2 rules

1. Do not redesign the app or intentionally change the accepted mobile appearance.
2. Do not add features or alter data/auth/product semantics.
3. Do not expand into desktop cleanup.
4. Start from the mobile axis/centering authority and only expand when evidence shows a competing rule.
5. Prefer deleting or consolidating obsolete/duplicate mobile declarations over adding another override layer.
6. Preserve Demo/registered shared mobile layout authority.
7. After each meaningful cleanup slice, re-run the relevant Phase 1A/1B/1C mobile guardrails before proceeding.
8. Do not update committed Phase 1C visual baselines merely to make cleanup pass; visual drift requires investigation.
9. Keep Phase 2 changes small and reviewable; no broad CSS rewrite.
10. Do not merge a Phase 2 PR without explicit authorization.

## Closure changes

- The shared secondary toolbar keeps its accepted mobile row presentation while the protected final mobile axis layer stays out of filter-rail ownership.
- `[data-testid="coach-players-filter-rail"]` clears composite x-scroll ownership so its existing nested chip group remains the intentional local horizontal scroller.
- Non-Players secondary filter rails keep intrinsic child sizing (`min-width: max-content`) so their nested chip groups do not collapse into accidental local x-scrollers.
- The geometry allowlist remains scoped only to `[data-testid="coach-players-filter-rail"] > [role="group"]`; Coach Events is not allowlisted.
- Scroll-owner diagnostics include bounded ancestry so a recurrence identifies the owning product surface.
- Phase 1A WebKit navigation forces only the fixed-dock click after its synthetic horizontal gesture, retaining the real React route handler while avoiding Playwright's stale actionability wait.
- The source contract rejects rediscovering shared filter rails in the protected final mobile axis layer and locks the Players/non-Players sizing split.

## Closure evidence

- Original current-base reproduction: Phase 1B `coach-populated` rejected `[data-testid="coach-players-filter-rail"]` as a second 350/685px horizontal owner.
- First exact-head CI on `b6cd49d0a51ecfafef10ad5dad06d2492698878a` disproved the broad final-axis override: Coach Events became an unapproved nested x-scroller at 390/430 in Chromium and WebKit, while CSS gzip measured 88,040 bytes against the 88,000-byte budget and Phase 5A rejected bundle growth.
- Follow-up exact head `a48b87ca79676e6be0da82a91a8382719c795eb2` fixed the bundle/performance side: Production Performance Budget, Phase 5A Route Enhancer Orchestration, Phase 5 Release Hardening, Production Acceptance, and the other major release suites passed; Cloudflare deployed successfully.
- `a48b87ca...` still failed Phase 1A, Phase 1B, and Phase 1C for one shared reason: Coach Events' nested filter group collapsed and became an unapproved x-scroller. Phase 1A reproduced it for Demo/registered at 390/430 in Chromium and WebKit (for example 8/105px at 390 and roughly 38–48/210–218px at 430). Phase 1B stopped on the same Demo Coach Events owner, and Phase 1C stopped on the same registered Coach Events owner.
- The closure correction restores intrinsic sizing only for non-Players filter children while leaving Players to its existing shrinkable nested scroller. It also removes the Firefox-only outer scrollbar declaration so the minified production CSS does not grow relative to the already passing exact head.
- Final merge-readiness must be certified from the next exact PR head; do not certify `b6cd49d...` or `a48b87ca...`.
