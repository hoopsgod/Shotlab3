import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const selector = fs.readFileSync("src/lib/playerDailyCommandCenter.js", "utf8");
const component = fs.readFileSync("src/components/PlayerDailyCommandCenter.jsx", "utf8");
const decisions = fs.readFileSync("tests/player-daily-command-center.test.mjs", "utf8");
const e2e = fs.readFileSync("tests/e2e/player-experience-phase-1.spec.mjs", "utf8");

test("first-result activation is bounded and historically persistent", () => {
  assert.match(selector, /buildFirstResultTask/);
  assert.match(selector, /id: "first-result:shots"/);
  assert.match(selector, /kind: "first-training"/);
  assert.match(selector, /target: "log-drill"/);
  assert.match(selector, /actionLabel: "Log first result"/);
  assert.match(selector, /recommendedDrill/);
  assert.match(selector, /if \(firstResultTask\)/);
  assert.match(selector, /if \(!firstResultPending\)/);
  assert.match(decisions, /historical shot result keeps activation complete on a later day/);
});

test("first-result completion is visible and does not invent persistence", () => {
  assert.match(component, /data-testid="player-first-result-confirmation"/);
  assert.match(component, /First session complete/);
  assert.match(component, /First result banked/);
  for (const token of ["localStorage", "sessionStorage", "supabase", "fetch(", ".insert(", ".update("]) {
    assert.equal(component.includes(token), false, `component must not include ${token}`);
  }
});

test("mobile acceptance covers saved-result launch and confirmation", () => {
  assert.match(e2e, /launches one bounded first result/);
  assert.match(e2e, /Log first result/);
  assert.match(e2e, /LOG SHOTS/);
  assert.match(e2e, /logging the first result activates progress and confirms the baseline/);
  assert.match(e2e, /player-first-result-confirmation/);
  assert.match(e2e, /2\/3 complete/);
});