import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveInterpretedPerformanceTrends,
  formatPlayerDrillDisplayName,
  resolvePlayerDrillDisplayName,
} from "../src/lib/playerDashboardSelectors.js";

test("machine drill identifiers become player-facing basketball labels", () => {
  assert.equal(
    formatPlayerDrillDisplayName("demo-home-warm-up-shooting-4-minute"),
    "4-Minute Warm-Up Shooting",
  );
  assert.equal(formatPlayerDrillDisplayName("demo-form-shooting"), "Form Shooting");
  assert.equal(formatPlayerDrillDisplayName("demo-drill"), "Practice Drill");
});

test("catalog names win over machine identifiers", () => {
  assert.equal(
    resolvePlayerDrillDisplayName({
      drillId: "demo-program-pressure-shooting-50",
      drills: [{ id: "demo-program-pressure-shooting-50", name: "Pressure Shooting 50" }],
    }),
    "Pressure Shooting 50",
  );
});

test("opaque identifiers never leak to the player experience", () => {
  assert.equal(
    formatPlayerDrillDisplayName("550e8400-e29b-41d4-a716-446655440000"),
    "Training Drill",
  );
});

test("interpreted performance trends expose a readable strongest drill", () => {
  const trends = deriveInterpretedPerformanceTrends({
    today: "2026-08-11",
    scores: [
      { drillId: "demo-home-warm-up-shooting-4-minute", date: "2026-08-11" },
      { drillId: "demo-home-warm-up-shooting-4-minute", date: "2026-08-10" },
      { drillId: "demo-form-shooting", date: "2026-08-09" },
    ],
    shotLogs: [{ date: "2026-08-11", made: 125 }],
  });

  assert.equal(trends.strongestDrill, "4-Minute Warm-Up Shooting");
  assert.doesNotMatch(JSON.stringify(trends), /demo-home-warm-up-shooting-4-minute/);
});

test("language cleanup preserves strongest-drill grouping by drill name", () => {
  const trends = deriveInterpretedPerformanceTrends({
    today: "2026-08-11",
    scores: [
      { drillId: "pressure-a", drillName: "Pressure Shooting", date: "2026-08-11" },
      { drillId: "pressure-a", drillName: "Pressure Shooting", date: "2026-08-10" },
      { drillId: "pressure-b", drillName: "Pressure Shooting", date: "2026-08-09" },
      { drillId: "pressure-b", drillName: "Pressure Shooting", date: "2026-08-08" },
      { drillId: "finishing", drillName: "Finishing", date: "2026-08-11" },
      { drillId: "finishing", drillName: "Finishing", date: "2026-08-10" },
      { drillId: "finishing", drillName: "Finishing", date: "2026-08-09" },
    ],
  });

  assert.equal(trends.strongestDrill, "Pressure Shooting");
});
