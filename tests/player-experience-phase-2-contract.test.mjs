import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const componentSource = fs.readFileSync(new URL("../src/components/PlayerOperationalWorkspace.jsx", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../src/components/PlayerOperationalWorkspace.module.css", import.meta.url), "utf8");

test("all remaining Player routes use the shared operational workspace command bar", () => {
  [
    "player-at-home-workspace",
    "player-program-workspace",
    "player-events-workspace",
    "player-strength-workspace",
    "player-leaderboards-workspace",
    "player-profile-workspace",
  ].forEach((testId) => assert.match(appSource, new RegExp(`testId=\\"${testId}\\"`)));
  assert.match(appSource, /PlayerWorkspaceCommandBar/);
  assert.match(appSource, /buildAtHomeWorkspaceModel/);
  assert.match(appSource, /buildProgramWorkspaceModel/);
  assert.match(appSource, /buildEventsWorkspaceModel/);
  assert.match(appSource, /buildStrengthWorkspaceModel/);
  assert.match(appSource, /buildLeaderboardWorkspaceModel/);
  assert.match(appSource, /buildProfileWorkspaceModel/);
});

test("At Home and Program expose operational filters without altering persistence functions", () => {
  assert.match(appSource, /testId="player-at-home-filter-rail"/);
  assert.match(appSource, /testId="player-program-filter-rail"/);
  assert.match(appSource, /visibleHomeDrills\.map/);
  assert.match(appSource, /visibleProgramSessionBlocks\.map/);
  assert.match(appSource, /addShotLog\(validation\.made,shotDate\)/);
  assert.match(appSource, /addScore\(active\.id,v,activeMode\)/);
  assert.match(appSource, /toggleRsvp=\{toggleRsvp\}/);
  assert.match(appSource, /addScLog=\{addScLog\}/);
});

test("workspace components preserve mobile interaction and accessibility contracts", () => {
  assert.match(componentSource, /aria-label=\{`\$\{model\.title\} metrics`\}/);
  assert.match(componentSource, /aria-pressed=\{activeMetric === metric\.id\}/);
  assert.match(componentSource, /role="group"/);
  assert.match(componentSource, /PlayerWorkspaceEmptyState/);
  assert.match(cssSource, /min-height:46px/);
  assert.match(cssSource, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(cssSource, /overflow-x:auto/);
});

test("Phase 2 remains Player-only and introduces no schema or auth changes", () => {
  assert.doesNotMatch(appSource, /performance-shell--coach[\s\S]{0,120}player-at-home-workspace/);
  assert.doesNotMatch(componentSource, /supabase|auth|migration|fetch\(/i);
});
