import test from "node:test";
import assert from "node:assert/strict";
import { buildCoachPlayerDashboardRows, buildCoachProgramPulse } from "../src/lib/coachOperationalDashboard.js";

const roster = [
  { email: "ava@example.com", name: "Ava" },
  { email: "jordan@example.com", name: "Jordan" },
];
const rowsFor = (shotLogs = []) => buildCoachPlayerDashboardRows({ players: roster, shotLogs, weekStart: "2026-08-23" });

test("Program Pulse caps each athlete at the shared Coach weekly goal", () => {
  const model = buildCoachProgramPulse(rowsFor([
    { email: "ava@example.com", made: 650, date: "2026-08-24" },
    { email: "jordan@example.com", made: 250, date: "2026-08-25" },
    { email: "jordan@example.com", made: 900, date: "2026-08-16" },
  ]), 500);
  assert.deepEqual({ credited: model.creditedMakes, goal: model.totalGoal, value: model.value, display: model.displayValue }, { credited: 750, goal: 1000, value: 75, display: "75%" });
});

test("Program Pulse reports zero when valid goals exist but the week has no makes", () => {
  const model = buildCoachProgramPulse(rowsFor(), 500);
  assert.equal(model.available, true);
  assert.equal(model.value, 0);
  assert.equal(model.totalGoal, 1000);
});

test("Program Pulse never fabricates a percentage without a valid denominator", () => {
  for (const model of [buildCoachProgramPulse(rowsFor(), 0), buildCoachProgramPulse([], 500)]) {
    assert.equal(model.available, false);
    assert.equal(model.value, null);
    assert.equal(model.displayValue, "—");
    assert.equal(model.detail, "No weekly goal data");
  }
});

test("Program Pulse inherits roster identity and selected-week filtering from Coach player rows", () => {
  const rows = rowsFor([
    { email: "ava@example.com", made: 100, date: "2026-08-23" },
    { email: "ava@example.com", made: 500, date: "2026-08-16" },
    { email: "not-on-roster@example.com", made: 999, date: "2026-08-25" },
  ]);
  const model = buildCoachProgramPulse(rows, 400);
  assert.equal(rows[0].weeklyMakes + rows[1].weeklyMakes, 100);
  assert.equal(model.creditedMakes, 100);
  assert.equal(model.totalGoal, 800);
  assert.equal(model.value, 13);
});
