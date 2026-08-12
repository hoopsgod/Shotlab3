import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const header = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const styles = fs.readFileSync("src/components/DashboardIdentityHeader.module.css", "utf8");
const leaderboardDeferred = fs.readFileSync("src/components/DeferredPremiumLeaderboardsHub.jsx", "utf8");
const leaderboardPolish = fs.readFileSync("src/components/LeaderboardsRoutePolish.css", "utf8");
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
  assert.match(styles, /\.player \.tagline\{\s*display:none!important/);
  assert.match(styles, /\.player \.brandMark\{\s*width:58px!important/);
});

test("Phase 7 preserves a 44px accessible Player secondary return target", () => {
  assert.match(styles, /player-scroll-container>button\[type=\\?"button\\?"\]/);
  assert.match(styles, /width:44px!important/);
  assert.match(styles, /height:44px!important/);
  assert.match(styles, /content:\s*"‹"/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(styles, /display:none!important[^}]*player-scroll-container>button/);
});

test("Phase 7 removes the retired black Coach Leaderboards route canvas", () => {
  assert.match(leaderboardDeferred, /import ['"]\.\/LeaderboardsRoutePolish\.css['"]/);
  assert.match(leaderboardPolish, /performance-shell--coach\[data-workspace-tab="leaderboards"\]/);
  assert.match(leaderboardPolish, /background:\s*var\(--bg-0, #f3f1ea\) !important/);
  assert.match(leaderboardPolish, /performance-workspace::before/);
  assert.match(leaderboardPolish, /performance-workspace::after/);
});

test("Phase 7 loads one shared compact Coach secondary return contract", () => {
  assert.match(sharedDeferred, /import "\.\/Phase7AuthenticatedChrome\.css"/);
  assert.match(sharedChrome, /performance-shell--coach\.is-mobile \.page\.pageShell > button\[type="button"\]:first-child/);
  assert.match(sharedChrome, /width:\s*44px !important/);
  assert.match(sharedChrome, /height:\s*44px !important/);
  assert.match(sharedChrome, /content:\s*"‹"/);
  assert.match(sharedChrome, /:focus-visible/);
});

test("Phase 7 keeps Player Home hero supporting copy readable on the dark performance surface", () => {
  assert.match(sharedChrome, /player-daily-command-center/);
  assert.match(sharedChrome, /data-command-role="primary"/);
  assert.match(sharedChrome, /color:\s*#c7d0d5 !important/);
});
