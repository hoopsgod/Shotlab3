# ShotLab Demo / Registered Experience Parity Contract

## Product rule

ShotLab Demo is a preview of the production product, not a separate edition of the product.

Coach Demo and Player Demo must use the same product components, layout system, navigation, controls, feature states, copy rules, accessibility behavior, and interaction paths as registered users with the same role and equivalent data state.

## Allowed differences

Demo may differ from a registered session only where required to create a safe preview environment:

- hard-coded demo identity and team identity;
- realistic seeded sample data;
- local or isolated persistence;
- suppression of writes that would mutate production data or invoke real external side effects;
- explicit Coach Demo and Player Demo entry controls before authentication;
- labels that identify the signed-in demo identity, when the corresponding registered surface shows the registered identity in the same location.

## Forbidden differences

Demo must not introduce:

- separate Coach or Player application trees;
- demo-only dashboard/page/component implementations;
- demo-only visual styling, layout, spacing, typography, iconography, or motion;
- product controls that are hidden, added, disabled, or substituted only because a session is demo;
- demo-only empty states, feature previews, storefronts, or alternate feature copy;
- functionality that exists in demo but not in the registered product;
- registered functionality omitted from demo when an equivalent sample-data state can represent it safely.

## Implementation rule

Product UI must derive from role, permissions, feature configuration, and product data—not from demo identity.

`isDemoAccount`, `isDemoMode`, and `setDemoMode` belong at authentication, seed-data, persistence, and external-side-effect boundaries. Product components and screens must not branch on them.

If a feature needs a richer demo, add representative demo data that drives the normal production component path. Do not add a demo-specific rendering branch.

## Server-authoritative leaderboard rule

Registered players can legitimately have a self-scoped local roster while the authorized team leaderboard endpoint returns privacy-minimal teammate summaries containing only display name and aggregate totals. Client-side roster filtering must not discard those already-authorized teammates merely because their private roster identity fields are absent locally.

The home-shots leaderboard API therefore marks its authorized aggregate rows with `leaderboard_source: "remote"`. The client may treat that marker as authoritative for leaderboard display only after normal team/inactive checks and only when the row contains a non-empty display name and a finite, non-negative aggregate. Unmarked identity-less rows and malformed remote rows remain subject to normal roster validation and must be rejected.

This marker is a display/data-provenance contract, not an authorization boundary. Team authorization remains server-side.

## Release gates

Every product change must pass both parity layers before its phase can close:

1. `Demo Registered Experience Parity` protects the shared application tree, equivalent feature behavior, backend-triggered parity contracts, and focused registered/demo journeys.
2. `Demo Registered Runtime Parity` certifies matched Coach and Player data across the complete reachable mobile navigation matrices against the exact built production bundle—or an explicitly supplied deployed URL—comparing structure, geometry, typography, spacing, navigation state, and bounded rendered-pixel drift.

The gates require:

- one shared production component tree;
- matched data state when registered and demo rendering is compared;
- Coach and Player navigation parity;
- Coach Leaderboards parity;
- Team Store and Team Branding coverage where reachable;
- 390×844 mobile overflow safety;
- production-bundle verification rather than a dev-only substitute;
- registered remote leaderboard rows to survive self-scoped local-roster filtering only under the server-authoritative contract above.

## Phase rule

A visual or functional phase is not certified unless its relevant registered and demo paths have both been exercised. Future phases must branch from the latest certified parity-preserving head, not bypass these gates.

If parity fails, fix the shared component, matched data state, backend provenance contract, or safe demo boundary. Never copy a visual or functional change into a separate demo implementation.
