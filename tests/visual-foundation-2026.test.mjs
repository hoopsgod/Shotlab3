import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const tokens = read("../src/theme/appTokens.js");
const semantics = read("../src/theme/semanticColors.js");
const foundation = read("../src/styles/VisualFoundation2026.css");
const main = read("../src/main.jsx");
const header = read("../src/components/AppHeader.jsx");
const auth = read("../src/components/AuthWorkspace.jsx");
const mobileNavigation = read("../src/components/MobileNavigation.module.css");

test("Phase 1 uses a light-first canonical token system", () => {
  assert.match(tokens, /BG_BASE: "#F3F1EA"/);
  assert.match(tokens, /BG_CARD: "#FFFFFF"/);
  assert.match(tokens, /TEXT_PRIMARY: "#111A21"/);
  assert.match(tokens, /PERFORMANCE_SURFACE: "#101C23"/);
  assert.doesNotMatch(tokens, /BG_BASE: "#0B0D10"/);
});

test("semantic colors retain readable light-surface contrast", () => {
  assert.match(semantics, /SUCCESS: "#167A52"/);
  assert.match(semantics, /INFO: "#176B87"/);
  assert.match(semantics, /WARNING: "#A85F0C"/);
  assert.match(semantics, /DANGER: "#C33B49"/);
});

test("the visual foundation loads after the application module", () => {
  const appImportIndex = main.indexOf("await import('./App.jsx')");
  const foundationImportIndex = main.indexOf("await import('./styles/VisualFoundation2026.css')");
  assert.ok(appImportIndex >= 0);
  assert.ok(foundationImportIndex > appImportIndex);
});

test("canonical foundation removes dark-only and glow-heavy authority", () => {
  assert.match(foundation, /--bg-0: #f3f1ea !important/);
  assert.match(foundation, /--surface-1: #ffffff !important/);
  assert.match(foundation, /--font-display:/);
  assert.match(foundation, /\.performance-workspace::before/);
  assert.match(foundation, /display: none !important/);
  assert.match(foundation, /\.cta-primary/);
  assert.match(foundation, /text-transform: none !important/);
  assert.match(foundation, /prefers-reduced-motion/);
});

test("shared headers use editorial system typography", () => {
  assert.match(header, /var\(--font-display\)/);
  assert.match(header, /fontWeight: 780/);
  assert.match(header, /letterSpacing: "-\.038em"/);
  assert.doesNotMatch(header, /Bebas Neue/);
  assert.doesNotMatch(header, /textTransform: "uppercase"/);
});

test("authentication keeps both demos while adopting the new entry system", () => {
  assert.match(auth, /data-testid="auth-workspace"/);
  assert.match(auth, /Train with intent/);
  assert.match(auth, /Player demo/);
  assert.match(auth, /Coach demo/);
  assert.match(auth, /onDemo\("player"\)/);
  assert.match(auth, /onDemo\("coach"\)/);
  assert.match(auth, /Create account/);
});

test("mobile navigation uses restrained light glass materials", () => {
  assert.match(mobileNavigation, /background: rgba\(250, 249, 245, \.88\)/);
  assert.match(mobileNavigation, /box-shadow: 0 -8px 30px rgba\(17, 26, 33, \.07\)/);
  assert.match(mobileNavigation, /--mobile-tab-bar-height: 62px/);
  assert.doesNotMatch(mobileNavigation, /background: rgba\(7, 10, 12, \.84\)/);
});
