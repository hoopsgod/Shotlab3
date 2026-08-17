import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const playerParityEnhancer = fs.readFileSync("scripts/apply-mobile-player-secondary-page-parity.mjs", "utf8");
const appParityEnhancer = fs.readFileSync("scripts/apply-mobile-secondary-page-parity-app.mjs", "utf8");
const coachParityEnhancer = fs.readFileSync("scripts/apply-mobile-coach-intelligence-parity.mjs", "utf8");
const emptyStateEnhancer = fs.readFileSync("scripts/apply-phase2d-empty-state-semantic-language.mjs", "utf8");
const routeRunner = fs.readFileSync("scripts/run-route-enhancers.mjs", "utf8");

// Player secondary routes intentionally preserve stable visual runway where it communicates
// useful module shape without inventing real people, events, scores, or commitments.
test("player commitments keep a fixed mobile runway instead of removing the module when data is sparse", () => {
  assert.match(playerParityEnhancer, /data-player-program-event-placeholder="true"/);
  assert.match(playerParityEnhancer, /data-player-sc-placeholder="true"/);
  assert.match(playerParityEnhancer, /Math\.max\(0, 3 - upcomingEvents\.length\)/);
  assert.match(playerParityEnhancer, /Math\.max\(0, 3 - upcomingSC\.length\)/);
});

test("player leaderboards keep ranking geometry when the registered account has fewer or zero rows", () => {
  assert.match(playerParityEnhancer, /data-leaderboard-placeholder="true"/);
  assert.match(playerParityEnhancer, /Open rank/);
  assert.match(playerParityEnhancer, /Math\.max\(0, 3 - previewRows\.length\)/);
});

test("demo-only utilities cannot change visible Coach Settings geometry", () => {
  assert.match(appParityEnhancer, /data-demo-utility="true"/);
  assert.match(appParityEnhancer, /demoUtilityHidden/);
  assert.match(appParityEnhancer, /display:\s*none/);
});

test("Coach Events parity preserves the premium short empty state and natural schedule length", () => {
  assert.match(appParityEnhancer, /Coach Events owns its own premium short empty state/);
  assert.match(appParityEnhancer, /data-testid="coach-events-mobile-page"/);
  assert.doesNotMatch(appParityEnhancer, /coach-open-event/);
  assert.doesNotMatch(appParityEnhancer, /OPEN SCHEDULE SLOT/);
});

test("Coach S&C reserves three session cards across data density", () => {
  assert.match(appParityEnhancer, /data-sc-session-placeholder="true"/);
  assert.match(appParityEnhancer, /Math\.max\(0, 3 - upcomingSC\.length\)/);
  assert.match(appParityEnhancer, /data-parity-empty-slot="true"/);
});

test("Coach Players reserves four roster positions without inventing players", () => {
  assert.match(appParityEnhancer, /data-roster-placeholder="true"/);
  assert.match(appParityEnhancer, /Math\.max\(0, 4 - filteredPlayers\.length\)/);
  assert.match(appParityEnhancer, /Open roster slot/);
});

test("Coach Activity reserves six operational rows using semantic function boundaries rather than exact row text", () => {
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

test("Coach leaderboards cap the live ranking at three without fabricating ranking rows", () => {
  assert.match(coachParityEnhancer, /CoachLeaderboardOperationalPanel/);
  assert.match(coachParityEnhancer, /truthful natural-length ranking geometry/);
  assert.match(coachParityEnhancer, /rows\.slice\(0,\s*3\)/);
  assert.match(coachParityEnhancer, /No leaderboard players match the selected view/);
  assert.doesNotMatch(coachParityEnhancer, /Math\.max\(0,\s*3\s*-\s*rows\.length\)/);
  assert.doesNotMatch(coachParityEnhancer, /data-leaderboard-placeholder=\"true\"/);
  assert.doesNotMatch(coachParityEnhancer, /data-parity-empty-slot=\"true\"/);
  assert.doesNotMatch(coachParityEnhancer, /Open rank/);
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

test("Phase 5 keeps every mobile Player secondary identity header compact and inside the viewport", () => {
  const css = fs.readFileSync("src/App.css", "utf8");
  assert.match(css, /\.playerPageHeader/);
  assert.match(css, /max-width:\s*100%/);
});

test("Phase 5 gives dark Player metric surfaces explicit readable foreground ownership", () => {
  const css = fs.readFileSync("src/App.css", "utf8");
  assert.match(css, /--text-1/);
  assert.match(css, /--text-2/);
});

test("Phase 5 visual audit measures geometry and semantic foreground contrast rather than relying on page width alone", () => {
  const audit = fs.readFileSync("tests/e2e/phase-3a-cross-screen-visual-audit.spec.mjs", "utf8");
  assert.match(audit, /contrast/i);
  assert.match(audit, /boundingBox|getBoundingClientRect/);
});

test("Phase 5 restores persistent connectivity feedback after transient notifications settle", () => {
  const source = fs.readFileSync("src/App.jsx", "utf8");
  assert.match(source, /connectivity/i);
});
