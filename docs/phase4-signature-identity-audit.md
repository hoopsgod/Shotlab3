# ShotLab Phase 4 — Signature Visual Identity Audit

Parent dependency: Phase 3 PR #1553 exact head `5e2e225bd6a211567992c4403e679cfdc87d2155`.

## Objective

Make ShotLab unmistakably ShotLab across Coach and Player without changing product behavior. Phase 4 owns premium athletic identity, signature basketball visual language, metric presentation, restrained material depth, icon consistency, and micro-interaction polish. It must extend the accepted Phase 3 coherence system rather than create a competing design authority.

## Existing signature assets that must be reused

- `ShotLabSignatureField` already provides court, ball, trajectory, and SL mark geometry.
- `ShotLabPerformanceMark` already provides rank, streak, personal-best, milestone, and delta marks.
- Existing historical Phase 4A–4D enhancers/workflows already protect entry, Player Home, Player Progress, premium performance marks, interaction/material motion, and state-system behavior.
- Current Phase 3 contracts already own light/dark surface contrast, shared secondary-page geometry, action hierarchy, Coach convergence, Demo/registered parity, and 390px containment.

## Phase 4 implementation priorities

1. Cross-role signature identity: extend the strongest existing ShotLab geometry and visual motifs to selected Coach and Player identity/performance surfaces without decorative repetition.
2. Premium metric language: standardize high-value numbers, deltas, streaks, ranks, milestones, targets, and trend presentation through the existing performance-mark system.
3. Basketball-specific intelligence graphics: use court/trajectory/shot cues only where they reinforce training, progress, ranking, or program intelligence.
4. Typography refinement: reserve condensed/display treatment for page identity and performance numbers; keep operational and supporting copy readable.
5. Material/depth refinement: one emphasized decision surface, calm cream/light evidence surfaces, restrained borders, limited elevation, no return to card overload.
6. Icon refinement: semantic ShotLab icons only; remove decorative emoji/Unicode substitutions where encountered within Phase 4 surfaces.
7. Interaction polish: restrained pressed/focus/loading/reduced-motion behavior with no animation for animation's sake.
8. Coach/Player product-family parity: Coach remains denser and operational; Player remains more motivational, but both visibly share the same ShotLab signature system.

## Non-negotiable guardrails

- No authentication, Supabase, schema, routing, navigation, roster, scoring, shot logging, event, RSVP, attendance, archive, leaderboard-calculation, persistence, permission, or Team Store behavior changes.
- No new analytics or fabricated metrics.
- No duplicate signature component family.
- No broad class-substring or test-id-substring visual selectors.
- No new global CSS authority that bypasses `Phase3SurfaceContracts` or the accepted authenticated cascade.
- No performance-budget increase.
- Demo and registered experiences must continue to share the production component tree.
- Primary acceptance viewport remains 390x844, with 375, 430, and representative desktop verification.

## First implementation seam

Start with the existing `ShotLabSignatureField` and `ShotLabPerformanceMark` primitives. Expand use only on surfaces where basketball identity or performance meaning is real. The first visual pass should target one Coach decision/performance surface and one Player performance surface, verify that the signature language feels related rather than duplicated, then scale the pattern to other eligible destinations.
