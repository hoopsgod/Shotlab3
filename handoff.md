# ShotLab Phase 1 Handoff

## Current review boundary

- Subphase: **Phase 1B — Demo/registered parity and deterministic state fixtures**
- Status: implementation started from the accepted Phase 1A merge
- Branch: `agent/phase1b-demo-registered-parity-fixtures`
- Base branch: `march-3-reset-85393dd`
- Base SHA: `d7b5086e8b3f47dbd2f6d330f889f2973ad01130` (Phase 1A merge commit)
- Phase 1C: not started; Phase 1B must be accepted first

## Accepted Phase 1A baseline

- PR #1519 merged at exact head `051e1845189ec54330eb3695329c7f224d4b9f94`.
- Merge commit: `d7b5086e8b3f47dbd2f6d330f889f2973ad01130`.
- Phase 1A exact-head CI passed production build, Chromium/WebKit mobile geometry matrix, deliberate-overflow negative proof, and evidence upload.
- Exact-head Cloudflare preview for the accepted Phase 1A head: `https://e30e7eda.shotlab3.pages.dev`.
- One-pixel mobile geometry contract and the single approved local horizontal scroller remain unchanged.

## Phase 1B implementation

- `tests/e2e/support/phase1b-state-fixtures.mjs`: reusable credential-free paired fixtures for Demo and deterministic registered sessions.
- `tests/e2e/phase1b-state-parity.spec.mjs`: paired Coach/Player layout-authority and geometry verification at 390×844.
- `playwright.phase1b.config.mjs`: isolated Chromium/WebKit production-preview configuration.
- `.github/workflows/phase1b-demo-registered-state-parity.yml`: exact-head build, Phase 1B browser matrix, Phase 1A Chromium regression rerun, and paired evidence upload.
- `package.json`: focused `test:e2e:phase1b` command.
- No application source, CSS, layout, persistence, auth, or product behavior changes.

## Deterministic state matrix

Coach:
- populated roster/activity state;
- empty/onboarding state;
- long team name + unusually wide custom logo + hostile/light brand-color stress state.

Player:
- populated training/activity state;
- first-use state with zero scores, shot logs, and events;
- long team name + unusually wide custom logo + hostile/light brand-color stress state.

Each state is exercised as a paired Demo and registered session with equivalent visible product data. Account identity is allowed to differ; layout ownership, structure, route geometry, horizontal safety, and presentation authority are not.

## Phase 1B acceptance contract

- Demo and registered pairs use the same route shells and layout owners rather than exact-copy matching.
- Coach routes: Home, Players, Events.
- Player routes: Home, Progress/Profile.
- Every protected route must satisfy the inherited Phase 1A mobile geometry contract.
- Paired screenshots and JSON geometry/ownership evidence are written under `artifacts/phase1b/`.
- CI runs on every pull request so future non-source changes cannot silently bypass the deterministic parity gate.
- The Phase 1B workflow re-runs the full Phase 1A Chromium matrix after the state-parity matrix.
- No live credentials or production user data are used.

## Next gate

Validate syntax/diff integrity, push the single-purpose Phase 1B commit, open one draft PR, and certify the exact PR head through the Phase 1B workflow and its matching Cloudflare Pages preview. Do not begin Phase 1C until Phase 1B is accepted.
