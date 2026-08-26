import test from "node:test";
import assert from "node:assert/strict";
import { deriveCoachProgramPulse } from "../src/lib/coachProgramPulse.js";

const roster = [
  { email: "ava@example.com", name: "Ava" },
  { email: "jordan@example.com", name: "Jordan" },
];

test("Program Pulse uses capped athlete weekly makes over the shared Coach weekly goal", () => {
  const model = deriveCoachProgramPulse({
    roster,
    weeklyGoal: 500,
    weekStart: "2026-08-23",
    shotLogs: [
      { email: "ava@example.com", made: 650, date: "2026-08-24" },
      { email: "jordan@example.com", made: 250, date: "2026-08-25" },
      { email: "jordan@example.com", made: 900, date: "2026-08-16" },
    ],
  });

  assert.equal(model.available, true);
  assert.equal(model.creditedMakes, 750);
  assert.equal(model.totalGoal, 1000);
  assert.equal(model.value, 75);
  assert.equal(model.displayValue, "75%");
  assert.equal(model.athleteProgress[0].percent, 100);
  assert.equal(model.athleteProgress[1].percent, 50);
});

test("Program Pulse reports zero when a valid goal and eligible roster exist but the selected week has no makes", () => {
  const model = deriveCoachProgramPulse({ roster, weeklyGoal: 500, weekStart: "2026-08-23", shotLogs: [] });
  assert.equal(model.available, true);
  assert.equal(model.value, 0);
  assert.equal(model.displayValue, "0%");
  assert.equal(model.totalGoal, 1000);
});

test("Program Pulse never fabricates a percentage without a valid goal, week, or eligible roster", () => {
  for (const input of [
    { roster, weeklyGoal: 0, weekStart: "2026-08-23" },
    { roster, weeklyGoal: 500, weekStart: "" },
    { roster: [], weeklyGoal: 500, weekStart: "2026-08-23" },
  ]) {
    const model = deriveCoachProgramPulse(input);
    assert.equal(model.available, false);
    assert.equal(model.value, null);
    assert.equal(model.displayValue, "—");
    assert.equal(model.detail, "No weekly goal data");
  }
});

test("Program Pulse ignores logs outside the selected week and identities outside the active roster", () => {
  const model = deriveCoachProgramPulse({
    roster,
    weeklyGoal: 400,
    weekStart: "2026-08-23",
    shotLogs: [
      { email: "ava@example.com", made: 100, date: "2026-08-23" },
      { email: "ava@example.com", made: 100, date: "2026-08-29" },
      { email: "ava@example.com", made: 500, date: "2026-08-30" },
      { email: "not-on-roster@example.com", made: 999, date: "2026-08-25" },
    ],
  });

  assert.equal(model.creditedMakes, 200);
  assert.equal(model.totalGoal, 800);
  assert.equal(model.value, 25);
});
