# Phase 6A — Visual System + Coach Home / Players

Base: `e7462d11328d863b5d63681511026429d89f99c0`

## Scope

Phase 6A establishes the visual authority for the shared 2026 ShotLab language and applies it only to Coach Home and Coach Players.

Implemented:

- shared ink, paper, line, accent, typography, and shadow tokens;
- stronger team-branded Coach Home command stage;
- decision-first hierarchy for primary action, metrics, Program Pulse, attention, upcoming event, and recent activity;
- reduced card chrome in favor of editorial bands and hairline separators;
- mobile-first Coach Home geometry at 390px-class widths;
- editorial Coach Players header, roster command surface, integrated metrics, search/filter controls, and empty-state surface treatment;
- deterministic late visual-authority injection so production CSS optimization cannot silently reorder Phase 6A behind legacy layers;
- static regression contract confirming scope and late-authority wiring.

## Guardrails preserved

No feature additions. No backend, Supabase, auth, permission, routing, navigation, event, leaderboard, shot-logging, attendance, or iOS/TestFlight behavior changes. No merge is performed by this phase.

## Acceptance follow-up

PR/CI and Cloudflare preview evidence remain the release authority. Visual review should prioritize 390px Coach Home and Coach Players first, then 320/375/430/768/1024/1280/1440 and Demo/registered parity before merge.
