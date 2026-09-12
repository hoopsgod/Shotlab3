# ShotLab Phase 4 — Signature Visual Identity Audit

Parent dependency: Phase 3 PR #1553 merged at `a70658cf7815a7049edfdca14ed80840a809ba16`.

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

## Implemented on the Phase 4 branch

- Shared `SecondaryPageDecision` dark decision surfaces retain the accepted Phase 3 treatment without adding a duplicate signature or watermark layer.
- `CoachRoutePerformanceStage` now reuses the same ShotLab court/trajectory signature instead of relying only on generic route watermarks.
- Coach route metrics now reuse `ShotLabPerformanceMark`, resolving existing metric labels/keys into rank, streak, PB, or milestone geometry without changing the underlying values or click behavior.
- `ShotLabPerformanceMark` now supports decorative use so repeated visual marks do not create duplicate screen-reader announcements.
- Performance numerals use the established ShotLab condensed athletic type stack with tabular-number alignment, tighter geometry, and reduced generic badge weight.
- Player Progress and leaderboard surfaces retain their existing performance-mark usage, creating a shared Coach/Player visual vocabulary rather than a second component family.
- Focused source regression coverage protects the signature primitive on performance stages, prevents duplicate editorial treatment, and preserves truthful metric values and existing action behavior.

## Why the implementation stops here before more decoration

The strongest Phase 4 gains are now systemic. Additional court graphics, shadows, badges, or motion added page-by-page would increase visual noise and recreate the fragmentation Phase 3 removed. Remaining work is certification-driven: only defects revealed by exact-head build, runtime, parity, accessibility, responsive, or screenshot evidence should justify additional product-facing changes.

## Non-negotiable guardrails

- No authentication, Supabase, schema, routing, navigation, roster, scoring, shot logging, event, RSVP, attendance, archive, leaderboard-calculation, persistence, permission, or Team Store behavior changes.
- No new analytics or fabricated metrics.
- No duplicate signature component family.
- No broad class-substring or test-id-substring visual selectors.
- No new global CSS authority that bypasses `Phase3SurfaceContracts` or the accepted authenticated cascade.
- No performance-budget increase.
- Demo and registered experiences must continue to share the production component tree.
- Primary acceptance viewport remains 390x844, with 375, 430, and representative desktop verification.

## Certification gate

Phase 4 is not merge-ready until the exact current head has passed the relevant production build, performance budget, Demo/registered parity, focused visual/runtime, accessibility/touch, and responsive checks; the exact-head Cloudflare deployment is successful; and fresh rendered evidence confirms the new signature/performance treatment improves rather than crowds the major Coach and Player screens. Phase 4 is based on the accepted Phase 3 merge commit above; any additional product-facing change remains certification-driven.
