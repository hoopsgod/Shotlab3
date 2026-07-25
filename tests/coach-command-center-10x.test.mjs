import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../src/components/CoachCommandCenter.css",import.meta.url),"utf8");

test("coach command center renders one cinematic daily brief",()=>{
  assert.match(source,/Coach command/);
  assert.match(source,/coach-primary-objective/);
  assert.match(source,/coach-primary-metrics/);
  assert.match(source,/coachTodayBrief__signal/);
  assert.doesNotMatch(source,/Team health/i);
  assert.doesNotMatch(source,/coach-command-grid/);
});

test("coach command center keeps core coach actions behind progressive tools",()=>{
  ["Add Player","Add Drill","Create Event","Log Score","Team code","New code"].forEach((label)=>assert.match(source,new RegExp(label)));
  assert.match(source,/aria-expanded=\{toolsOpen\}/);
  assert.match(source,/Coach tools/);
});

test("coach brief uses real roster, activity, schedule, and attention signals",()=>{
  ["attentionItems","nextEventDateFormatted","highlightPlayersAttention","activeTodayCount","totalPlayers"].forEach((prop)=>assert.match(source,new RegExp(prop)));
  assert.match(source,/Review priorities/);
  assert.match(source,/Schedule session/);
});

test("home v2 CSS replaces stacked cards with a cinematic and editorial hierarchy",()=>{
  assert.match(css,/radial-gradient/);
  assert.match(css,/coachTodayBrief__signal/);
  assert.match(css,/coach-team-standings/);
  assert.match(css,/coach-setup-checklist/);
  assert.match(css,/player-home-compact-dashboard/);
  assert.match(css,/player-primary-objective/);
  assert.match(css,/details summary/);
  assert.match(css,/@media\(max-width:520px\)/);
});