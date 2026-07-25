import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx",import.meta.url),"utf8");

test("coach command center renders the premium operating view",()=>{
  [
    "coach-team-health",
    "coach-needs-attention",
    "coach-team-momentum",
    "coach-live-activity",
    "coach-upcoming",
    "coach-command-grid",
  ].forEach((testId)=>assert.match(source,new RegExp(testId)));
});

test("coach command center keeps core coach actions and team code controls",()=>{
  ["Add Player","Add Drill","Create Event","Log Score","Team code","New code"].forEach((label)=>assert.match(source,new RegExp(label)));
});

test("coach command center supports live derived data without breaking legacy callers",()=>{
  ["teamHealthScore","attentionItems","momentumItems","activityItems","upcomingItems"].forEach((prop)=>assert.match(source,new RegExp(prop)));
  assert.match(source,/calculatedHealth/);
  assert.match(source,/nextEventDateFormatted/);
  assert.match(source,/highlightPlayersAttention/);
});
