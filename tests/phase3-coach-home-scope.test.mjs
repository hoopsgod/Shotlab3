import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const commandSource = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");

test("Phase 3 Coach Home derives Program Pulse inside the existing Coach player metrics pipeline", () => {
  assert.doesNotMatch(appSource, /buildCoachProgramPulse|const coachProgramPulse=useMemo/);
  assert.match(appSource, /buildCoachPlayerDashboardMetrics\(coachPlayerDashboardRows,persistedCoachPriorities\?\.weeklyMakesTarget\)/);
  assert.match(appSource, /programPulse=\{coachPlayerDashboardMetrics\.programPulse\}/);
  assert.match(commandSource, /data-testid="coach-program-pulse"/);
  assert.match(commandSource, /data-testid="coach-athlete-attention"/);
  assert.match(commandSource, /data-testid="coach-upcoming-event"/);
  assert.match(commandSource, /Recent Activity/);
});

test("Phase 3 Coach Home keeps the established production authority marker", () => {
  assert.match(commandSource, /data-mobile-product-reset="phase-1"/);
  assert.doesNotMatch(commandSource, /data-mobile-product-reset="phase-3"/);
});

test("Phase 3 Coach Home does not disguise activity rate as Program Pulse", () => {
  assert.doesNotMatch(commandSource, /Team pulse/);
  assert.doesNotMatch(commandSource, /activeRate/);
  assert.match(commandSource, /<small>Active<\/small>/);
  assert.match(commandSource, /programPulse = null/);
});
