import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { deriveShotLabPerformanceVisual } from "../src/lib/shotlabPerformanceVisual.js";
import { validateProgramDrillScore } from "../src/lib/programDrillScoring.js";

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

test("bounded training score validation handles empty, zero, digit ranges, max, and invalid overflow", () => {
  const standard = { max: 125 };
  const zeroAllowed = { max: 125, allowZeroScore: true };

  assert.deepEqual(validateProgramDrillScore("", standard), { ok: false, error: "Score is required." });
  assert.deepEqual(validateProgramDrillScore("0", standard), { ok: false, error: "Score must be greater than 0." });
  assert.deepEqual(validateProgramDrillScore("0", zeroAllowed), { ok: true, score: 0 });

  for (const value of ["7", "42", "125"]) {
    const result = validateProgramDrillScore(value, standard);
    assert.equal(result.ok, true);
    assert.equal(result.score, Number(value));
  }

  assert.deepEqual(validateProgramDrillScore("126", standard), { ok: false, error: "Score cannot exceed 125." });
  assert.deepEqual(validateProgramDrillScore("-1", standard), { ok: false, error: "Score cannot be negative." });
  assert.equal(validateProgramDrillScore("not-a-number", standard).ok, false);
});

test("Phase 5 mobile touch geometry validates minimums through existing product owners", async () => {
  const [surfaceCss, polishCss] = await Promise.all([
    read("src/styles/Phase3SurfaceContracts.css"),
    read("src/styles/ExpertVisualPolish.css"),
  ]);
  const floor = Number(surfaceCss.match(/--sl-phase3-touch-target:\s*(\d+)px/)?.[1]);
  const logScoreMin = Number(polishCss.match(/\[data-testid="player-training-log-score"\][\s\S]*?min-height:\s*(\d+)px/)?.[1]);
  const pageHeaderMin = Number(polishCss.match(/\.pageHeaderPill\s*\{\s*min-height:\s*(\d+)px/)?.[1]);

  assert.ok(Number.isFinite(floor) && floor >= 44, `touch floor must be at least 44px, got ${floor}`);
  assert.ok(Number.isFinite(logScoreMin) && logScoreMin >= 46, `score logging action should be comfortably thumb-sized, got ${logScoreMin}px`);
  assert.ok(Number.isFinite(pageHeaderMin) && pageHeaderMin >= 44, `page header action must remain touch-safe, got ${pageHeaderMin}px`);
  assert.match(polishCss, /player-training-score-zone input\[type="number"\][\s\S]*appearance:\s*textfield/);
  assert.match(polishCss, /player-training-score-zone input\[type="number"\]:focus-visible/);
});

test("Phase 5 feedback and reduced-motion contracts respect mobile navigation and safe areas", async () => {
  const [motionCss, feedbackCss] = await Promise.all([
    read("src/styles/PremiumMotion2026.css"),
    read("src/components/AppFeedbackLayer.css"),
  ]);

  assert.match(motionCss, /player-completion-cue[\s\S]*bottom:\s*calc\(var\(--bottom-nav-content-padding, 82px\)/);
  assert.match(motionCss, /env\(safe-area-inset-bottom/);
  assert.match(motionCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(feedbackCss, /bottom:\s*calc\(var\(--bottom-nav-content-padding, 82px\)/);
  assert.match(feedbackCss, /safe-area-inset-(left|right)/);
});

test("Phase 5 precision remains inside certified visual owners instead of adding a new cascade authority", async () => {
  const main = await read("src/main.jsx");
  assert.match(main, /ExpertVisualPolish\.css/);
  assert.match(main, /Phase3SurfaceContracts\.css/);
  assert.doesNotMatch(main, /Phase5Precision\.css/);
});

test("Target Court visual and spoken locked terminology stay aligned", async () => {
  const primitives = await read("src/components/PlayerDailyPrimitives.jsx");
  assert.match(primitives, /visual\.state === "complete"[\s\S]*Target locked\./);
  assert.doesNotMatch(primitives, /Target complete\./);
});
