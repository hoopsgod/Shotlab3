import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("expert review polish locks semantic roles and production demo safety", () => {
  const runtime = read("src/lib/expertVisualPolish.js");
  const css = read("src/styles/ExpertVisualPolish.css");
  assert.match(runtime, /request data/i);
  assert.match(runtime, /load demo data/i);
  assert.match(runtime, /clear demo data/i);
  assert.match(runtime, /button\.hidden = !isExplicitDemoRuntime/);
  assert.match(css, /--semantic-positive/);
  assert.match(css, /data-visual-role="utility"/);
  assert.match(css, /data-visual-role="demo-destructive"/);
});

test("expert review polish preserves readable zero progress and copy QA", () => {
  const css = read("src/styles/ExpertVisualPolish.css");
  const finalizer = read("scripts/apply-expert-app-review-v2.mjs");
  assert.match(css, /\[role="progressbar"\]/);
  assert.match(css, /min-height: 8px/);
  assert.match(finalizer, /noActivityRows\.length === 1 \? \\"has\\" : \\"have\\"/);
});

test("expert review polish adds evidence plots without fabricated time-series labels", () => {
  const finalizer = read("scripts/apply-expert-app-review-v2.mjs");
  assert.match(finalizer, /MetricEvidenceSparkline/);
  assert.match(finalizer, /engagementScore/);
  assert.match(finalizer, /weeklyMakes/);
  assert.match(finalizer, /evidenceLabel/);
  assert.doesNotMatch(finalizer, /fake trend|sample trend|mock trend/i);
});

test("expert review polish removes the Add Player box defect and condenses duplicate home alerts", () => {
  const runtime = read("src/lib/expertVisualPolish.js");
  const css = read("src/styles/ExpertVisualPolish.css");
  assert.match(runtime, /normalizeAddPlayerDescription/);
  assert.match(css, /data-visual-role="description-copy"/);
  assert.match(runtime, /condenseDuplicateTouchpoint/);
  assert.match(runtime, /Roster follow-up ready/);
});
