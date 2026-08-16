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
  assert.match(progress, /target=\{PLAYER_DAILY_SHOT_TARGET\}/);
  assert.match(progress, /todayMakes/);
  assert.doesNotMatch(progress, /TrendSparkline/);
  assert.doesNotMatch(progressCss, /sparkline/i);
});

test("post-session completion uses Target Court instead of a generic percentage bar", () => {
  assert.match(completion, /ShotLabPerformanceCourt/);
  assert.match(completion, /player-training-target-court/);
  assert.match(completion, /player-training-target-visual/);
  assert.match(completion, /target=\{max\}/);
  assert.match(completion, /Drill target locked/);
  assert.match(completion, /beyond drill target/);
  assert.match(completion, /ariaLabel=/);
  assert.doesNotMatch(completion, /Math\.min\(100/);
  assert.doesNotMatch(completionCss, /performanceTrack|performanceFill|revealProgress/);
});

test("Target Court primitive supports contextual targets and accessible labels without duplicating state logic", () => {
  assert.match(primitives, /target, max = 100/);
  assert.match(primitives, /const resolvedTarget = target \?\? max/);
  assert.match(primitives, /deriveShotLabPerformanceVisual\(\{ value, target: resolvedTarget \}\)/);
  assert.match(primitives, /ariaLabel \|\| visual\.accessibleLabel/);
  assert.match(primitives, /data-performance-visual="shotlab-target-court"/);
});

test("Phase 3 keeps the visual language restrained instead of adding a second chart system", () => {
  assert.doesNotMatch(progress, /canvas|three|chart\.js|recharts|d3/i);
  assert.doesNotMatch(completion, /canvas|three|chart\.js|recharts|d3/i);
  assert.match(progressCss, /targetPanel/);
  assert.match(completionCss, /targetCourtEvidence/);
});