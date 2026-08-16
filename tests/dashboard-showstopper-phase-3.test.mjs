import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const progress = read("src/components/PlayerProgressStory.jsx");
const progressCss = read("src/components/PlayerProgressStory.module.css");
const completion = read("src/components/PlayerTrainingCompletion.jsx");
const completionCss = read("src/components/PlayerTrainingCompletion.module.css");
const primitives = read("src/components/PlayerDailyPrimitives.jsx");

test("Progress extends the proprietary Target Court with real daily shooting semantics", () => {
  assert.match(progress, /PLAYER_DAILY_SHOT_TARGET/);
  assert.match(progress, /ShotLabPerformanceCourt/);
  assert.match(progress, /player-progress-target-court/);
  assert.match(progress, /player-progress-target-visual/);
  assert.match(progress, /max=\{PLAYER_DAILY_SHOT_TARGET\}/);
  assert.match(progress, /todayMakes/);
  assert.doesNotMatch(progress, /TrendSparkline/);
  assert.doesNotMatch(progressCss, /sparkline/i);
});

test("post-session completion uses Target Court instead of a generic percentage bar", () => {
  assert.match(completion, /ShotLabPerformanceCourt/);
  assert.match(completion, /player-training-target-court/);
  assert.match(completion, /player-training-target-visual/);
  assert.match(completion, /max=\{max\}/);
  assert.match(completion, /DRILL TARGET/);
  assert.doesNotMatch(completion, /Math\.min\(100/);
  assert.doesNotMatch(completionCss, /performanceTrack|performanceFill|revealProgress/);
});

test("Target Court remains the single accessible state engine for every contextual target", () => {
  assert.match(primitives, /export function ShotLabPerformanceCourt\(\{ value = 0, max = 100/);
  assert.match(primitives, /deriveShotLabPerformanceVisual\(\{ value, target: max \}\)/);
  assert.match(primitives, /aria-label=\{visual\.accessibleLabel\}/);
  assert.match(primitives, /data-performance-visual="shotlab-target-court"/);
  assert.match(primitives, /visual\.state === "above"/);
  assert.match(primitives, /visual\.state === "complete"/);
  assert.doesNotMatch(progress, /deriveShotLabPerformanceVisual/);
  assert.doesNotMatch(completion, /deriveShotLabPerformanceVisual/);
});

test("Phase 3 keeps the visual language restrained instead of adding a second chart system", () => {
  assert.doesNotMatch(progress, /canvas|three|chart\.js|recharts|d3/i);
  assert.doesNotMatch(completion, /canvas|three|chart\.js|recharts|d3/i);
  assert.match(progressCss, /targetPanel/);
  assert.match(completionCss, /targetCourtEvidence/);
});
