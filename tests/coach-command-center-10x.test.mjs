import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../src/components/CoachCommandCenter.css",import.meta.url),"utf8");

test("coach command center renders one focused daily brief",()=>{
  assert.match(source,/Today’s coaching brief/);
  assert.match(source,/coach-primary-objective/);
  assert.match(source,/coach-primary-metrics/);
  assert.doesNotMatch(source,/Team health/);
  assert.doesNotMatch(source,/coach-command-grid/);
});

test("coach command center keeps core coach actions behind progressive tools",()=>{
  ["Add Player","Add Drill","Create Event","Log Score","Team code","New code"].forEach((label)=>assert.match(source,new RegExp(label)));
  assert.match(source,/aria-expanded=\{toolsOpen\}/);
  assert.match(source,/Coach tools/);
});

test("coach brief uses real roster, activity, schedule, and attention signals",()=>{
  ["attentionItems","nextEventDateFormatted","highlightPlayersAttention","activeTodayCount","totalPlayers"].forEach((prop)=>assert.match(source,new RegExp(prop)));
  assert.match(source,/Review actions/);
  assert.match(source,/Schedule session/);
});

test("dashboard CSS removes repeated above-the-fold modules and tightens player hierarchy",()=>{
  assert.match(css,/coach-team-standings/);
  assert.match(css,/coach-setup-checklist/);
  assert.match(css,/coach-primary-metrics-feed/);
  assert.match(css,/player-home-compact-dashboard/);
});
