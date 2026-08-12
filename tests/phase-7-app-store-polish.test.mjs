import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const header = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const styles = fs.readFileSync("src/components/DashboardIdentityHeader.module.css", "utf8");
const leaderboardDeferred = fs.readFileSync("src/components/DeferredPremiumLeaderboardsHub.jsx", "utf8");
const sharedDeferred = fs.readFileSync("src/components/DeferredSharedAuthenticatedUi.jsx", "utf8");
const sharedChrome = fs.readFileSync("src/components/Phase7AuthenticatedChrome.css", "utf8");

test("Phase 7 exposes stable Player identity semantics", () => {
  for (const role of ["inner", "identity", "mode-row", "badge", "team-name", "name", "tagline", "mission", "brand-panel", "brand-mark"]) {
    assert.match(header, new RegExp(`data-identity-role=["']${role}["']`));
  }
});

test("Phase 7 compacts Player identity only away from Home while preserving the mobile gutter", () => {
  assert.match(styles, /performance-shell--player\.is-mobile:not\(\[data-workspace-tab=\\?"home\\?"\]\)/);
  assert.match(styles, /margin:0 14px 8px!important/);
  assert.match(styles, /min-height:92px!important/);
  assert.match(styles, /\.player \.tagline\{display:none!important/);
  assert.match(styles, /\.player \.brandMark\{width:58px!important/);
});

test("Phase 7 uses one shared 44px native return-control authority", () => {
  assert.match(sharedDeferred, /import "\.\/Phase7AuthenticatedChrome\.css"/);
  assert.match(sharedChrome, /player-scroll-container>button\.shared-dashboard-back-action/);
  assert.match(sharedChrome, /page\.pageShell>button\.shared-dashboard-back-action:first-child/);
  assert.match(sharedChrome, /p3c-route-control,44px/);
  assert.match(sharedChrome, /padding:0!important/);
  assert.match(sharedChrome, /p3c-route-radius,14px/);
  assert.match(sharedChrome, />span\[aria-hidden="true"\]/);
  assert.match(sharedChrome, /font-size:21px!important/);
  assert.match(sharedChrome, /touch-action:manipulation!important/);
  assert.match(sharedChrome, /:focus-visible/);
  assert.doesNotMatch(styles, /shared-dashboard-back-action/);
});

test("Phase 7 removes the retired black Coach Leaderboards route canvas without a separate stylesheet chunk", () => {
  assert.doesNotMatch(leaderboardDeferred, /LeaderboardsRoutePolish\.css/);
  assert.match(sharedChrome, /performance-shell--coach\[data-workspace-tab="leaderboards"\]/);
  assert.match(sharedChrome, /background:var\(--bg-0,#f3f1ea\)!important/);
  assert.match(sharedChrome, /performance-workspace::before/);
  assert.match(sharedChrome, /performance-workspace::after/);
});

test("Phase 7 keeps Player Home hero supporting copy readable on the dark performance surface", () => {
  assert.match(sharedChrome, /player-daily-command-center/);
  assert.match(sharedChrome, /data-command-role="primary"/);
  assert.match(sharedChrome, /color:#c7d0d5!important/);
});
