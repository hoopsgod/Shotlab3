# ShotLab Mobile Product Reset — Phase 5 Defect Inventory

Production baseline: `7ef019cfe76f9b6026c0691821be1464eddb73de`

Phase 5 branch: `phase-5-release-hardening`

This inventory is intentionally limited to release-hardening defects. It does not authorize a visual redesign.

## P0 — Blocks use / data safety

No P0 defect confirmed in the audit.

## P1 — Serious reliability or trust

### P1-01 — Failed assignment sync could be presented as Delivered

**Area:** Coach Players → Player Intelligence → Follow-Up Record

`savePlayerAssignment` correctly returns `ok: false` with a locally saved fallback when remote delivery fails. The Follow-Up UI previously consumed that local assignment state (`assigned`) and rendered the delivery label as `Delivered`, both immediately and after a fallback reload.

**Risk:** A coach could believe a player received an assignment that was never confirmed remotely.

**Repair:** Only a successful assignment result may populate the confirmed delivery indicator. Failed or fallback states use explicit unconfirmed/retry language while preserving the editable local draft.

**Regression:** `tests/phase-5-release-hardening.test.mjs`, `tests/e2e/phase-5-release-hardening.spec.mjs`

**Status:** Repaired; certification pending.

### P1-02 — Rapid double taps could start duplicate assignment mutations

**Area:** Coach Follow-Up assignment delivery; Player assignment state actions

React disabled/busy state alone does not synchronously lock a handler during the same event/render window. Rapid repeated taps could therefore start duplicate network mutations before the disabled state committed.

**Risk:** Duplicate writes, confusing success/error races, and avoidable backend work.

**Repair:** Add synchronous `useRef` single-flight guards, retain disabled UI state, expose `aria-busy`, and release locks in `finally`.

**Regression:** `tests/phase-5-release-hardening.test.mjs`, `tests/e2e/phase-5-release-hardening.spec.mjs`

**Status:** Repaired; certification pending.

### P1-03 — Add Player could begin duplicate provisioning requests

**Area:** Coach Players → Add Player & Send Login Invite

The form disabled itself after `busy` rendered, but there was no synchronous lock inside the submit handler.

**Risk:** A rapid repeated submit could race player provisioning/invitation requests, creating duplicate account/invite work or conflicting success states.

**Repair:** Add a synchronous provisioning single-flight guard and always release it in `finally` while preserving existing accessible busy/error behavior.

**Regression:** `tests/phase-5-release-hardening.test.mjs` plus the existing Coach Player Invitations E2E gate.

**Status:** Repaired; certification pending.

### P1-04 — Program Score could begin duplicate save requests

**Area:** Coach Program scoring

The score drawer used React `saving` state as its only duplicate-submit defense.

**Risk:** Rapid repeated submits could produce duplicate supervised score writes and undermine leaderboard/data trust.

**Repair:** Add a synchronous score-submit single-flight guard while retaining validation, user-safe errors, disabled controls, and `aria-busy`.

**Regression:** `tests/phase-5-release-hardening.test.mjs` plus existing Program scoring contracts.

**Status:** Repaired; certification pending.

## P2 — Significant UX / product quality

### P2-01 — Team Branding controls missed the 44px practical target

**Area:** Coach Settings / Team Branding

Several inputs/buttons used 40–42px minimum heights despite the locked 44px mobile target.

**Repair:** Normalize interactive Team Branding controls to at least 44px without changing layout architecture.

**Status:** Repaired; certification pending.

### P2-02 — Team Branding save relied on parent timing for duplicate-submit protection

**Area:** Coach Settings / Team Branding

The save button used the parent `saving` prop but had no synchronous local single-flight guard.

**Repair:** Add local submitting state plus a synchronous ref guard and recover in `finally`.

**Status:** Repaired; certification pending.

### P2-03 — Logo preparation could expose raw exception text

**Area:** Coach Settings / Team Branding

One logo-processing catch path rendered `error.message` directly.

**Risk:** Technical/internal wording can leak into a user-facing production surface.

**Repair:** Replace it with concise recovery-oriented copy and an accessible alert state.

**Status:** Repaired; certification pending.

### P2-04 — Coach Team Store mobile preview lost text contrast on the immersive light surface

**Area:** Coach Team Store → setup preview at mobile widths

Exact-SHA screenshot inspection found the `Official Team Store` preview title and supporting copy rendered with desktop dark-card text colors after the immersive mobile shell moved the portal onto a light full-screen surface. The first stylesheet-only correction still failed the production build because the Phase 3I route enhancer injects a later runtime style during build preparation, overriding the static file.

**Risk:** The preview became visibly white-on-light and failed the intended contrast and release-polish standard despite automated layout checks passing. A downstream-only fix could also appear correct in source while being silently undone in the actual production artifact.

**Repair:** Correct both the static mobile Coach-preview cascade and the Phase 3I runtime-style generator that is the production source of truth. Desktop dark-preview styling and the broader Team Store architecture remain unchanged.

**Regression:** `tests/phase-5-release-hardening.test.mjs` protects both static and generated CSS, and `tests/e2e/phase-3-release-certification.spec.mjs` enforces rendered 4.5:1 contrast in the built production preview.

**Status:** Repaired; exact-head certification and screenshot reinspection pending.

## P3 — Polish

No P3-only change is being taken ahead of reliability certification.

## Certification still required

The repaired items remain unapproved until the Phase 5 candidate passes the production build, unchanged performance budget, targeted/unit contracts, Coach and Player E2E, production acceptance, Demo/registered parity, accessibility/mobile safety, long-content/overflow checks, exact-SHA screenshots, manual screenshot inspection, and exact-SHA Cloudflare deployment verification.
