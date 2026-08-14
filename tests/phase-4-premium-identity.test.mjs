import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const foundation = read("../src/styles/VisualFoundation2026.css");
const hierarchy = read("../src/components/VisualHierarchy.module.css");
const player = read("../src/components/PlayerDailyCommandCenter.module.css");
const coach = read("../src/styles/MissionControlHierarchy2026.css");
const rail = read("../src/components/OperationalInsightRail.module.css");
const budget = JSON.parse(read("../performance-budget.json"));

test("Phase 4 preserves the Phase 3 surface and performance contracts", () => {
  assert.match(foundation, /--bg-0: #f3f1ea !important/);
  assert.match(foundation, /--surface-1: #ffffff !important/);
  assert.match(foundation, /--performance-surface: #0a2633/);
  assert.equal(budget.maxTotalCssGzipBytes, 88000);
});

test("Phase 4 uses recognizable basketball geometry in performance moments", () => {
  assert.match(hierarchy, /half-court geometry/);
  assert.match(player, /half-court signature/);
  assert.match(coach, /\.mcCourtArtwork/);
  assert.match(coach, /display: block !important/);
  assert.match(rail, /radial-gradient\(ellipse 44% 64%/);
});

test("Phase 4 stats use a coherent editorial numeric treatment", () => {
  assert.match(hierarchy, /font-variant-numeric: tabular-nums/);
  assert.match(player, /font-variant-numeric: tabular-nums/);
  assert.match(coach, /font-variant-numeric: tabular-nums !important/);
  assert.doesNotMatch(hierarchy, /Bebas Neue|Impact|Arial Black/);
});

test("Phase 4 mobile performance copy stays readable", () => {
  assert.match(coach, /font-size: 14px !important/);
  assert.match(player, /\.description \{[^}]*font-size: 15px;/);
  assert.match(foundation, /prefers-reduced-motion: reduce/);
});
