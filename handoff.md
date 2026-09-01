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

- Phase: **Phase 2 — mobile CSS/layout authority cleanup**
- Branch: `agent/phase2-mobile-css-authority-cleanup`
- Base branch: `march-3-reset-85393dd`
- Base SHA: `63a2ee51f37f94c30d0390b7b2f48a3b829de550`
- Goal: simplify and consolidate the mobile width/margin/transform/viewport/overflow authority that can cause Demo/registered layout drift, while preserving the accepted Phase 1 mobile appearance and behavior.

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

## Immediate Phase 2 task

Audit the mobile CSS authority for competing declarations affecting:

- page/root width and max-width;
- horizontal margins and centering;
- transforms/translateX;
- overflow-x and overscroll behavior;
- viewport-sized widths (`100vw`, `100dvw`, etc.);
- shared Coach/Player authenticated shells;
- Demo versus registered selectors or late overrides.

Make only the smallest evidence-backed cleanup that removes duplicate/obsolete authority while keeping Phase 1A/1B/1C green.
