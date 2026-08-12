import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const foundation = read("../src/styles/VisualFoundation2026.css");
const insightRail = read("../src/components/OperationalInsightRail.module.css");
const commandHierarchy = read("../src/styles/CommandHierarchy2026.css");
const missionControl = read("../src/styles/MissionControlHierarchy2026.css");
const secondaryPages = read("../src/components/SecondaryPageSystem.css");
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


test("Phase 2 intelligence rail keeps one dark priority and readable light support materials", () => {
  for (const token of [
    "--insight-rail-canvas: #f0f1ed",
    "--insight-rail-ink: #111a21",
    "--insight-rail-muted: #65717a",
    "--insight-card-surface: #10171d",
    "--insight-card-copy: #f5f8f9",
    "--insight-card-muted: #b6c0c6",
  ]) assert.ok(foundation.includes(token), "missing " + token);

  assert.match(insightRail, /\.header h2[\s\S]*var\(--insight-rail-ink, #111a21\)/);
  assert.match(insightRail, /\.card\s*\{[\s\S]*background: #fbfbf8/);
  assert.match(insightRail, /\.card h3[\s\S]*color: #172019/);
  assert.match(insightRail, /\.card p[\s\S]*color: #5f6962/);
  assert.match(insightRail, /\.primaryCard h3[\s\S]*color: #f5f8f6/);
  assert.match(insightRail, /\.primaryCard p[\s\S]*color: #b8c2bc/);
  assert.match(insightRail, /min-height: var\(--touch-target, 44px\)/);
});

test("Phase 1 intelligence rail does not ship sub-11px interface text", () => {
  assert.doesNotMatch(insightRail, /font-size:\s*(?:8|9|10)px\b/);
  assert.doesNotMatch(insightRail, /font:\s*[^;]*(?:8|9|10)px\b/);
});


test("Phase 1 shell materials and legacy namespaces resolve through the canonical foundation", () => {
  for (const token of [
    "--shell-rail-surface: #0d171e",
    "--shell-rail-ink: #f5f8f9",
    "--shell-rail-muted: #a9b5bc",
    "--sl-accent: var(--accent)",
    "--sl-ink: var(--text-1)",
    "--sl-muted: var(--text-2)",
    "--sl-line: var(--stroke-1)",
  ]) assert.ok(foundation.includes(token), "missing " + token);

  assert.match(foundation, /\.performance-shell \.sidebar-nav[\s\S]*var\(--shell-rail-surface-raised\)[\s\S]*var\(--shell-rail-surface\)/);
  assert.match(foundation, /\.nav-item\.is-active[\s\S]*var\(--accent\)/);

  for (const isolatedMaterial of [
    "--mc-surface: #ffffff",
    "--mc-surface-quiet: #f5f4ef",
    "--mc-ink: #111a21",
    "--mc-muted: #44515b",
  ]) assert.ok(missionControl.includes(isolatedMaterial), "missing " + isolatedMaterial);
  assert.doesNotMatch(missionControl, /--mc-surface:\s*var\(--surface-1/);
  assert.doesNotMatch(missionControl, /--mc-surface-quiet:\s*var\(--surface-3/);

  assert.match(secondaryPages, /border-radius: var\(--radius-xl, 24px\)/);
  assert.match(secondaryPages, /border-radius: var\(--radius-md, 14px\)/);
});

test("Phase 1 command surfaces enforce readable labels and canonical interaction geometry", () => {
  const commandSurfaces = [commandHierarchy, missionControl].join("\n");
  assert.doesNotMatch(commandSurfaces, /font-size:\s*(?:8|9|10)px\b/);
  assert.doesNotMatch(commandSurfaces, /font:\s*[^;]*(?:8|9|10)px\b/);
  assert.match(commandHierarchy, /width: var\(--touch-target, 44px\)/);
  assert.match(commandHierarchy, /height: var\(--touch-target, 44px\)/);
  assert.doesNotMatch(missionControl, /border-radius:\s*(?:13|15|16|20|22|26)px\b/);
  assert.match(missionControl, /border-radius: var\(--radius-xl, 24px\)/);
  assert.match(missionControl, /border-radius: var\(--radius-lg, 18px\)/);
  assert.match(missionControl, /border-radius: var\(--radius-md, 14px\)/);
});
