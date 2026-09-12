# ShotLab Phase 3 visual-system audit

Parent production baseline: `1d329259f8971dac148884554757366be892aa71`

Phase 3 is an app-wide coherence pass. It preserves Phase 2 behavior and uses the strongest existing shared systems (`TeamIdentityTitleStage`, `SecondaryPageSystem`, semantic team-brand tokens) as the design authority.

## Systemic findings

1. **Title/surface ownership is fragmented.** Multiple legacy selectors still style headings and copy by class-name convention rather than the actual surface. Phase 3 must keep foreground color component/surface-owned and must not add wildcard visual authority.
2. **Secondary-page rhythm is uneven.** The shared secondary shell exists, but several downstream sections still use page-specific spacing, radius, and shadow values. The target is one spacing/radius/elevation hierarchy, not identical layouts.
3. **Action hierarchy is inconsistent.** Primary actions are clear on the strongest Phase 2 surfaces, while secondary pages still contain competing filled actions. Phase 3 standardizes primary/secondary/tertiary semantics and 44px minimum targets.
4. **Card density remains too high in older secondary surfaces.** Editorial sections, dividers, grouped rows, and restrained panels should replace decorative nested cards where no grouping value is added.
5. **Coach/Player visual language is close but not fully unified.** Both roles should share typography, material, spacing, control, empty-state, icon, and responsive contracts while retaining role-appropriate information density.
6. **Team branding needs derived foreground protection.** Raw team colors cannot be assumed readable. Titles and body text must remain independent from arbitrary team colors.
7. **390px remains the acceptance viewport.** Every shared contract must protect gutters, long names/titles, bottom-dock clearance, safe areas, and horizontal overflow.

## Implementation order

- Phase 3B: strengthen surface/foreground and typography contracts.
- Phase 3C: normalize secondary-page gutters, vertical rhythm, and section framing.
- Phase 3D: normalize shared controls, panels, rows, empty states, borders, radii, and elevation.
- Phase 3E/F: inherit those contracts across Coach and Player secondary screens rather than page-specific redesigns.
- Phase 3G/H: retain cross-role and Demo/registered structural parity.
- Phase 3I/J: certify 390px/mobile behavior, build, exact-head deployment, and screenshots.

## Non-goals

No authentication, data-model, Supabase, navigation, roster, scoring, event, archive, permission, Team Store, or persistence behavior changes. No Phase 2 redesign and no broad emergency CSS layer.
