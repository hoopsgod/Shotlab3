# Phase 6A — Visual System + Coach Home / Players

Base: `e7462d11328d863b5d63681511026429d89f99c0`

## Scope

Phase 6A establishes the visual authority for the shared 2026 ShotLab language and applies it only to Coach Home and Coach Players.

Implemented:

- stronger team-branded Coach Home command stage using the existing Mission Control title-stage/mobile owners;
- decision-first hierarchy for primary action, metrics, Program Pulse, attention, upcoming event, and recent activity;
- reduced card chrome in favor of editorial hierarchy and hairline separators;
- mobile-first Coach Home geometry at 390px-class widths;
- Coach Players adoption of the shared team-identity title stage, roster command surface, integrated metrics, search/filter controls, and flatter empty-state treatment;
- consolidation of the approved Phase 6A presentation into canonical Coach Home and Players owners instead of a late override layer;
- removal of the temporary `Phase6AVisualSystem.css` migration source and its Vite `?inline` dependency from the pure Coach Home enhancer path;
- regression coverage confirming the pure Node-importable enhancer boundary and bounded Coach Home / Players visual authority.

## Guardrails preserved

No feature additions. No backend, Supabase, auth, permission, routing, navigation, event, leaderboard, shot-logging, attendance, or iOS/TestFlight behavior changes. Performance budgets and required assertions remain unchanged. No merge is performed by this phase.

## Acceptance follow-up

PR/CI and the newest exact-head Cloudflare Pages preview remain the release authority. Visual review should prioritize 390px Coach Home and Coach Players first, then 320/375/430/768/1024/1280/1440 and Demo/registered parity before merge.
