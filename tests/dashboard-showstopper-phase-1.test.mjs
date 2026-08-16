import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { derivePlayerPerformanceNarrative } from "../src/lib/playerPerformanceNarrative.js";

const narrative = (makes, overrides = {}) => derivePlayerPerformanceNarrative({
  daily: { makes, goal: 100, pct: Math.min(100, makes) },
  weekly: { makes, goal: 650, pct: Math.min(100, Math.round((makes / 650) * 100)) },
  streak: 2,
  firstSession: { pending: false },
  primaryAction: { source: "daily-goal", urgency: makes >= 100 ? "complete" : "priority" },
  ...overrides,
});

test("performance narrative interprets zero, partial, near-complete, complete, and above-target states", () => {
  const zero = narrative(0);
  assert.equal(zero.interpretation, "100 TO TARGET");
  assert.equal(zero.headline, "Today starts here.");

  const early = narrative(25);
  assert.equal(early.interpretation, "75 TO TARGET");
  assert.match(early.description, /75 makes remain/);

  const near = narrative(85);
  assert.equal(near.interpretation, "15 TO TARGET");

  const complete = narrative(100);
  assert.equal(complete.interpretation, "TARGET COMPLETE");
  assert.equal(complete.headline, "Daily work banked.");

  const above = narrative(125);
  assert.equal(above.interpretation, "+25 ABOVE TARGET");
  assert.equal(above.makes, 125);
  assert.equal(above.complete, true);
});

test("performance narrative handles no streak, missing weekly target, and coach-directed work", () => {
  const result = narrative(25, {
    weekly: { makes: 125, goal: 0, pct: 0 },
    streak: 0,
    primaryAction: { source: "coach", urgency: "priority" },
  });
  assert.equal(result.streakText, "No active run");
  assert.equal(result.weeklyText, "125");
  assert.equal(result.weeklyLabel, "This week · no target");
  assert.equal(result.contextLabel, "Coach plan");
});

test("first-session state remains distinct from normal zero-progress state", () => {
  const result = narrative(0, {
    firstSession: { pending: true },
    primaryAction: { source: "activation", urgency: "priority" },
  });
  assert.equal(result.headline, "Set your baseline.");
  assert.equal(result.contextLabel, "Baseline");
  assert.match(result.description, /one completed shooting set/i);
});

test("cream progress disclosure owns readable light-surface semantic tokens", async () => {
  const css = await readFile(new URL("../src/components/PlayerDailyCommandCenter.module.css", import.meta.url), "utf8");
  assert.match(css, /player-daily-momentum-signal[\s\S]*--text-1:#17211a!important/);
  assert.match(css, /player-daily-momentum-signal[\s\S]*--text-2:#465149!important/);
  assert.doesNotMatch(css, /player-daily-momentum-signal[\s\S]{0,220}--text-1:#f5f2ea!important/);
});

test("dark ExperienceSignal surfaces own readable light text before route overrides", async () => {
  const css = await readFile(new URL("../src/components/PlayerDailyPrimitives.module.css", import.meta.url), "utf8");
  assert.match(css, /\.signal\s*\{[\s\S]*--text-1:\s*#f5f7f8/);
  assert.match(css, /\.signal\s*\{[\s\S]*--text-2:\s*#b6c0c6/);
  assert.match(css, /\.signalTitle\s*\{[\s\S]*color:\s*var\(--text-1/);
  assert.match(css, /\.signalDetail\s*\{[\s\S]*color:\s*var\(--text-2/);
});

test("hero composition has one dominant action and no legacy KPI-card strip", async () => {
  const source = await readFile(new URL("../src/components/PlayerDailyCommandCenter.jsx", import.meta.url), "utf8");
  assert.match(source, /data-testid="player-today-performance"/);
  assert.match(source, /data-testid="player-target-interpretation"/);
  assert.equal((source.match(/data-testid="player-daily-primary-action"/g) || []).length, 1);
  assert.doesNotMatch(source, /progressCard|progressGrid|Today’s focus|Personal development|About \{primary\.estimatedMinutes/);
});
