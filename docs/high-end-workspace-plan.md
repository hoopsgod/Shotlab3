# ShotLab Premium Workspace Rollout

## Objective
Bring every coach and player workspace into the same 2026 visual system as Coach Mission Control without changing data behavior, permissions, routes, or Supabase schema.

## Shared visual language
- Near-black arena foundation with controlled depth rather than flat gray cards.
- Team-brand accent used as a precision signal, not a full-surface fill.
- Layered surfaces: page backdrop, command surface, operational card, inset row.
- Strong editorial hierarchy: eyebrow, title, operational summary, primary action.
- Compact status chips and semantic color usage.
- 44px minimum touch targets and iPhone-safe spacing.
- Reduced visual density through grouped sections and progressive disclosure.

## Rollout surfaces
### Coach
- Players roster and player detail
- Events and RSVP management
- Drill management and edit flows
- Leaderboards and analytics
- Strength and conditioning
- Activity feed and priority editor
- Season archive and profile/settings
- Team branding

### Player
- Player dashboard
- At Home logging
- Program drills
- Events and RSVP
- Leaderboards
- Strength and conditioning
- Profile/progress

## Architecture
1. Add `PremiumWorkspace.css` as the shared page/surface/button/form/nav layer.
2. Add explicit workspace scope classes to coach and player roots.
3. Normalize reusable headers and visual hierarchy components.
4. Add route-aware page signatures and restrained page-specific accents.
5. Add visual contract tests for scope, mobile spacing, touch targets, and semantic tokens.

## Guardrails
- No schema or data migration.
- No route or permission changes.
- No removal of existing functionality.
- Mission Control remains visually distinct as the top-level coach home while all secondary workspaces inherit its design language.
