import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const selector = fs.readFileSync("src/lib/playerDailyCommandCenter.js", "utf8");
const component = fs.readFileSync("src/components/PlayerDailyCommandCenter.jsx", "utf8");
const e2e = fs.readFileSync("tests/e2e/player-experience-phase-1.spec.mjs", "utf8");

test("first-result activation is bounded and direct", () => {
  assert.match(selector, /buildFirstResultTask/);
  assert.match(selector, /kind: "first-training"/);
  assert.match(selector, /actionLabel: "Start first result"/);
  assert.match(selector, /firstResultDrill = coachPriorityDrill \|\| incompleteHome\[0\] \|\| incompleteProgram\[0\]/);
  assert.match(selector, /if \(firstResultTask\)/);
  assert.match(selector, /if \(!firstResultPending\)/);
});

test("first-result completion is visible and does not invent persistence", () => {
  assert.match(component, /data-testid="player-first-result-confirmation"/);
  assert.match(component, /First session complete/);
  assert.match(component, /First result banked/);
  for (const token of ["localStorage", "sessionStorage", "supabase", "fetch(", ".insert(", ".update("]) {
    assert.equal(component.includes(token), false, `component must not include ${token}`);
  }
});

test("mobile acceptance covers launch and saved-result confirmation", () => {
  assert.match(e2e, /launches one bounded first result/);
  assert.match(e2e, /logging the first result activates progress and confirms the baseline/);
  assert.match(e2e, /player-first-result-confirmation/);
  assert.match(e2e, /2\/3 complete/);
});