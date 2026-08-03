import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/components/CoachInteractiveDashboards.jsx", "utf8");

test("drills, strength, and leaderboards use the canonical operational page model", () => {
  for (const id of [
    "coach-page-dashboard-drills",
    "coach-page-dashboard-strength",
    "coach-page-dashboard-leaderboards",
  ]) {
    assert.match(source, new RegExp(`"${id}"`));
    assert.match(source, new RegExp(`\\$\\{testId\\}-decision-brief`));
    assert.match(source, new RegExp(`\\$\\{testId\\}-evidence`));
  }
  assert.match(source, /buildOperationalPageModel/);
  assert.match(source, /SecondaryPageDecision/);
  assert.match(source, /SecondaryPageEvidence/);
});

test("operational pages preserve metric selection and primary actions", () => {
  assert.match(source, /onMetricSelect\(model\.primary\.key\)/);
  assert.match(source, /onMetricSelect\(metric\.key\)/);
  assert.match(source, /actions=\{actions\}/);
  assert.match(source, /InteractiveMetricStrip/);
});

test("remaining page migration stays presentational and avoids data writes", () => {
  assert.doesNotMatch(source, /supabase|fetch\(|XMLHttpRequest|create table|alter table/i);
  assert.match(source, /Use this signal as supporting context/);
  assert.match(source, /coach's decision/);
});
