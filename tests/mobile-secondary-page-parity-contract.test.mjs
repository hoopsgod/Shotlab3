import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const commitmentSource = fs.readFileSync(new URL("../src/components/PlayerCommitmentCenter.jsx", import.meta.url), "utf8");
const leaderboardSource = fs.readFileSync(new URL("../src/components/CompactLeaderboardPreviewCard.jsx", import.meta.url), "utf8");
const appParityEnhancer = fs.readFileSync(new URL("../scripts/apply-mobile-secondary-page-parity-app.mjs", import.meta.url), "utf8");
const coachParityEnhancer = fs.readFileSync(new URL("../scripts/apply-mobile-coach-intelligence-parity.mjs", import.meta.url), "utf8");
const emptyStateEnhancer = fs.readFileSync(new URL("../scripts/apply-phase2d-premium-empty-state-language.mjs", import.meta.url), "utf8");
const routeRunner = fs.readFileSync(new URL("../scripts/run-route-enhancers.mjs", import.meta.url), "utf8");
const parityEnhancer = `${appParityEnhancer}\n${coachParityEnhancer}`;

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
  assert.match(appParityEnhancer, /data-sandbox-utility="true"/);
  assert.match(appParityEnhancer, /position:\"absolute\"/);
  assert.match(appParityEnhancer, /width:1,height:1/);
  assert.match(appParityEnhancer, /pointerEvents:\"none\"/);
});

test("Coach Events reserves four schedule slots across empty, sparse, and populated data", () => {
  assert.match(appParityEnhancer, /data-parity-slot-count=\"4\"/);
  assert.match(appParityEnhancer, /data-coach-event-placeholder=\"true\"/);
  assert.match(appParityEnhancer, /Math\.max\(0,4-filteredEvents\.length\)/);
  assert.match(appParityEnhancer, /OPEN SCHEDULE SLOT/);
});

test("Coach S&C reserves three session cards across data density", () => {
  assert.match(appParityEnhancer, /data-coach-sc-placeholder=\"true\"/);
  assert.match(appParityEnhancer, /Math\.max\(0,3-filteredCoachStrengthRows\.length\)/);
  assert.match(appParityEnhancer, /OPEN SESSION SLOT/);
});

test("Coach Players reserves four roster positions without inventing players", () => {
  assert.match(appParityEnhancer, /data-coach-roster-placeholder=\"true\"/);
  assert.match(appParityEnhancer, /Math\.max\(0,4-roster\.length\)/);
  assert.match(appParityEnhancer, /OPEN ROSTER SLOT/);
});

test("Coach Activity reserves six operational rows using semantic function boundaries rather than exact row text", () => {
  assert.match(coachParityEnhancer, /functionSlice/);
  assert.match(coachParityEnhancer, /CoachActivityIntelligencePanel/);
  assert.match(coachParityEnhancer, /data-parity-slot-count=\"6\"/);
  assert.match(coachParityEnhancer, /rows\.slice\(0, 6\)/);
  assert.match(coachParityEnhancer, /Math\.max\(0, 6 - rows\.length\)/);
  assert.match(coachParityEnhancer, /data-activity-placeholder=\"true\"/);
});

test("Phase 2D semantic language is a one-way migration and preserves the downstream parity runway on replay", () => {
  assert.match(emptyStateEnhancer, /semanticPassAlreadyApplied/);
  assert.match(emptyStateEnhancer, /next\.includes\(cssImport\)/);
  assert.match(emptyStateEnhancer, /next\.includes\('data-phase2-empty-state'\)/);
  assert.match(emptyStateEnhancer, /next\.includes\('phase2-empty-state-label'\)/);
  assert.match(emptyStateEnhancer, /next\.includes\('phase2-empty-state-message'\)/);
  assert.match(emptyStateEnhancer, /preserving downstream normalization/);
  assert.match(emptyStateEnhancer, /process\.exit\(0\)/);
  assert.doesNotMatch(emptyStateEnhancer, /activityParityAlreadyApplied/);
});

test("Coach leaderboards reserve three ranking rows without depending on the exact Phase 3L row body", () => {
  assert.match(coachParityEnhancer, /CoachLeaderboardOperationalPanel/);
  assert.match(coachParityEnhancer, /rows\.slice\(0, 3\)/);
  assert.match(coachParityEnhancer, /Math\.max\(0, 3 - rows\.length\)/);
  assert.match(coachParityEnhancer, /data-leaderboard-placeholder=\"true\"/);
  assert.match(coachParityEnhancer, /data-parity-empty-slot=\"true\"/);
  assert.match(coachParityEnhancer, /Open rank/);
  assert.doesNotMatch(coachParityEnhancer, /leaderboardPhase3LBefore/);
});

test("duels preserve Incoming and Completed modules even when no challenge rows exist", () => {
  assert.match(appParityEnhancer, /t=\"INCOMING\"/);
  assert.match(appParityEnhancer, /No incoming duels/);
  assert.match(appParityEnhancer, /<SH t=\"COMPLETED\"/);
  assert.match(appParityEnhancer, /No completed duels yet/);
  assert.match(appParityEnhancer, /data-duel-empty-slot=\"true\"/);
});

test("secondary-page parity normalization runs after authenticated persistence hydration in both pipelines", () => {
  const appParityIndex = routeRunner.indexOf("scripts/apply-mobile-secondary-page-parity-app.mjs");
  const coachParityIndex = routeRunner.indexOf("scripts/apply-mobile-coach-intelligence-parity.mjs");
  const authIndex = routeRunner.indexOf("scripts/apply-post-auth-persistence-hydration.mjs");
  assert.ok(appParityIndex > authIndex, "app-level parity must run after authenticated persistence hydration is installed");
  assert.ok(coachParityIndex > appParityIndex, "Coach intelligence parity must run after app-level parity normalization");
  assert.match(routeRunner, /const FINAL_ROUTE_ENHANCERS/);
  assert.match(routeRunner, /\.\.\.FINAL_ROUTE_ENHANCERS/);
  assert.doesNotMatch(routeRunner, /apply-mobile-secondary-page-parity-v2\.mjs/);
});
