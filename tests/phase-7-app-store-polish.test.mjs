import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("src/App.jsx", "utf8");
const header = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const sharedStage = fs.readFileSync("src/components/TeamIdentityTitleStage.jsx", "utf8");
const sharedStageCss = fs.readFileSync("src/components/TeamIdentityTitleStage.css", "utf8");
const leaderboardDeferred = fs.readFileSync("src/components/DeferredPremiumLeaderboardsHub.jsx", "utf8");
const sharedDeferred = fs.readFileSync("src/components/DeferredSharedAuthenticatedUi.jsx", "utf8");
const sharedChrome = fs.readFileSync("src/components/Phase7AuthenticatedChrome.css", "utf8");
const secondaryAcceptance = fs.readFileSync("public/shotlab-phase3-secondary-acceptance.css", "utf8");
const backEnhancer = fs.readFileSync("scripts/apply-phase4d-shared-back-hit-area.mjs", "utf8");
const industrialFoundation = fs.readFileSync("src/lib/industrialDesignFoundation.js", "utf8");
const releaseBoundary = fs.readFileSync("src/components/ReleaseReadinessBoundary.jsx", "utf8");

test("Phase 7 exposes stable Player identity semantics through the shared team title primitive", () => {
  assert.match(header, /TeamIdentityTitleStage/);
  assert.match(header, /testId="player-dashboard-identity-header"/);
  for (const role of ["inner", "identity", "mode-row", "badge", "team-name", "name", "tagline", "brand-panel", "brand-mark"]) {
    assert.match(sharedStage, new RegExp(`data-identity-role=["']${role}["']`));
  }
  assert.match(sharedStage, /data-team-identity-stage="true"/);
});

test("Phase 7 makes the team-owned Player hero the mobile default", () => {
  assert.match(header, /variant="hero"/);
  assert.match(header, /surface="dark"/);
  assert.match(header, /role="Player"/);
  assert.match(sharedStageCss, /--identity-crest:\s*clamp\(104px,\s*29vw,\s*120px\)/);
  assert.match(sharedStageCss, /object-fit:\s*contain/);
  assert.match(sharedStageCss, /linear-gradient\(126deg, #061923 0%, #082430 58%, #0a2933 100%\)/);
  assert.doesNotMatch(sharedStageCss, /object-fit:\s*cover/);
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
  assert.doesNotMatch(sharedStageCss, /shared-dashboard-back-action/);
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

test("Phase 7 keeps authenticated chrome bounded to route framing rather than duplicating component paint", () => {
  assert.doesNotMatch(sharedChrome, /player-daily-command-center/);
  assert.doesNotMatch(sharedChrome, /performance-workspace::before/);
  assert.doesNotMatch(sharedChrome, /player-scroll-container>button/);
  assert.doesNotMatch(sharedChrome, /background:#fff!important/);
  assert.doesNotMatch(sharedChrome, /box-shadow:none!important/);
});

test("Phase 1 protects the Player command hero from low-contrast generic paragraph paint", () => {
  assert.match(industrialFoundation, /\.performance-shell p:not\(\[data-command-role="primary"\] p\)/);
  assert.doesNotMatch(industrialFoundation, /\.performance-shell p,\n\.performance-shell small/);
});

test("Phase 1 clears stale sync feedback at demo entry and uses grammatically correct status copy", () => {
  assert.match(releaseBoundary, /isDemoRuntimeAccount\(persisted\?\.email\)/);
  assert.match(releaseBoundary, /shotlab:demo-session-started/);
  assert.match(releaseBoundary, /still \$\{attentionCount === 1 \? "needs" : "need"\} attention/);
});
