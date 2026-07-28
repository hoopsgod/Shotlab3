import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource=fs.readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
const surfaceSource=fs.readFileSync(new URL("../src/components/PlayerExperiencePhase2.jsx",import.meta.url),"utf8");
const surfaceCss=fs.readFileSync(new URL("../src/components/PlayerExperiencePhase2.css",import.meta.url),"utf8");

const surfaces=["at-home","program","events","strength","leaderboards","profile"];

test("player phase 2 exposes one reusable dashboard system across every player surface",()=>{
  for(const surface of surfaces){
    assert.match(surfaceSource,new RegExp(`player-phase2-${surface}`));
  }
  assert.match(surfaceSource,/function SurfaceShell/);
  assert.match(surfaceSource,/function ProgressRail/);
  assert.match(surfaceSource,/function MetricCard/);
});

test("App integrates all six player phase 2 surfaces",()=>{
  for(const component of [
    "PlayerAtHomeDashboard",
    "PlayerProgramDashboard",
    "PlayerEventsDashboard",
    "PlayerStrengthDashboard",
    "PlayerLeaderboardsDashboard",
    "PlayerProfileDashboard",
  ]){
    assert.match(appSource,new RegExp(`<${component}`));
  }
  assert.match(appSource,/from "\.\/components\/PlayerExperiencePhase2\.jsx"/);
});

test("player phase 2 remains presentation-only and preserves persistence boundaries",()=>{
  for(const forbidden of ["supabase",".insert(",".update(",".delete(","localStorage","sessionStorage","fetch("]){
    assert.equal(surfaceSource.includes(forbidden),false,`surface layer must not contain ${forbidden}`);
  }
});

test("mobile command decks retain readable actions and compact metrics",()=>{
  assert.match(surfaceCss,/@media \(max-width:520px\)/);
  assert.match(surfaceCss,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(surfaceCss,/min-height:46px/);
  assert.match(surfaceCss,/safe-area|scroll-margin-top/);
});

test("every primary player phase 2 action is browser-addressable",()=>{
  assert.match(surfaceSource,/data-testid=\{`player-phase2-\$\{surface\}-primary-action`\}/);
  assert.match(surfaceSource,/scrollIntoView/);
});
