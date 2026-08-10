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

## Release gate

Every product change must pass `Demo Paid Experience Parity` before its phase can close.

The gate verifies:

1. the shared production application tree remains intact;
2. UI components/screens do not branch on demo mode or demo identity;
3. registered Coach and Coach Demo load the same core product surfaces and navigation;
4. registered Player and Player Demo load the same core product surfaces and navigation;
5. equivalent feature states, including Team Store state, use the same component path;
6. mobile parity remains safe at the current 390×844 acceptance viewport.

## Phase rule

A visual or functional phase is not certified unless its relevant registered and demo paths have both been exercised. Future phases must branch from the latest certified parity-preserving head, not bypass this gate.
