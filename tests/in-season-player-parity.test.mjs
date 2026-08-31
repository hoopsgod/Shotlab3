import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { applyInSeasonPlayerParity } from "../scripts/apply-in-season-player-parity.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const appSource = read("src/App.jsx");
const transformedApp = applyInSeasonPlayerParity(appSource);
const hubSource = read("src/components/InSeasonPerformanceHub.jsx");
const routeEnhancers = read("scripts/run-route-enhancers.mjs");
const playerNavStart = transformedApp.indexOf("const playerNavItems=[");
const playerNavEnd = transformedApp.indexOf("const getPlayerNavItem=", playerNavStart);
const playerNavSource = playerNavStart >= 0 && playerNavEnd > playerNavStart ? transformedApp.slice(playerNavStart, playerNavEnd) : "";

test("player In Season parity transform is deterministic and idempotent", () => {
  assert.equal(applyInSeasonPlayerParity(transformedApp), transformedApp);
  assert.match(routeEnhancers, /apply-in-season-player-parity\.mjs/);
});

test("player navigation exposes an addressable In Season destination", () => {
  assert.match(transformedApp, /"in-season":"\/in-season"/);
  assert.match(transformedApp, /"\/in-season":"in-season"/);
  assert.match(playerNavSource, /\{k:"in-season",l:"In Season"/);
  assert.match(transformedApp, /getPlayerNavItem\("in-season",\{mobileLabel:"In Season",mobileIcon:"chart",group:"performance"/);
});

test("player workspace mounts the shared team-scoped In Season hub", () => {
  assert.match(transformedApp, /data-testid="player-in-season-workspace"/);
  assert.match(transformedApp, /<InSeasonPerformanceHub role="player" user=\{u\} team=\{team\}/);
  assert.match(transformedApp, /programScores=\{teamProgramScores\}/);
  assert.match(transformedApp, /players=\{playerLeaderboardPlayers\}/);
  assert.match(transformedApp, /seasonArchives=\{seasonArchives\}/);
  assert.match(transformedApp, /addScore=\{addScore\}/);
});

test("coach In Season metrics use source-owned default drill markers without private catalog references", () => {
  assert.match(transformedApp, /programDrills\.filter\(d=>d\?\.isDefaultDemo\|\|isInSeasonProgramDrill\(d\)\)\.length/);
  assert.doesNotMatch(transformedApp, /findMatchingDefaultDrill\(d,DEFAULT_PROGRAM_DRILL_INDEX\)/);
});

test("shared hub keeps player and coach permissions distinct", () => {
  assert.match(hubSource, /const isCoach = role === "coach"/);
  assert.match(hubSource, /!isCoach && <form className="inSeasonScoreEntry"/);
  assert.match(hubSource, /isCoach && <button[^>]+inSeasonTextAction/);
  assert.match(hubSource, /isCoach && <div className="inSeasonCoachScoreAction"/);
  assert.match(hubSource, /addScore\(drillId\(selectedDrill\), value, "program"\)/);
  assert.match(hubSource, /teamId=\{clean\(user\?\.teamId \|\| user\?\.team_id \|\| team\?\.id\)\}/);
});
