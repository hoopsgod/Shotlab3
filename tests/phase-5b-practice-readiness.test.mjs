import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Phase 5B keeps the production JavaScript budget unchanged", async () => {
  const budget = JSON.parse(await read("performance-budget.json"));
  assert.equal(budget.maxTotalJavaScriptGzipBytes, 365000);
});

test("Phase 5B derives upcoming practice readiness from roster-scoped RSVP coverage", async () => {
  const dashboard = await read("src/lib/coachOperationalDashboard.js");
  assert.match(dashboard, /const awaitingResponse = Math\.max\(rosterCount - responded, 0\)/);
  assert.match(dashboard, /responseRate = rosterCount > 0 \? Math\.round\(\(responded \/ rosterCount\) \* 100\)/);
  assert.match(dashboard, /rosterIdentities\.has\(identity\)/);
  assert.match(dashboard, /latestByPlayer/);
  assert.match(dashboard, /attendanceRecorded = responses\.filter\(\(row\) => row\?\.attended === true\)\.length/);
  assert.doesNotMatch(dashboard, /availabilityRate|unavailable = Math\.max\(responded - attending/);
  assert.doesNotMatch(dashboard, /readinessScore|predictedReadiness|healthScore/);
});

test("Phase 5B explicitly refuses to infer future attendance from the separate attendance field", async () => {
  const briefing = await read("src/lib/coachActionBriefings.js");
  const intelligence = await read("src/lib/coachOperationalIntelligence.js");
  assert.match(briefing, /ShotLab does not infer future attendance from the separate attendance field/);
  assert.match(briefing, /Next-session RSVP coverage/);
  assert.match(intelligence, /rsvpResponded: upcomingRsvps\.length/);
  assert.match(intelligence, /attendanceRecorded/);
  assert.doesNotMatch(briefing, /unavailable/);
});

test("Phase 5B presentation uses RSVP coverage rather than future-attendance claims", async () => {
  const patch = await read("scripts/apply-phase5b-practice-readiness.mjs");
  const phase5a = await read("scripts/apply-phase5a-coach-daily-intelligence.mjs");
  assert.match(patch, /Awaiting RSVP/);
  assert.match(patch, /Next-session RSVP coverage/);
  assert.match(patch, /briefing\.responded/);
  assert.match(patch, /RSVP'd/);
  assert.match(patch, /next\.includes\("briefing\.attending"\)/);
  assert.match(patch, /next\.includes\("model\.unavailable"\)/);
  assert.match(patch, /rejected RSVP\/attendance conflation/);
  assert.match(patch, /rejected future-attendance inference/);
  assert.match(phase5a, /apply-phase5b-practice-readiness\.mjs/);
});

test("Phase 5B preserves the accepted Phase 5A.1 performance asset strategy", async () => {
  const phase5a = await read("scripts/apply-phase5a-coach-daily-intelligence.mjs");
  const externalizer = await read("scripts/externalize-shotlab-brand-logo.mjs");
  assert.match(phase5a, /externalize-shotlab-brand-logo\.mjs/);
  assert.match(externalizer, /shotlab-brand-logo\.png/);
});
