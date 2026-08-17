import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { deriveShotLabPerformanceVisual } from "../src/lib/shotlabPerformanceVisual.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const expectState = ({ value, state, targetPercent, aboveTarget = 0 }) => {
  const visual = deriveShotLabPerformanceVisual({ value, target: 100 });
  assert.equal(visual.state, state);
  assert.equal(visual.targetPercent, targetPercent);
  assert.equal(visual.aboveTarget, aboveTarget);
  assert.equal(Number.isFinite(visual.targetPercent), true);
  assert.equal(Number.isFinite(visual.aboveTarget), true);
  return visual;
};

test("Target Court preserves distinct zero, partial, near, locked, and above-target states", () => {
  expectState({ value: 0, state: "zero", targetPercent: 0 });
  expectState({ value: 25, state: "partial", targetPercent: 25 });
  expectState({ value: 85, state: "near", targetPercent: 85 });

  const locked = expectState({ value: 100, state: "complete", targetPercent: 100 });
  assert.match(locked.accessibleLabel, /Target locked\./);

  const above = expectState({ value: 125, state: "above", targetPercent: 100, aboveTarget: 25 });
  assert.equal(above.overflowPercent, 25);
  assert.match(above.accessibleLabel, /25 above target\./);
});

test("Target Court normalizes invalid and negative values without fabricating progress", () => {
  for (const value of [Number.NaN, Number.NEGATIVE_INFINITY, -25, undefined]) {
    const visual = deriveShotLabPerformanceVisual({ value, target: 100 });
    assert.equal(visual.made, 0);
    assert.equal(visual.state, "zero");
    assert.equal(visual.targetPercent, 0);
    assert.equal(visual.aboveTarget, 0);
  }
});

test("Phase 5 mobile touch geometry keeps the accessibility floor as a minimum, not an exact implementation", async () => {
  const css = await read("src/styles/Phase5Precision.css");
  const floor = Number(css.match(/--phase5-touch-floor:\s*(\d+)px/)?.[1]);
  const primary = Number(css.match(/--phase5-touch-primary:\s*(\d+)px/)?.[1]);

  assert.ok(Number.isFinite(floor) && floor >= 44, `touch floor must be at least 44px, got ${floor}`);
  assert.ok(Number.isFinite(primary) && primary >= 46, `primary touch target should be at least 46px, got ${primary}`);
  assert.match(css, /player-training-score-zone input\[type="number"\][\s\S]*appearance:\s*textfield/);
  assert.match(css, /player-training-log-score[\s\S]*min-height:\s*52px/);
});

test("Phase 5 feedback and reduced-motion contracts respect mobile navigation and safe areas", async () => {
  const [precisionCss, feedbackCss] = await Promise.all([
    read("src/styles/Phase5Precision.css"),
    read("src/components/AppFeedbackLayer.css"),
  ]);

  assert.match(precisionCss, /player-completion-cue[\s\S]*bottom:\s*calc\(var\(--phase5-nav-clearance\)/);
  assert.match(precisionCss, /env\(safe-area-inset-bottom/);
  assert.match(precisionCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(feedbackCss, /bottom:\s*calc\(var\(--bottom-nav-content-padding, 82px\)/);
  assert.match(feedbackCss, /safe-area-inset-(left|right)/);
});

test("Phase 5 precision CSS loads after the certified surface layers", async () => {
  const main = await read("src/main.jsx");
  const phase3 = main.indexOf("Phase3SurfaceContracts.css");
  const phase5 = main.indexOf("Phase5Precision.css");
  assert.ok(phase3 >= 0 && phase5 > phase3, "Phase 5 precision layer must load after Phase 3 surface contracts");
});

test("Target Court visual and spoken locked terminology stay aligned", async () => {
  const primitives = await read("src/components/PlayerDailyPrimitives.jsx");
  assert.match(primitives, /visual\.state === "complete"[\s\S]*Target locked\./);
  assert.doesNotMatch(primitives, /Target complete\./);
});
