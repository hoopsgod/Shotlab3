# Desktop single-page workspace shell Phase 2 implementation plan

## Goal
Harden ShotLab's existing native History API desktop workspace so Coach and Player primary flows behave as one persistent application without changing mobile navigation authority, data ownership, or fixed production budgets.

## Verified parent
- Parent PR: #1580 (`Desktop team workspace inspired by Hudl flow`)
- Parent branch: `agent/desktop-hudl-workspace-clean`
- Parent exact SHA: `8d90633f5d39ebb3a133094222b6a1e449072123`
- Parent immutable Cloudflare preview: `https://300ad071.shotlab3.pages.dev`
- Existing routing: native `window.history.pushState` / `popstate` in `src/App.jsx`; no React Router.
- Existing desktop shell authority in JS/tests begins at 1024px.
- Existing CSS desktop shell authority currently begins at 981px and must be reconciled with the 1024px application boundary.

## Architecture decision
Extend the existing History API implementation. Do not add a second router, duplicate application data, or build a parallel shell. Keep Coach mobile route behavior and existing Player mobile navigation semantics intact.

## TDD sequence
1. Add focused source contracts and Playwright Phase 2 workflows before production changes.
2. Prove the new contracts fail against the verified parent where expected (desktop breakpoint and active navigation semantics).
3. Make the smallest implementation changes required: align shell CSS to the 1024px boundary; expose `aria-current="page"` on active persistent desktop navigation; add context restoration only if the browser test proves existing drawer/history behavior does not preserve it.
4. Re-run focused tests plus all fixed production/mobile/performance gates without threshold or assertion changes.

## Required browser contracts
### Coach desktop
- Home → Players → player detail → Back restores roster/context.
- Home → Events → Back → Home.
- Home → Analytics → Back → Home.
- Multiple Back/Forward transitions preserve URL and workspace state.
- Supported deep-route reload restores the route.
- Re-selecting the active destination does not inflate history.
- A JS document token survives primary navigation, proving no document navigation.

### Player desktop
- Home → Train (`/quick-menu`) → Progress (`/profile`) → Back → Train.
- Home → Events → Back → Home.
- Back/Forward and direct deep-route reload work.
- Re-selecting the active destination does not inflate history.
- A JS document token survives primary navigation.

## Responsive boundary
- 320/375/390/430: mobile dock remains authoritative, no desktop shell leakage or horizontal pan.
- 768 and 1023: intentional non-desktop behavior.
- 1024/1280/1440: persistent desktop workspace authority, no duplicate mobile dock or horizontal pan.

## Release certification
A dedicated Phase 2 workflow for PRs targeting `agent/desktop-hudl-workspace-clean` must:
- check out the exact PR head;
- run unit/source contracts;
- build with unchanged budgets;
- wait for the exact-head successful immutable Cloudflare Pages check;
- assert PR head SHA equals deployment SHA;
- run deployed Phase 1A mobile geometry and Phase 2/acceptance browser suites;
- retain evidence artifacts.

No merge is permitted. Final state is only `MERGE-READY — DO NOT MERGE` or `BLOCKED — DO NOT MERGE`.