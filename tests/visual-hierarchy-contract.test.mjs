import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource=fs.readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
const hierarchySource=fs.readFileSync(new URL("../src/components/VisualHierarchy.jsx",import.meta.url),"utf8");
const hierarchyCss=fs.readFileSync(new URL("../src/components/VisualHierarchy.module.css",import.meta.url),"utf8");
const commandCenterSource=fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx",import.meta.url),"utf8");
const missionControlCss=fs.readFileSync(new URL("../src/components/CoachMissionControlV2.css",import.meta.url),"utf8");
const leaderboardSource=fs.readFileSync(new URL("../src/components/PremiumLeaderboardsHub.jsx",import.meta.url),"utf8");

test("shared hierarchy primitives remain available",()=>{
  assert.match(hierarchySource,/function DominantObjectiveCard/);
  assert.match(hierarchySource,/function MetricStrip/);
  assert.match(hierarchySource,/items\.slice\(0, 3\)/);
  assert.match(hierarchySource,/function ProgressiveDisclosure/);
  assert.match(hierarchySource,/function QuietSection/);
  assert.match(hierarchyCss,/\.objective\s*\{/);
  assert.match(hierarchyCss,/\.metricStrip\s*\{/);
  assert.match(hierarchyCss,/\.disclosure\s*\{/);
});

test("player dashboard keeps one dominant mission and three primary metrics",()=>{
  assert.match(appSource,/testId="player-primary-objective"/);
  assert.match(appSource,/testId="player-primary-metrics"/);
  assert.match(appSource,/title="Upcoming schedule"/);
  assert.match(appSource,/testId="player-team-standings"/);
  assert.match(appSource,/testId="player-coach-guidance"/);
  assert.match(appSource,/testId="player-secondary-intelligence"/);
  assert.doesNotMatch(appSource,/aria-label="Progress snapshot"/);
});

test("coach home keeps one dominant workflow and preserved utilities",()=>{
  [
    /Mission Control/,
    /primaryCommand/,
    /CourtArtwork/,
    /useTeamBranding/,
    /data-testid="coach-primary-objective"/,
    /data-testid="coach-primary-metrics"/,
    /data-testid="coach-secondary-tools"/,
    /data-testid="coach-team-code-bar"/,
    /aria-expanded=\{toolsOpen\}/,
  ].forEach((pattern)=>assert.match(commandCenterSource,pattern));
  assert.equal((commandCenterSource.match(/data-testid="coach-primary-objective"/g)||[]).length,1);
  assert.match(appSource,/coach-home-dashboard/);
});

test("leaderboards keep rankings ahead of archive context",()=>{
  assert.match(leaderboardSource,/data-testid="leaderboard-status-line"/);
  assert.match(leaderboardSource,/aria-label="Primary leaderboard categories"/);
  assert.match(leaderboardSource,/testId="leaderboard-participation-categories"/);
  assert.match(leaderboardSource,/testId="all-time-coverage-note"/);
  assert.match(leaderboardSource,/PRIMARY_CATEGORY_ITEMS/);
  assert.match(leaderboardSource,/PARTICIPATION_CATEGORY_ITEMS/);
});

test("Mission Control declares desktop and mobile layout boundaries",()=>{
  assert.match(missionControlCss,/\.mcShellV3/);
  assert.match(missionControlCss,/@media\(max-width:980px\)/);
  assert.match(missionControlCss,/@media\(max-width:700px\)/);
  assert.match(missionControlCss,/mission-control-active/);
  assert.match(missionControlCss,/safe-area-inset-bottom/);
  assert.match(missionControlCss,/\.mcFab/);
  assert.equal((appSource.match(/testId="player-primary-objective"/g)||[]).length,1);
});
