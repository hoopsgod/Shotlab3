import test from "node:test";
import assert from "node:assert/strict";
import { deriveShotLabPerformanceVisual } from "../src/lib/shotlabPerformanceVisual.js";

const cases = [
  { value: 0, target: 100, state: "zero", targetPercent: 0, aboveTarget: 0, aria: "100 to target" },
  { value: 25, target: 100, state: "partial", targetPercent: 25, aboveTarget: 0, aria: "75 to target" },
  { value: 85, target: 100, state: "near", targetPercent: 85, aboveTarget: 0, aria: "15 to target" },
  { value: 100, target: 100, state: "complete", targetPercent: 100, aboveTarget: 0, aria: "Target complete" },
  { value: 125, target: 100, state: "above", targetPercent: 100, aboveTarget: 25, overflowPercent: 25, aria: "25 above target" },
];

test("ShotLab Target Court derives deterministic 0/25/85/100/125 states", () => {
  for (const expected of cases) {
    const actual = deriveShotLabPerformanceVisual(expected);
    assert.equal(actual.state, expected.state, `${expected.value}/${expected.target} state`);
    assert.equal(actual.targetPercent, expected.targetPercent, `${expected.value}/${expected.target} target percent`);
    assert.equal(actual.aboveTarget, expected.aboveTarget, `${expected.value}/${expected.target} above target`);
    if (expected.overflowPercent !== undefined) assert.equal(actual.overflowPercent, expected.overflowPercent);
    assert.match(actual.accessibleLabel, new RegExp(expected.aria, "i"));
  }
});

test("above-target performance stays distinct from exact completion", () => {
  const complete = deriveShotLabPerformanceVisual({ value: 100, target: 100 });
  const above = deriveShotLabPerformanceVisual({ value: 125, target: 100 });
  assert.equal(complete.state, "complete");
  assert.equal(complete.overflowPercent, 0);
  assert.equal(above.state, "above");
  assert.equal(above.overflowPercent, 25);
  assert.notEqual(complete.accessibleLabel, above.accessibleLabel);
});

test("the visual adapts to non-100 targets and sanitizes unsafe values", () => {
  const changedTarget = deriveShotLabPerformanceVisual({ value: 75, target: 60 });
  assert.equal(changedTarget.state, "above");
  assert.equal(changedTarget.aboveTarget, 15);
  assert.equal(changedTarget.overflowPercent, 25);

  const untargeted = deriveShotLabPerformanceVisual({ value: 18, target: 0 });
  assert.equal(untargeted.state, "untargeted");
  assert.equal(untargeted.targetPercent, 0);
  assert.match(untargeted.accessibleLabel, /No daily target set/i);

  const invalid = deriveShotLabPerformanceVisual({ value: Number.NaN, target: -10 });
  assert.equal(invalid.made, 0);
  assert.equal(invalid.target, 0);
  assert.equal(invalid.state, "untargeted");
});
