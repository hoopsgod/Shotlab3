import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../src/components/CoachCommandCenter.css",import.meta.url),"utf8");

test("coach dashboard matches the approved Mission Control architecture",()=>{
  ["Mission Control","Today’s status","Team Pulse","Needs Attention","Mission Progress","Upcoming Session","Recent Activity","Coach Quick Actions"].forEach(label=>assert.match(source,new RegExp(label)));
  assert.match(source,/data-testid="coach-primary-objective"/);
  assert.match(source,/data-testid="coach-primary-metrics"/);
  assert.match(source,/CourtArtwork/);
  assert.match(source,/mcRail/);
  assert.match(source,/mcTeamSelect/);
  assert.match(source,/mcCourtScene/);
});

test("Mission Control preserves coach actions and team code controls",()=>{
  ["Add Player","Create Session","Build Mission","Log Score","Message Team","View Analytics","Team code","New code"].forEach(label=>assert.match(source,new RegExp(label)));
  assert.match(source,/aria-expanded=\{toolsOpen\}/);
  assert.match(source,/data-testid="coach-secondary-tools"/);
  assert.match(source,/data-testid="coach-team-code-bar"/);
});

test("headshot-ready player and coach rows use image URLs with initials fallback",()=>{
  assert.match(source,/avatarUrl/);
  assert.match(source,/photoUrl/);
  assert.match(source,/coachAvatarUrl/);
  assert.match(source,/headshot placeholder/);
  assert.match(source,/mcAvatar--fallback/);
});

test("responsive CSS supports reference desktop shell and phone layout",()=>{
  assert.match(css,/grid-template-columns:118px minmax\(0,1fr\)/);
  assert.match(css,/grid-template-columns:1\.05fr 1\.05fr \.95fr/);
  assert.match(css,/@media\(max-width:980px\)/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/\.mcTopGrid,\.mcBottomGrid\{grid-template-columns:1fr\}/);
  assert.match(css,/\.mcQuickGrid\{grid-template-columns:repeat\(2,1fr\)\}/);
});
