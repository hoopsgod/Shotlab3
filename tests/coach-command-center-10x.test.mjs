import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../src/components/CoachCommandCenter.css",import.meta.url),"utf8");

test("coach dashboard renders the Mission Control information architecture",()=>{
  ["Mission Control","Today’s status","Team Pulse","Needs Attention","Mission Progress","Upcoming Session","Recent Activity","Coach Quick Actions"].forEach(label=>assert.match(source,new RegExp(label)));
  assert.match(source,/data-testid="coach-primary-objective"/);
  assert.match(source,/data-testid="coach-primary-metrics"/);
  assert.match(source,/CourtArtwork/);
});

test("Mission Control preserves coach actions and team code controls",()=>{
  ["Add Player","Create Session","Build Mission","Log Score","View Players","Open Events","Team code","New code"].forEach(label=>assert.match(source,new RegExp(label)));
  assert.match(source,/aria-expanded=\{toolsOpen\}/);
  assert.match(source,/data-testid="coach-secondary-tools"/);
  assert.match(source,/data-testid="coach-team-code-bar"/);
});

test("headshot-ready player rows use image URLs with initials fallback",()=>{
  assert.match(source,/avatarUrl/);
  assert.match(source,/photoUrl/);
  assert.match(source,/headshot placeholder/);
  assert.match(source,/mcAvatar--fallback/);
});

test("responsive CSS supports full desktop grid and single-column phone layout",()=>{
  assert.match(css,/grid-template-columns:1\.08fr 1\.08fr \.92fr/);
  assert.match(css,/@media\(max-width:900px\)/);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(css,/\.mcGrid\{grid-template-columns:1fr\}/);
  assert.match(css,/\.mcQuickGrid\{grid-template-columns:repeat\(2,1fr\)\}/);
  assert.match(css,/player-home-compact-dashboard/);
});
