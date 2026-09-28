import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildProgramWorkspaceModel } from "../src/lib/playerOperationalWorkspaces.js";
import { derivePlayerPerformanceNarrative } from "../src/lib/playerPerformanceNarrative.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Player Program coach-priority CTA is an intentional player training action", () => {
  const model = buildProgramWorkspaceModel({
    programDrills: [{ id: "game-speed", name: "Game Speed Reads" }],
    coachPriorities: { priorityDrillText: "Game Speed Reads" },
  });

  assert.equal(model.eyebrow, "Coach-directed work");
  assert.equal(model.primaryAction.label, "Start coach priority");
  assert.equal(model.primaryAction.target, "duels");
  assert.equal(model.primaryAction.drillId, "game-speed");
});

test("Player Home names the existing rolling seven-day calculation explicitly", async () => {
  const app = await read("src/App.jsx");
  const narrative = derivePlayerPerformanceNarrative({
    daily: { makes: 40, goal: 100, pct: 40 },
    weekly: { makes: 240, goal: 500, pct: 48 },
    streak: 2,
    firstSession: { pending: false },
    primaryAction: { source: "daily-goal", urgency: "priority" },
  });

  assert.match(app, /cutoff\.setDate\(cutoff\.getDate\(\)-6\)/);
  assert.equal(narrative.weeklyText, "240 / 500");
  assert.equal(narrative.weeklyLabel, "Last 7 days");
});

test("Progress owns a two-plus-one mobile metric layout instead of three squeezed columns", async () => {
  const css = await read("src/components/PlayerProgressStory.module.css");
  const mobile = css.match(/@media \(max-width: 620px\) \{([\s\S]*?)\n\}/)?.[1] || "";

  assert.match(mobile, /\.metricStrip\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(mobile, /\.metricStrip > div:nth-child\(3\)\s*\{[\s\S]*grid-column:\s*1 \/ -1/);
  assert.match(mobile, /\.metricStrip > div:nth-child\(3\)[\s\S]*border-top:\s*1px solid/);
});

test("existing mobile dock authority reserves content landing and safe-area space", async () => {
  const navigation = await read("src/components/MobileNavigation.module.css");
  const authority = await read("src/styles/AuthenticatedVisualAuthority2026.css");

  assert.match(navigation, /--bottom-nav-content-padding:\s*82px/);
  assert.match(navigation, /min-height:\s*calc\(var\(--mobile-tab-bar-height\) \+ env\(safe-area-inset-bottom, 0px\)\)/);
  assert.match(authority, /--shotlab-mobile-content-landing:\s*var\(--space-6, 24px\)/);
});
