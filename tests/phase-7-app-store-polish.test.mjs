import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("src/App.jsx", "utf8");
const header = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const styles = fs.readFileSync("src/components/DashboardIdentityHeader.module.css", "utf8");
const leaderboardDeferred = fs.readFileSync("src/components/DeferredPremiumLeaderboardsHub.jsx", "utf8");
const sharedDeferred = fs.readFileSync("src/components/DeferredSharedAuthenticatedUi.jsx", "utf8");
const sharedChrome = fs.readFileSync("src/components/Phase7AuthenticatedChrome.css", "utf8");
const secondaryAcceptance = fs.readFileSync("public/shotlab-phase3-secondary-acceptance.css", "utf8");
const backEnhancer = fs.readFileSync("scripts/apply-phase4d-shared-back-hit-area.mjs", "utf8");
const industrialFoundation = fs.readFileSync("src/lib/industrialDesignFoundation.js", "utf8");

test("Phase 7 exposes stable Player identity semantics", () => {
  for (const role of ["inner", "identity", "mode-row", "badge", "team-name", "name", "tagline", "mission", "brand-panel", "brand-mark"]) {
    assert.match(header, new RegExp(`data-identity-role=["']${role}["']`));
  }
});

test("Phase 7 makes the compact Player identity the mobile default", () => {
  assert.match(styles, /@media\(max-width:700px\)/);
  assert.match(styles, /\.player\{margin:0 14px 8px\}/);
  assert.match(styles, /\.player \.inner\{grid-template-columns:minmax\(0,1fr\) 62px;gap:10px;min-height:92px;padding:10px 0 11px\}/);
  assert.match(styles, /\.player \.tagline\{display:none\}/);
  assert.match(styles, /\.player \.brandMark\{width:58px;height:58px/);
  assert.doesNotMatch(styles, /performance-shell--player\.is-mobile:not/);
});

test("Phase 7 uses one shared 44px native return-control authority", () => {
  assert.match(sharedDeferred, /import "\.\/Phase7AuthenticatedChrome\.css"/);
  assert.match(sharedChrome, /\.is-mobile \.shared-dashboard-back-action/);
  assert.match(sharedChrome, /width:44px!important/);
  assert.match(sharedChrome, /padding:0!important/);
  assert.match(sharedChrome, /border-radius:14px!important/);
  assert.match(sharedChrome, />span\[aria-hidden="true"\]/);
  assert.match(sharedChrome, /font-size:21px!important/);
  assert.match(sharedChrome, /:focus-visible/);
  assert.match(backEnhancer, /minHeight:44/);
  assert.match(backEnhancer, /touchAction:"manipulation"/);
  assert.doesNotMatch(styles, /shared-dashboard-back-action/);
});

test("Phase 7 overrides the legacy dark Coach workspace canvas at the exact source layer", () => {
  assert.doesNotMatch(leaderboardDeferred, /LeaderboardsRoutePolish\.css/);
  assert.match(app, /performance-workspace--coach/);
  assert.match(app, /background:u\.isCoach\?"#0B0A09":BG/);
  assert.match(sharedChrome, /\.performance-workspace--coach\{background:var\(--bg-0\)!important\}/);
  assert.doesNotMatch(sharedChrome, /body:has/);
});

test("Phase 7 includes Coach Leaderboards in the established light secondary-route canvas authority", () => {
  assert.match(secondaryAcceptance, /coach-page-dashboard-leaderboards/);
  assert.match(secondaryAcceptance, /#root \.coach-scroll-container/);
  assert.match(secondaryAcceptance, /background:var\(--p3-canvas\)!important/);
});

test("Phase 7 preserves intentional dark Player hero copy from the generic light-foundation paragraph rule", () => {
  assert.match(industrialFoundation, /\.performance-shell p:not\(\[data-command-role="primary"\] p\)/);
  assert.doesNotMatch(industrialFoundation, /\.performance-shell p,\n\.performance-shell small/);
});

test("Phase 7 keeps authenticated chrome bounded to route framing rather than duplicating component paint", () => {
  assert.doesNotMatch(sharedChrome, /player-daily-command-center/);
  assert.doesNotMatch(sharedChrome, /performance-workspace::before/);
  assert.doesNotMatch(sharedChrome, /player-scroll-container>button/);
  assert.doesNotMatch(sharedChrome, /background:#fff!important/);
  assert.doesNotMatch(sharedChrome, /box-shadow:none!important/);
});
