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

test("leaderboards keep ranking geometry when the registered account has fewer or zero rows", () => {
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

test("empty Coach Events stays inside the normal bounded mobile workspace", () => {
  assert.match(parityEnhancer, /coach-events-mobile-empty-state/);
  assert.match(parityEnhancer, /data-parity-empty-slot=\"true\"/);
  assert.match(parityEnhancer, /minHeight:190/);
  assert.match(parityEnhancer, /borderTop:\"1px solid var\(--stroke-1\)\"/);
  assert.match(parityEnhancer, /borderBottom:\"1px solid var\(--stroke-1\)\"/);
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
