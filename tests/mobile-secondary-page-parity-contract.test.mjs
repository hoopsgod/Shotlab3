import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const commitmentSource = fs.readFileSync(new URL("../src/components/PlayerCommitmentCenter.jsx", import.meta.url), "utf8");
const leaderboardSource = fs.readFileSync(new URL("../src/components/CompactLeaderboardPreviewCard.jsx", import.meta.url), "utf8");
const parityEnhancer = fs.readFileSync(new URL("../scripts/apply-mobile-secondary-page-parity.mjs", import.meta.url), "utf8");
const routeRunner = fs.readFileSync(new URL("../scripts/run-route-enhancers.mjs", import.meta.url), "utf8");

test("player commitments keep a fixed mobile runway instead of removing the module when data is sparse", () => {
  assert.match(commitmentSource, /const RUNWAY_SLOTS = 3/);
  assert.match(commitmentSource, /data-runway-slots=\{RUNWAY_SLOTS\}/);
  assert.match(commitmentSource, /runwayPlaceholders/);
  assert.match(commitmentSource, /Schedule slot open|Development slot open/);
  assert.doesNotMatch(commitmentSource, /state\.upcoming\.length\s*>\s*0\s*&&\s*\(\s*<div className=\{styles\.queue\}/);
});

test("player leaderboards keep ranking geometry when the registered account has fewer or zero rows", () => {
  assert.match(leaderboardSource, /minimumRows = 3/);
  assert.match(leaderboardSource, /data-reserved-rows=\{reservedRows\}/);
  assert.match(leaderboardSource, /displayState === "empty"\s*\? reservedRows/);
  assert.match(leaderboardSource, /data-leaderboard-placeholder="true"/);
  assert.match(leaderboardSource, /keepsRankingFrame = displayState === "ready" \|\| displayState === "empty"/);
});

test("demo-only utilities cannot change visible Coach Settings geometry", () => {
  assert.match(parityEnhancer, /data-sandbox-utility="true"/);
  assert.match(parityEnhancer, /position:\"absolute\"/);
  assert.match(parityEnhancer, /width:1,height:1/);
  assert.match(parityEnhancer, /pointerEvents:\"none\"/);
});

test("Coach Events reserves four schedule slots across empty, sparse, and populated data", () => {
  assert.match(parityEnhancer, /data-parity-slot-count=\"4\"/);
  assert.match(parityEnhancer, /data-coach-event-placeholder=\"true\"/);
  assert.match(parityEnhancer, /Math\.max\(0,4-filteredEvents\.length\)/);
  assert.match(parityEnhancer, /OPEN SCHEDULE SLOT/);
});

test("Coach S&C reserves three session cards across data density", () => {
  assert.match(parityEnhancer, /data-coach-sc-placeholder=\"true\"/);
  assert.match(parityEnhancer, /Math\.max\(0,3-filteredCoachStrengthRows\.length\)/);
  assert.match(parityEnhancer, /OPEN SESSION SLOT/);
});

test("Coach Players reserves four roster positions without inventing players", () => {
  assert.match(parityEnhancer, /data-coach-roster-placeholder=\"true\"/);
  assert.match(parityEnhancer, /Math\.max\(0,4-roster\.length\)/);
  assert.match(parityEnhancer, /OPEN ROSTER SLOT/);
});

test("Coach Activity reserves six operational rows", () => {
  assert.match(parityEnhancer, /data-parity-slot-count=\"6\"/);
  assert.match(parityEnhancer, /rows\.slice\(0, 6\)/);
  assert.match(parityEnhancer, /Math\.max\(0, 6 - rows\.length\)/);
  assert.match(parityEnhancer, /data-activity-placeholder=\"true\"/);
});

test("Coach leaderboards reserve three ranking rows for zero or partial results", () => {
  assert.match(parityEnhancer, /coach leaderboard minimum ranking rows/);
  assert.match(parityEnhancer, /coach leaderboard empty ranking geometry/);
  assert.match(parityEnhancer, /rows\.slice\(0,3\)/);
  assert.match(parityEnhancer, /Math\.max\(0, 3 - rows\.length\)/);
  assert.match(parityEnhancer, /data-leaderboard-placeholder=\"true\"/);
  assert.match(parityEnhancer, /Open rank/);
});

test("duels preserve Incoming and Completed modules even when no challenge rows exist", () => {
  assert.match(parityEnhancer, /t=\"INCOMING\"/);
  assert.match(parityEnhancer, /No incoming duels/);
  assert.match(parityEnhancer, /<SH t=\"COMPLETED\"/);
  assert.match(parityEnhancer, /No completed duels yet/);
  assert.match(parityEnhancer, /data-duel-empty-slot=\"true\"/);
});

test("secondary-page parity normalization runs in both dev and production enhancer pipelines", () => {
  const parityIndex = routeRunner.indexOf("scripts/apply-mobile-secondary-page-parity.mjs");
  const authIndex = routeRunner.indexOf("scripts/apply-post-auth-persistence-hydration.mjs");
  assert.ok(parityIndex > authIndex, "secondary-page parity must run after authenticated persistence hydration is installed");
  assert.match(routeRunner, /const FINAL_ROUTE_ENHANCERS/);
  assert.match(routeRunner, /\.\.\.FINAL_ROUTE_ENHANCERS/);
});
