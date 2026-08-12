# Phase 7 — Final App Store Polish

## Goal
Bring every primary ShotLab surface to hero-screenshot quality for a premium 2026 App Store presentation without changing auth, persistence, scoring, roster, RSVP, leaderboard, or navigation semantics.

## Visual acceptance standard
- Every primary Coach and Player screen must stand on its own as an App Store-quality screenshot at iPhone width.
- Shared typography, spacing, color, iconography, and motion must feel intentional rather than framework-default.
- Empty, loading, offline, success, and completion states must remain designed and useful.
- No placeholder copy, raw identifiers, generic browser-style controls, duplicated hierarchy, clipping, or horizontal overflow.
- Interactive targets remain at least 44px where required.
- Demo and registered users continue to render the same product UI.
- Existing performance budgets remain fixed; no budget waiver.

## Phase 7 screenshot matrix
Fresh production-built 390×844 evidence is required for:
1. Auth / sign-in
2. Coach Home
3. Coach Players
4. Coach Schedule
5. Coach Leaderboards
6. Player Home
7. Player Train
8. Player Progress
9. Player Program
10. Player Rankings

## First-pass polish priorities
1. Remove any remaining generic or duplicated hierarchy that weakens screenshot composition.
2. Reconcile shared back/navigation affordances so secondary screens feel native and compact while preserving touch geometry.
3. Audit icon consistency and remove any remaining text/emoji-style stand-ins from primary surfaces.
4. Audit type weight, muted copy contrast, and card rhythm at 390px width.
5. Verify fixed mobile navigation never competes with hero content or obscures the next meaningful section.
6. Re-run App Store presentation readiness, cross-screen visual audit, demo/paid parity, production acceptance, and performance budget on the exact head.

## Starting evidence
Phase 7 begins from production commit `ff636a8527004940064b3bbe942e0c0bee883d99`, after the prior reconciliation phase was merged. The exact pre-Phase-7 390×844 cross-screen audit passed and provides the baseline screenshot set for comparison.

## Closure rule
Phase 7 does not close on green CI alone. The final exact-head screenshot set must also be manually reviewed for hierarchy, spacing, typography, iconography, clipping, theme consistency, and overall App Store presentation quality before merge.
