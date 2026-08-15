import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const coach = read("../src/components/CoachCommandCenter.jsx");
const coachCss = read("../src/styles/MissionControlHierarchy2026.css");
const coachHeader = read("../src/components/CoachDashboardHeader.jsx");
const playerHeader = read("../src/components/PlayerDashboardHeader.jsx");
const identityCss = read("../src/components/DashboardIdentityHeader.module.css");
const playerMetrics = read("../src/components/PlayerMetricHierarchy.module.css");
const playerCommand = read("../src/components/PlayerDailyCommandCenter.jsx");
const playerCommandCss = read("../src/components/PlayerDailyCommandCenter.module.css");
const finalMobileCss = read("../public/shotlab-v3-mobile-corrections.css");

test("Mobile Product Reset identifies the shared first-viewport surfaces", () => {
  assert.match(coach, /data-mobile-product-reset="phase-1"/);
  assert.match(playerHeader, /data-mobile-product-reset="phase-1"/);
  assert.match(playerCommand, /data-mobile-product-reset="phase-1"/);
});

test("Coach mobile identity uses a free-standing team mark inside the command header", () => {
  assert.match(coach, /className="mcHeaderTeamMark"/);
  assert.match(coach, /aria-label=\{`Customize \$\{teamName\} team identity`\}/);
  assert.match(coach, /MOBILE_PRODUCT_RESET_CSS/);
  assert.match(coachCss, /\.mcHeaderTeamMark/);
  assert.match(coach, /\.mcHeaderTeamMark img\{width:44px!important;height:44px!important\}/);
});

test("Mobile home identity is a branded ShotLab stage rather than low-contrast utility chrome", () => {
  assert.match(playerHeader, /MOBILE_PRODUCT_RESET_CSS/);
  assert.match(playerHeader, /data-mobile-chrome="native-identity"/);
  assert.match(playerHeader, /data-identity-role=\"inner\"\]\{[\s\S]*?min-height:96px!important/);
  assert.match(playerHeader, /data-identity-role=\"brand-mark\"\]\{width:58px!important;height:58px!important/);
  assert.match(playerHeader, /data-identity-role=\"tagline\"\]\{display:block!important/);
  assert.match(coachHeader, /data-identity-role=\"inner\"\]\{[\s\S]*?min-height:102px!important/);
  assert.match(coachHeader, /data-identity-role=\"brand-mark\"\]\{width:60px!important;height:60px!important/);
  assert.match(coachHeader, /data-identity-role=\"brand-button\"\]\{[\s\S]*?width:44px!important;min-height:44px!important/);
  assert.match(playerCommandCss, /Mobile Product Reset — Phase 1/);
  assert.match(playerCommandCss, /\.description \{[^}]*font-size: 15px;/);
  assert.match(coach, /MOBILE_PRODUCT_RESET_CSS/);
  assert.match(coach, /\.mcHeroContent>p\{[\s\S]*?font-size:14px!important/);
});

test("Mobile first-impression typography never drops below the 11px product floor", () => {
  const firstImpression = [playerHeader, coachHeader, playerMetrics].join("\n");
  assert.doesNotMatch(firstImpression, /font-size:\s*(?:8|9|10)(?:\.\d+)?px\b/);
  assert.match(playerMetrics, /metricPrimary \[class\*="metricValue"\][\s\S]*font-size:46px!important/);
  assert.match(playerMetrics, /metricSupporting \[class\*="metricLabel"\][\s\S]*font-size:11px!important/);
});

test("Coach and Player Home share the edge-to-edge performance-stage language", () => {
  assert.match(finalMobileCss, /Home command surfaces use the same edge-to-edge performance language as secondary decisions/);
  assert.match(finalMobileCss, /body\.mission-control-active \.mcHero \{[\s\S]*margin-inline: -12px !important;[\s\S]*border-radius: 0 !important/);
  assert.match(finalMobileCss, /body\.mission-control-active \.mcHero h1 \{[\s\S]*color: #f5f7f4 !important;[\s\S]*font-size: clamp\(34px,9\.4vw,39px\) !important/);
  assert.match(finalMobileCss, /\[data-testid="player-daily-command-center"\] \[data-command-role="primary"\] \{[\s\S]*margin: 12px -20px 0 !important;[\s\S]*border-radius: 0 !important/);
  assert.match(finalMobileCss, /\[data-testid="player-daily-primary-action"\] \{[\s\S]*background: #c8ff1a !important/);
});

test("The reset remains presentation-only", () => {
  for (const source of [coachCss, identityCss, playerCommandCss, finalMobileCss]) {
    assert.doesNotMatch(source, /supabase|localStorage|sessionStorage|fetch\(/i);
  }
});
