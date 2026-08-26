import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const commandSource = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");

test("Phase 3 Coach Home wires truthful Program Pulse through the existing Coach player-row model", () => {
  assert.match(appSource, /buildCoachProgramPulse/);
  assert.match(appSource, /const coachProgramPulse=useMemo\(\(\)=>buildCoachProgramPulse\(coachPlayerDashboardRows,persistedCoachPriorities\?\.weeklyMakesTarget\)/);
  assert.match(appSource, /programPulse=\{coachProgramPulse\}/);
  assert.match(commandSource, /data-testid="coach-program-pulse"/);
  assert.match(commandSource, /data-testid="coach-athlete-attention"/);
  assert.match(commandSource, /data-testid="coach-upcoming-event"/);
  assert.match(commandSource, /Recent Activity/);
});

test("Phase 3 Coach Home does not disguise activity rate as Program Pulse", () => {
  assert.doesNotMatch(commandSource, /Team pulse/);
  assert.doesNotMatch(commandSource, /activeRate/);
  assert.match(commandSource, /<small>Active<\/small>/);
  assert.match(commandSource, /programPulse = null/);
});
