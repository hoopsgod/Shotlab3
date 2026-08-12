import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Phase 4 navigation motion stays restrained and honors reduced-motion preferences", async () => {
  const css = await read("src/components/MobileNavigation.module.css");
  assert.match(css, /animation:\s*navOverlayIn\s+150ms/);
  assert.match(css, /animation:\s*navSheetIn\s+220ms/);
  assert.match(css, /@keyframes navOverlayIn/);
  assert.match(css, /@keyframes navSheetIn/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.overlay,\s*\n\s*\.sheet,/);
  assert.doesNotMatch(css, /animation:[^;]*(?:900|[1-9]\d{3,})ms/);
});

test("Phase 4 live metrics communicate change without decorative motion", async () => {
  const source = await read("src/components/VisualHierarchy.jsx");
  const css = await read("src/components/VisualHierarchy.module.css");
  assert.match(source, /previousRef = useRef\(displayValue\)/);
  assert.match(source, /data-metric-change=\{changeKey\}/);
  assert.match(css, /animation:\s*metricValueSettle\s+220ms/);
  assert.match(css, /@keyframes metricValueSettle/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.metricValue \{ animation: none; \}/);
});

test("Phase 4 drill completion uses a bounded result transition with reduced-motion fallback", async () => {
  const source = await read("src/components/PlayerTrainingCompletion.jsx");
  const css = await read("src/components/PlayerTrainingCompletion.module.css");
  assert.match(source, /data-testid="player-training-completion"/);
  assert.match(source, /DRILL COMPLETE/);
  assert.match(source, /PERSONAL BEST/);
  assert.match(css, /completionPanelSettle\s+240ms/);
  assert.match(css, /completionMarkSettle\s+260ms/);
  assert.match(css, /completionScoreSettle\s+220ms/);
  assert.match(css, /completionTrackSettle\s+340ms/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation: none !important/);
});

test("Phase 4 player commitment actions provide bounded completion feedback", async () => {
  const app = await read("src/App.jsx");
  assert.match(app, /const pushCompletionCue=useCallback/);
  assert.match(app, /setTimeout\(\(\)=>setCompletionCue\(null\),3200\)/);
  assert.match(app, /data-testid="player-completion-cue"/);
  assert.match(app, /Event participation confirmed/);
  assert.match(app, /S&C activity logged/);
  assert.match(app, /onCompletionCue=\{pushCompletionCue\}/);
});

test("Phase 4 global feedback owns offline, sync, success, warning, and error presentation", async () => {
  const feedback = await read("src/components/AppFeedbackLayer.jsx");
  const boundary = await read("src/components/ReleaseReadinessBoundary.jsx");
  const states = await read("src/components/ShotLabStatePanel.jsx");
  assert.match(feedback, /\["success", "error", "info", "warning"\]/);
  assert.match(feedback, /export function clearFeedback/);
  assert.match(feedback, /persistent/);
  assert.match(boundary, /title: "Working offline"/);
  assert.match(boundary, /title: "Checking team sync"/);
  assert.match(boundary, /"Team sync complete"/);
  assert.match(boundary, /"Sync needs attention"/);
  assert.match(states, /completion:/);
  assert.match(states, /offline:/);
});
