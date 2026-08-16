import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const header = read("src/components/PlayerTrainingSessionHeader.jsx");
const headerCss = read("src/components/PlayerTrainingSessionHeader.module.css");
const completion = read("src/components/PlayerTrainingCompletion.jsx");
const completionCss = read("src/components/PlayerTrainingCompletion.module.css");
const closeout = read("src/components/PlayerSessionCloseout.jsx");
const closeoutCss = read("src/components/PlayerSessionCloseout.module.css");
const home = read("src/components/PlayerDailyCommandCenter.jsx");
const progress = read("src/components/PlayerProgressStory.jsx");
const court = read("src/components/PlayerDailyPrimitives.jsx");
const visual = read("src/lib/shotlabPerformanceVisual.js");
const budget = JSON.parse(read("performance-budget.json"));
const pkg = JSON.parse(read("package.json"));

test("Phase 4 keeps the proprietary Target Court as the shared Player performance language", () => {
  assert.match(home, /ShotLabPerformanceCourt/);
  assert.match(progress, /ShotLabPerformanceCourt/);
  assert.match(header, /ShotLabPerformanceCourt/);
  assert.match(completion, /ShotLabPerformanceCourt/);
  assert.match(closeout, /ShotLabPerformanceCourt/);
  assert.match(header, /data-performance-language="shotlab-target-court"/);
  assert.match(completion, /data-performance-language="shotlab-target-court"/);
  assert.match(closeout, /data-performance-language="shotlab-target-court"/);
  assert.match(court, /data-performance-visual="shotlab-target-court"/);
  assert.match(court, /data-performance-layer="above-target-value"/);
  assert.match(court, /data-performance-layer="target-lock"/);
});

test("Target Court semantics distinguish daily makes from drill result context", () => {
  assert.match(court, /contextLabel = ""/);
  assert.match(court, /contextualCourtLabel/);
  assert.match(header, /contextLabel="on this drill"/);
  assert.match(completion, /contextLabel="on this drill"/);
  assert.match(closeout, /contextLabel="on this drill"/);
  assert.match(court, /role="img"/);
  assert.match(court, /aria-label=\{visual\.accessibleLabel\}/);
});

test("live training removes generic progress bars and carries deterministic target state", () => {
  assert.match(header, /deriveShotLabPerformanceVisual/);
  assert.match(header, /player-training-live-target/);
  assert.match(header, /TARGET LOCKED/);
  assert.match(header, /BANKED/);
  assert.doesNotMatch(header, /styles\.progressTrack/);
  assert.doesNotMatch(header, /styles\.scoreProgress/);
  assert.doesNotMatch(headerCss, /\.progressTrack/);
  assert.doesNotMatch(headerCss, /\.scoreProgress/);
  assert.match(headerCss, /\.back\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/);
});

test("completion answers result, meaning, and next action without generic success UI", () => {
  assert.match(completion, /RESULT LOGGED/);
  assert.match(completion, /WHAT CHANGED/);
  assert.match(completion, /DRILL TARGET/);
  assert.match(completion, /TARGET COURT/);
  assert.match(completion, /player-training-target-interpretation/);
  assert.match(completion, /NEXT MOVE/);
  assert.match(completion, /player-training-next-action/);
  assert.match(completion, /player-training-finish-session/);
  assert.doesNotMatch(completion, /m5 12 4 4L19 6/i);
  assert.match(completionCss, /\.finishSession\s*\{[\s\S]*?min-height:\s*44px;/);
  assert.match(completionCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test("session closeout is editorial performance proof rather than a tile dashboard", () => {
  assert.match(closeout, /SESSION COMPLETE/);
  assert.match(closeout, /PERFORMANCE PROOF/);
  assert.match(closeout, /NEXT COMMITMENT/);
  assert.match(closeout, /player-session-closeout-target-visual/);
  assert.match(closeout, /proofRail/);
  assert.doesNotMatch(closeout, /planProgress/);
  assert.doesNotMatch(closeoutCss, /\.planProgress/);
  assert.doesNotMatch(closeoutCss, /\.metrics\s*>\s*div/);
  assert.match(closeoutCss, /\.primary\s*\{[\s\S]*?min-height:\s*50px;/);
  assert.match(closeoutCss, /\.actions button\s*\{[\s\S]*?min-height:\s*44px;/);
});

test("0 25 85 100 and 125 retain deterministic and distinct target meaning", () => {
  assert.match(visual, /state:\s*"zero"/);
  assert.match(visual, /state:\s*"partial"/);
  assert.match(visual, /state:\s*"near"/);
  assert.match(visual, /state:\s*"complete"/);
  assert.match(visual, /state:\s*"above"/);
  assert.match(visual, /aboveTarget/);
  assert.match(court, /\+\$\{Math\.round\(visual\.aboveTarget\)\} banked/);
});

test("Phase 4 does not raise production bundle budgets or add UI libraries", () => {
  assert.equal(budget.maxTotalCssGzipBytes, 88000);
  assert.equal(budget.maxTotalJavaScriptGzipBytes, 365000);
  assert.equal(pkg.dependencies["framer-motion"], undefined);
  assert.equal(pkg.dependencies["chart.js"], undefined);
  assert.equal(pkg.dependencies["@fortawesome/react-fontawesome"], undefined);
  assert.equal(pkg.dependencies["lucide-react"], undefined);
});
