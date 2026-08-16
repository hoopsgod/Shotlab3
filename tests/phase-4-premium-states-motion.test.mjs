import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared state panel covers loading offline completion and recovery states", async () => {
  const source = await read("src/components/ShotLabStatePanel.jsx");
  assert.match(source, /completion: \{ eyebrow: "Session complete"/);
  assert.match(source, /offline: \{ eyebrow: "Working offline"/);
  assert.match(source, /state === "completion"/);
  assert.match(source, /className=\{styles\.loadingTrack\}/);
  assert.match(source, /aria-busy=\{busy \|\| undefined\}/);
});

test("state motion is restrained and collapses under reduced-motion preference", async () => {
  const css = await read("src/components/ShotLabStatePanel.module.css");
  assert.match(css, /@keyframes stateTrackSweep/);
  assert.match(css, /@keyframes stateCompleteIn/);
  assert.match(css, /\.offline\{--state-accent:/);
  assert.match(css, /touch-action:manipulation/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css, /confetti|bounce/);
});

test("release boundary routes connectivity through the single premium feedback layer", async () => {
  const source = await read("src/components/ReleaseReadinessBoundary.jsx");
  assert.match(source, /import AppFeedbackLayer, \{ announceFeedback, clearFeedback \}/);
  assert.match(source, /CONNECTIVITY_FEEDBACK_KEY = "release-connectivity"/);
  assert.match(source, /title: "Working offline"/);
  assert.match(source, /title: "Checking team sync"/);
  assert.match(source, /title: status === "synced" \? "Team sync complete" : "Sync needs attention"/);
  assert.match(source, /clearFeedback\(CONNECTIVITY_FEEDBACK_KEY\)/);
  assert.match(source, /<AppFeedbackLayer \/>/);
  assert.doesNotMatch(source, /data-testid="release-connectivity-status"/);
});

test("shared metrics acknowledge changed values without animated counting", async () => {
  const source = await read("src/components/VisualHierarchy.jsx");
  const css = await read("src/components/VisualHierarchy.module.css");
  assert.match(source, /function MetricValue/);
  assert.match(source, /data-metric-change=\{changeKey\}/);
  assert.match(source, /Object\.is\(previousRef\.current, displayValue\)/);
  assert.match(css, /@keyframes metricValueSettle/);
  assert.match(css, /animation: metricValueSettle 200ms/);
  assert.doesNotMatch(source, /setInterval|requestAnimationFrame/);
});

test("premium completion cue motion stays bounded while navigation motion remains component-owned", async () => {
  const motion = await read("src/styles/PremiumMotion2026.css");
  const nav = await read("src/components/MobileNavigation.module.css");
  assert.match(motion, /shotlab-completion-cue-enter 220ms/);
  assert.match(motion, /player-training-session \.particle/);
  assert.match(motion, /display: none !important/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(nav, /navOverlayIn 140ms/);
  assert.match(nav, /navSheetIn 190ms/);
  assert.match(nav, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(motion, /bounce|spin|pulse.*infinite/i);
});

test("training completion emphasizes the saved result and Target Court without ambient panel animation", async () => {
  const source = await read("src/components/PlayerTrainingCompletion.jsx");
  const css = await read("src/components/PlayerTrainingCompletion.module.css");
  const courtCss = await read("src/components/PlayerDailyPrimitives.module.css");
  assert.match(source, /player-training-target-court/);
  assert.match(source, /ShotLabPerformanceCourt/);
  assert.doesNotMatch(css, /completionPanelSettle|completionMarkSettle|completionScoreSettle|completionTrackSettle/);
  assert.match(css, /\.primaryAction:active\s*\{\s*transform:\s*scale\(\.985\)/);
  assert.match(css, /\.primaryAction\s*\{[\s\S]*?min-height:\s*50px/);
  assert.match(courtCss, /transition:\s*opacity\s+220ms\s+ease/);
  assert.match(css, /touch-action:\s*manipulation/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.primaryAction:active,[\s\S]*?transform:\s*none/);
  assert.match(courtCss, /transition:\s*none\s*!important/);
  assert.doesNotMatch(css, /confetti|bounce|infinite/i);
});
