import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../src/styles/Phase6AVisualSystem.css", import.meta.url), "utf8");
const enhancer = readFileSync(new URL("../src/lib/coachHomeHierarchyEnhancer.js", import.meta.url), "utf8");

test("Phase 6A visual authority stays bounded to Coach Home and Coach Players", () => {
  assert.match(css, /\.performance-shell--coach \.mcShellV3/);
  assert.match(css, /\.premium-roster-workspace/);
  assert.match(css, /coach-players-primary-objective/);
  assert.match(css, /coach-players-metrics/);
  assert.match(css, /coach-mission-control/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.doesNotMatch(css, /supabase|fetch\(|localStorage|sessionStorage/i);
});

test("Phase 6A authority is injected after optimized CSS without changing application behavior", () => {
  assert.match(enhancer, /Phase6AVisualSystem\.css\?inline/);
  assert.match(enhancer, /shotlab-phase6a-visual-authority/);
  assert.match(enhancer, /dataset\.shotlabVisualSystem = "phase-6a"/);
  assert.match(enhancer, /setTimeout\(\(\) =>/);
  assert.match(enhancer, /document\.head\.appendChild\(style\)/);
});
