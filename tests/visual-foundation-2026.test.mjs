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

const channel = (value) => {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const value = hex.replace("#", "");
  const red = channel(Number.parseInt(value.slice(0, 2), 16));
  const green = channel(Number.parseInt(value.slice(2, 4), 16));
  const blue = channel(Number.parseInt(value.slice(4, 6), 16));
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
};

const contrastRatio = (foreground, background) => {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

test("Phase 1 uses a light-first canonical token system", () => {
  assert.match(tokens, /BG_BASE: "#F3F1EA"/);
  assert.match(tokens, /BG_CARD: "#FFFFFF"/);
  assert.match(tokens, /TEXT_PRIMARY: "#111A21"/);
  assert.match(tokens, /TEXT_MUTED: "#65717A"/);
  assert.match(tokens, /PERFORMANCE_SURFACE: "#101C23"/);
  assert.doesNotMatch(tokens, /BG_BASE: "#0B0D10"/);
});

test("semantic colors retain readable light-surface contrast", () => {
  assert.match(semantics, /SUCCESS: "#167A52"/);
  assert.match(semantics, /INFO: "#176B87"/);
  assert.match(semantics, /WARNING: "#A85F0C"/);
  assert.match(semantics, /DANGER: "#C33B49"/);
});

test("muted copy and placeholders meet normal-text AA contrast", () => {
  assert.match(foundation, /--text-3: #65717a !important/);
  assert.match(foundation, /--nav-inactive: #65717a !important/);
  assert.match(foundation, /color: #69757d !important/);
  assert.ok(contrastRatio("#65717A", "#FFFFFF") >= 4.5);
  assert.ok(contrastRatio("#69757D", "#FFFFFF") >= 4.5);
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

test("foundation preserves contextual CTA widths and specialized native controls", () => {
  const ctaBlock = foundation.match(/\.cta-primary,\n\.cta-primary-accent,[\s\S]*?box-shadow: none !important;\n\}/)?.[0] || "";
  assert.ok(ctaBlock);
  assert.doesNotMatch(ctaBlock, /width:\s*100%/);
  assert.match(foundation, /\[data-testid="auth-workspace"\] \.cta-primary \{\n  width: 100% !important;/);
  assert.match(foundation, /input:not\(\[type\]\),/);
  assert.match(foundation, /input\[type="checkbox"\],\ninput\[type="radio"\] \{\n  accent-color:/);
  assert.doesNotMatch(foundation, /input,\nselect,\ntextarea \{\n  border:/);
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
  assert.match(auth, /Private team data/);
  assert.match(auth, /Progress that carries forward/);
});

test("authentication segmented controls expose native interaction semantics", () => {
  assert.match(auth, /role="tablist"/);
  assert.match(auth, /role="tab" aria-selected=/);
  assert.match(auth, /role="radiogroup"/);
  assert.match(auth, /role="radio" aria-checked=/);
  assert.match(auth, /type="button" className="btn-v cta-primary"/);
  assert.match(auth, /<button type="button" style=\{\{width:"100%"/);
});

test("mobile navigation keeps glass restrained to the floating shell", () => {
  assert.match(mobileNavigation, /background: rgba\(250, 249, 245, \.78\)/);
  assert.match(mobileNavigation, /box-shadow: 0 18px 46px rgba\(17, 26, 33, \.16\)/);
  assert.match(mobileNavigation, /--mobile-tab-bar-height: 64px/);
  assert.match(mobileNavigation, /border-radius: 24px/);
  assert.match(mobileNavigation, /backdrop-filter: blur\(28px\) saturate\(150%\)/);
  assert.doesNotMatch(mobileNavigation, /background: rgba\(7, 10, 12, \.84\)/);
});
