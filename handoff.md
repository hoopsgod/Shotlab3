# ShotLab Phase 1 Handoff

## Current review boundary

- Subphase: **Phase 1A — mobile geometry and horizontal-axis contracts**
- Status: ready for draft-PR review after exact-head CI and Cloudflare preview verification
- Phase 1B and Phase 1C: not started; acceptance of Phase 1A is required first
- Branch: `agent/phase1a-mobile-geometry-guardrails`
- Base branch: `march-3-reset-85393dd`
- Base SHA: `208b7799bec1138e4a51eb514436037c83bd118e`
- Exact Phase 1A head: resolve the branch/PR head after this handoff commit; the PR checks and release handoff are authoritative because a commit cannot contain its own SHA

## Phase 0 baseline

- Exact-base Cloudflare preview: `https://f1441df2.shotlab3.pages.dev`
- Deployment status: successful and mapped by the Cloudflare Pages check to base SHA `208b7799bec1138e4a51eb514436037c83bd118e`
- Baseline geometry: Demo Coach and Player at 320, 375, 390, and 430 CSS pixels had document/body widths equal to the viewport and zero horizontal page scroll
- Secure registered fixtures: repository-owned mocked authentication and deterministic storage fixtures work without credentials or production user data
- Existing harmless app warning: `[analytics] VITE_ANALYTICS_ENDPOINT not set; events will be queued locally.`
- Existing suite debt: `npm test` has 107 failures at the exact base and 106 on this branch; the failure-name comparison shows no new failure from Phase 1A

## Phase 1A changes

- `tests/e2e/support/mobile-geometry-contract.mjs`: reusable geometry, equal-rail, viewport-bound, diagnostic, page-gesture, and local-scroll assertions
- `tests/e2e/phase1a-mobile-geometry.spec.mjs`: login/registration, Coach Home/Players/Events, Player Home/Progress, Demo/registered, and 320/375/390/430 coverage
- `playwright.phase1a.config.mjs`: production-preview Chromium/WebKit projects and deterministic artifact paths
- `.github/workflows/phase1a-mobile-geometry.yml`: exact-head build, browser matrix, negative proof, and evidence upload
- `package.json`: focused Phase 1A command
- No application source, CSS, layout, data, or product behavior changes

## Validation

- `npm run build`: pass; production bundle tested after restoring build-generated source rewrites
- `npm run test:e2e:phase1a -- --project=mobile-chromium`: pass, 20 passed / 1 expected skip
- Controlled overflow fixture: expected fail; injected width 438px against a 390px body and was rejected by the one-pixel contract
- Focused mobile/viewport/parity Node contracts: pass, 39 passed
- `npm test`: inherited failure, 1713 passed / 106 failed / 1 skipped; exact-base comparison is 1712 passed / 107 failed / 1 skipped with no new failing test name
- Local WebKit launch: environment-blocked by missing GTK/GStreamer/WebKit libraries; CI installs Chromium/WebKit with system dependencies
- `git diff --check` and Node syntax checks: pass

## Guardrail decisions

- Tolerance remains one rendered CSS pixel.
- The only horizontal-scroll allowlist entry is the semantic selector `[aria-label="Dashboard view filters"]`, the Coach Players five-filter chip row. Its horizontal wheel gesture moves the local rail while page horizontal positions remain zero.
- The accepted Coach Players presentation hides the separate decision brief; its visible title stage owns status and primary actions and is therefore the protected primary decision region.
- The deliberate overflow fixture is test-only and disabled unless `PHASE1A_ENABLE_NEGATIVE_FIXTURE=1`.

## Next gate

Push the single-purpose Phase 1A commit, open or update one draft PR, verify CI and the Cloudflare preview against the exact PR head, and re-run the critical contract against that exact preview. Do not begin Phase 1B until Phase 1A is accepted.
