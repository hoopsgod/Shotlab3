import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Phase 5B keeps the production JavaScript budget unchanged", async () => {
  const budget = JSON.parse(await read("performance-budget.json"));
  assert.equal(budget.maxTotalJavaScriptGzipBytes, 365000);
});

test("Phase 5B derives practice readiness from observed roster RSVP states", async () => {
  const dashboard = await read("src/lib/coachOperationalDashboard.js");
  assert.match(dashboard, /row\?\.attended === true/);
  assert.match(dashboard, /const unavailable = Math\.max\(responded - attending, 0\)/);
  assert.match(dashboard, /const awaitingResponse = Math\.max\(rosterCount - responded, 0\)/);
  assert.match(dashboard, /rosterIdentities\.has\(identity\)/);
  assert.match(dashboard, /latestByPlayer/);
  assert.doesNotMatch(dashboard, /readinessScore|predictedReadiness|healthScore/);
});

test("Phase 5B keeps response rate separate from attendance availability", async () => {
  const dashboard = await read("src/lib/coachOperationalDashboard.js");
  const briefing = await read("src/lib/coachActionBriefings.js");
  assert.match(dashboard, /responseRate = rosterCount > 0 \? Math\.round\(\(responded \/ rosterCount\) \* 100\)/);
  assert.match(dashboard, /availabilityRate = rosterCount > 0 \? Math\.round\(\(attending \/ rosterCount\) \* 100\)/);
  assert.match(briefing, /observed roster status, not a predicted readiness score/);
  assert.match(briefing, /attending · .*unavailable · .*awaiting response/);
});

test("Phase 5B presentation uses attendance language instead of confirmation conflation", async () => {
  const patch = await read("scripts/apply-phase5b-practice-readiness.mjs");
  const phase5a = await read("scripts/apply-phase5a-coach-daily-intelligence.mjs");
  assert.match(patch, /Awaiting RSVP/);
  assert.match(patch, /Next-session availability/);
  assert.match(patch, /briefing\.responded/);
  assert.match(patch, /briefing\.attending/);
  assert.match(patch, /rejected response\/attendance conflation/);
  assert.match(phase5a, /apply-phase5b-practice-readiness\.mjs/);
});

test("Phase 5B preserves the accepted Phase 5A.1 performance asset strategy", async () => {
  const phase5a = await read("scripts/apply-phase5a-coach-daily-intelligence.mjs");
  const externalizer = await read("scripts/externalize-shotlab-brand-logo.mjs");
  assert.match(phase5a, /externalize-shotlab-brand-logo\.mjs/);
  assert.match(externalizer, /shotlab-brand-logo\.png/);
});
