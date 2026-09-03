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
- Goal: remove the duplicate Coach Players filter-rail horizontal owner exposed by populated parity fixtures and make the inherited WebKit geometry navigation deterministic without changing product navigation behavior.

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

- The shared secondary toolbar keeps its accepted mobile row presentation; redundant width/axis declarations were removed rather than adding another final-authority override.
- Only `[data-testid="coach-players-filter-rail"]` clears the composite rail's inherited x-scroll ownership; its existing nested chip group remains the intentional local horizontal scroller.
- The geometry allowlist is scoped to `[data-testid="coach-players-filter-rail"] > [role="group"]` instead of the globally repeated accessible label.
- Scroll-owner diagnostics include bounded ancestry so a recurrence identifies the owning product surface.
- Phase 1A WebKit navigation forces only the fixed-dock click after its synthetic horizontal gesture, retaining the real React route handler while avoiding Playwright's stale actionability wait.
- The source contract rejects rediscovering shared filter rails in the protected final mobile axis layer.

## Closure evidence

- Reproduction before the first fix: current-base Phase 1B `coach-populated` failed because `[data-testid="coach-players-filter-rail"]` became a second 350/685px horizontal owner.
- Focused reproduction after the first fix: pass, 1/1.
- Phase 1A mobile Chromium locally: pass, 20 passed / 1 expected negative-fixture skip.
- Phase 1B mobile Chromium locally: pass, 6/6.
- Focused mobile authority Node contracts locally: pass, 7/7.
- Optimized production build locally: pass.
- Focused `coach-populated` parity case against the optimized preview: pass, 1/1.
- First exact-head CI on `b6cd49d0a51ecfafef10ad5dad06d2492698878a` disproved the generic filter override: Phase 1A failed at Coach Events on 390/430 in both Chromium and WebKit because the Events nested filter group became an unapproved horizontal owner.
- The same exact head built successfully but measured 88,040 total CSS gzip bytes against the 88,000-byte budget, and Phase 5A also rejected its bundle growth versus the exact base.
- The follow-up therefore removes the generic final-axis filter override, scopes the ownership change to Coach Players in the existing secondary-toolbar authority, and deletes redundant mobile toolbar declarations instead of broadening the allowlist.
- Final exact-head browser and performance certification must be read from PR #1520 after this follow-up commit; do not certify `b6cd49d...`.
