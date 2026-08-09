import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const foundation = read("../src/styles/VisualFoundation2026.css");
const header = read("../src/components/AppHeader.jsx");
const navigation = read("../src/components/MobileNavigation.module.css");
const states = read("../src/components/ShotLabStatePanel.module.css");
const hierarchy = read("../src/components/VisualHierarchy.module.css");
const productionCss = read("../scripts/restructure-production-css.mjs");
const finalAuthorityCleanup = read("../scripts/remove-unreferenced-authority-css.mjs");
const pkg = JSON.parse(read("../package.json"));

test("2026 visual system exposes one shared scale for spacing, typography, gutters, and touch targets", () => {
  for (const token of [
    "--space-1: 4px",
    "--space-4: 16px",
    "--space-6: 24px",
    "--layout-gutter: clamp(16px, 4.65vw, 20px)",
    "--touch-target: 44px",
    "--control-height: 48px",
    "--type-micro: 11px",
    "--type-meta: 12px",
    "--type-secondary: 14px",
    "--type-body: 15px",
  ]) assert.match(foundation, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("shared high-frequency surfaces consume the canonical visual-system tokens", () => {
  assert.match(header, /var\(--touch-target, 44px\)/);
  assert.match(header, /var\(--type-micro, 11px\)/);
  assert.match(navigation, /var\(--layout-gutter, 16px\)/);
  assert.match(navigation, /var\(--type-micro, 11px\)/);
  assert.match(states, /var\(--touch-target,44px\)/);
  assert.match(states, /var\(--type-meta,12px\)/);
  assert.match(hierarchy, /var\(--touch-target, 44px\)/);
  assert.match(hierarchy, /var\(--type-micro, 11px\)/);
});

test("shared system surfaces no longer fall back to unreadable 8-10px interface text", () => {
  const shared = [foundation, header, navigation, states, hierarchy].join("\n");
  assert.doesNotMatch(shared, /font-size:\s*(?:8|9|10)px\b/);
  assert.doesNotMatch(shared, /fontSize:\s*(?:8|9|10)\b/);
  assert.doesNotMatch(shared, /font:\s*[^;]*(?:8|9|10)px\b/);
});

test("mobile content and navigation use the same premium gutter token", () => {
  assert.match(foundation, /padding-inline: var\(--layout-gutter\) !important/);
  assert.match(navigation, /var\(--layout-gutter, 16px\) - var\(--layout-gutter, 16px\)/);
});

test("production keeps the bundled visual authority without shipping duplicate legacy copies", () => {
  assert.match(productionCss, /data-shotlab-authority-bundle/);
  assert.match(productionCss, /\^shotlab-\.\*\\\.css\$/);
  assert.match(productionCss, /!referenced\.has\(entry\.name\)/);
  assert.match(productionCss, /unlink\(path\.join\(DIST_DIR, name\)\)/);
  assert.match(finalAuthorityCleanup, /data-shotlab-authority-bundle/);
  assert.match(finalAuthorityCleanup, /!referenced\.has\(entry\.name\)/);
  assert.match(pkg.scripts.build, /prune-unreachable-global-selectors\.mjs.*remove-unreferenced-authority-css\.mjs$/);
});
