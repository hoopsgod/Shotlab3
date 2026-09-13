# Phase 6B — Coach Experience Visual Convergence

Base: `f6aa08313edf60573cea9725c99ff97961ce2e04`

## Design authority

Coach Home and Coach Players from Phase 6A remain untouched and continue to define ShotLab's Coach visual language.

Phase 6B extends that language to the remaining Coach experience through the existing `SecondaryPageSystem` and a bounded Coach-secondary presentation owner. It does not introduce a second visual system.

## Material scope

Primary convergence targets:

- Schedule / Events
- Drills
- Leaderboards
- Strength & Conditioning
- Program Branding and Coach administration framing

The pass tightens page rhythm, mobile containment, editorial section boundaries, action/control geometry, and flat supporting evidence treatment while preserving existing workflows and data behavior.

## Engineering boundaries

`CoachSecondaryExperience.css` is imported once from `SecondaryPageSystem.jsx` and deliberately excludes Phase 6A Coach Home and Coach Players selectors. It contains presentation rules only and does not access auth, persistence, routing, permissions, Supabase, or application data.

No feature, backend, data-model, navigation, authentication, permission, iOS/TestFlight, or performance-budget change is part of this phase.

## Validation authority

Required acceptance remains exact-head CI plus the newest Cloudflare Pages deployment. Mobile visual authority begins at 390px, with 320/375/430/768/1024/1280/1440 follow-up and Demo/registered parity on changed Coach surfaces.
