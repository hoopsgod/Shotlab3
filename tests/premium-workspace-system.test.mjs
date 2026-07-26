import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync("src/App.jsx", "utf8");
const workspaceCss = fs.readFileSync("src/styles/PremiumWorkspace.css", "utf8");
const headerSource = fs.readFileSync("src/components/AppHeader.jsx", "utf8");
const hierarchyCss = fs.readFileSync("src/components/VisualHierarchy.module.css", "utf8");
const brandingSource = fs.readFileSync("src/screens/CoachTeamBrandingScreen.jsx", "utf8");
const rosterSource = fs.readFileSync("src/screens/PlayersScreen.jsx", "utf8");

test("premium workspace CSS is imported and explicitly scoped to coach and player shells", () => {
  assert.match(appSource, /import "\.\/styles\/PremiumWorkspace\.css";/);
  assert.match(appSource, /performance-shell performance-shell--player/);
  assert.match(appSource, /performance-shell performance-shell--coach/);
  assert.match(appSource, /data-workspace-tab=\{tab\}/);
  assert.match(appSource, /performance-workspace--coach/);
  assert.match(appSource, /performance-workspace--player/);
});

test("shared workspace system uses semantic team-aware tokens and scoped selectors", () => {
  assert.match(workspaceCss, /\.performance-shell \{/);
  assert.match(workspaceCss, /--pw-accent: var\(--team-brand-primary, var\(--accent\)\)/);
  assert.match(workspaceCss, /data-workspace-tab="events"/);
  assert.match(workspaceCss, /data-workspace-tab="sc"/);
  assert.match(workspaceCss, /\.performance-shell \.sidebar-nav/);
  assert.match(workspaceCss, /\.performance-shell input/);
  assert.match(workspaceCss, /\.premium-screen/);
  assert.doesNotMatch(workspaceCss, /(^|\n)\s*(body|html|\*)\s*\{/);
});

test("premium workspace preserves mobile usability and reduced-motion support", () => {
  assert.match(workspaceCss, /@media \(max-width: 767px\)/);
  assert.match(workspaceCss, /min-height: 48px/);
  assert.match(workspaceCss, /env\(safe-area-inset-bottom/);
  assert.match(workspaceCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(workspaceCss, /-webkit-tap-highlight-color: transparent/);
});

test("reusable headers expose stable hooks for premium page treatment", () => {
  for (const hook of [
    "appHeader",
    "appHeaderMain",
    "appHeaderIdentity",
    "appHeaderLeading",
    "appHeaderEyebrow",
    "appHeaderTitle",
    "appHeaderSubtitle",
    "appHeaderAction",
  ]) {
    assert.match(headerSource, new RegExp(hook));
  }
});

test("visual hierarchy primitives match Mission Control interaction standards", () => {
  assert.match(hierarchyCss, /\.objective \{/);
  assert.match(hierarchyCss, /box-shadow: 0 24px 62px/);
  assert.match(hierarchyCss, /\.primaryAction::after/);
  assert.match(hierarchyCss, /\.metricStrip \{/);
  assert.match(hierarchyCss, /\.disclosure\[open\]/);
  assert.match(hierarchyCss, /\.quietSection \{/);
  assert.match(hierarchyCss, /@media \(max-width: 640px\)/);
});

test("roster and branding screens use the shared premium system", () => {
  assert.match(brandingSource, /premium-screen premium-screen--branding/);
  assert.match(brandingSource, /eyebrow="Team identity system"/);
  assert.match(rosterSource, /premium-roster-workspace/);
  assert.match(rosterSource, /coach-players-primary-objective/);
  assert.match(rosterSource, /coach-players-metrics/);
  assert.match(rosterSource, /DominantObjectiveCard/);
  assert.match(rosterSource, /MetricStrip/);
});
