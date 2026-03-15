# Training Mode Card Audit (At Home vs Program)

## Scope
Audit only the two Training Mode cards rendered on the Player home dashboard.

## Current implementation map
- Both cards are rendered in `src/App.jsx` inside the `tab === "home"` dashboard block.
- Each card is instantiated via the same shared `ModeCard` component with different props (`title`, `subtitle`, `icon`, `stats`, `accent`, `isActive`, `onClick`).
- `homeStats` and `programStats` are computed in the same closure where the cards are rendered.
- Shared stat tile presentation is handled by `StatTile`, used by `ModeCard` for both cards.

## What should remain shared
- A single `ModeCard` base structure.
- Shared interaction states (hover, active, focus ring, press scale, keyboard focus behavior).
- Shared card shell layout: header row + stats grid.
- Shared `StatTile` component for visual consistency and maintainability.
- Shared button/class token system (`btn-v`, `cta-*`) and base design tokens.

## What should become mode-specific (via config/props, not forks)
- Header microcopy tone (personal vs scheduled/team framing).
- Stat schema per mode (already partially different; can be further intentionalized).
- Optional semantic chip/label slot for mode context (e.g., "TODAY" vs "SCHEDULED").
- CTA copy and treatment token choice through props (not custom one-off CSS).
- Optional icon container variant within existing mode accent map.

## Smallest safe implementation plan
1. Extend `ModeCard` to accept a compact `variant` config object (optional) containing: `chip`, `ctaLabel`, and `tone` metadata.
2. Keep all structure in `ModeCard`; add conditional render slots for these optional fields.
3. Define two config objects near existing `homeStats`/`programStats` construction and pass them as props to the two current `ModeCard` usages.
4. Reuse existing `MODE_CARD_TOKENS`, `PAGE_ACCENTS`, and `cta-*` classes for styling emphasis; avoid introducing parallel style systems.
5. Avoid touching sub-screens (`log-drill`, `program`) or any business logic/state transitions.
