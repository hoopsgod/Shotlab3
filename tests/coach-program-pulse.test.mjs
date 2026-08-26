import test from "node:test";
import assert from "node:assert/strict";
import { buildCoachPlayerDashboardMetrics, buildCoachPlayerDashboardRows } from "../src/lib/coachOperationalDashboard.js";

const roster = [
  { email: "ava@example.com", name: "Ava" },
  { email: "jordan@example.com", name: "Jordan" },
];
const rowsFor = (shotLogs = [], players = roster) => buildCoachPlayerDashboardRows({ players, shotLogs, weekStart: "2026-08-23" });
const pulseFor = (shotLogs = [], weeklyGoal = 500, players = roster) => buildCoachPlayerDashboardMetrics(rowsFor(shotLogs, players), weeklyGoal).programPulse.value;

test("Program Pulse caps every athlete at the shared Coach weekly goal", () => {
  assert.equal(pulseFor([
    { email: "ava@example.com", made: 650, date: "2026-08-24" },
    { email: "jordan@example.com", made: 250, date: "2026-08-25" },
  ]), 75);
});

test("one over-goal athlete cannot compensate beyond that athlete's capped 100 percent", () => {
  assert.equal(pulseFor([
    { email: "ava@example.com", made: 900, date: "2026-08-24" },
    { email: "jordan@example.com", made: 100, date: "2026-08-25" },
  ]), 60);
});

test("valid weekly goal with zero weekly makes produces zero percent", () => assert.equal(pulseFor([], 500), 0));

test("missing, zero, negative, or rosterless weekly goals are unavailable", () => {
  assert.deepEqual([
    buildCoachPlayerDashboardMetrics(rowsFor(), undefined).programPulse.value,
    pulseFor([], 0), pulseFor([], -25), pulseFor([], 500, []),
  ], [null, null, null, null]);
});

test("out-of-week activity does not inflate Program Pulse", () => {
  assert.equal(pulseFor([
    { email: "ava@example.com", made: 100, date: "2026-08-23" },
    { email: "ava@example.com", made: 500, date: "2026-08-16" },
  ], 400), 13);
});

test("non-roster activity does not inflate Program Pulse", () => {
  assert.equal(pulseFor([
    { email: "ava@example.com", made: 100, date: "2026-08-23" },
    { email: "not-on-roster@example.com", made: 999, date: "2026-08-25" },
  ], 400), 13);
});

test("Coach identity never counts as an eligible Program Pulse athlete", () => {
  const players = [...roster, { email: "coach@example.com", name: "Coach", role: "coach", isCoach: true }];
  const rows = rowsFor([
    { email: "ava@example.com", made: 100, date: "2026-08-23" },
    { email: "coach@example.com", made: 999, date: "2026-08-25" },
  ], players);
  assert.equal(rows.length, 2);
  assert.equal(buildCoachPlayerDashboardMetrics(rows, 400).programPulse.value, 13);
});
