import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const finalMobileCss = fs.readFileSync(new URL("../public/shotlab-v3-mobile-corrections.css", import.meta.url), "utf8");
const enhancer = fs.readFileSync(new URL("../scripts/apply-mobile-premium-secondary-page-system.mjs", import.meta.url), "utf8");
const secondaryPageSystem = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");
const secondaryPageCss = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.css", import.meta.url), "utf8");
const teamStage = fs.readFileSync(new URL("../src/components/TeamIdentityTitleStage.jsx", import.meta.url), "utf8");
const teamStageCss = fs.readFileSync(new URL("../src/components/TeamIdentityTitleStage.css", import.meta.url), "utf8");
const playerOperationalWorkspace = fs.readFileSync(new URL("../src/components/PlayerOperationalWorkspace.jsx", import.meta.url), "utf8");
const playerHeader = fs.readFileSync(new URL("../src/components/PlayerDashboardHeader.jsx", import.meta.url), "utf8");
const coachHeader = fs.readFileSync(new URL("../src/components/CoachDashboardHeader.jsx", import.meta.url), "utf8");
const progressStory = fs.readFileSync(new URL("../src/components/PlayerProgressStory.jsx", import.meta.url), "utf8");
const brandingPreview = fs.readFileSync(new URL("../src/components/team/TeamBrandingPreview.jsx", import.meta.url), "utf8");
const metricCss = fs.readFileSync(new URL("../src/components/Phase2PremiumMetricLayer.css", import.meta.url), "utf8");
const scheduleDisclosure = fs.readFileSync(new URL("../src/components/SecondaryPageDisclosure.jsx", import.meta.url), "utf8");
const scheduleCss = fs.readFileSync(new URL("../src/components/SecondaryPageDisclosure.module.css", import.meta.url), "utf8");
const routeFramingCss = fs.readFileSync(new URL("../public/shotlab-phase3-native-route-framing.css", import.meta.url), "utf8");

test("secondary routes use one explicit team-title owner and protect it from late legacy route authority", () => {
  assert.match(secondaryPageSystem, /TeamIdentityTitleStage/);
  assert.match(secondaryPageSystem, /dataMobileStage="team-identity"/);
  assert.match(secondaryPageSystem, /data-mobile-stage="performance"/);
  assert.doesNotMatch(secondaryPageSystem, /SecondaryPageFirstViewport\.css/);
  assert.match(teamStage, /import "\.\/TeamIdentityTitleStage\.css"/);
  assert.doesNotMatch(teamStage, /TeamIdentityTitleStageAuthority\.css/);
  assert.match(teamStageCss, /Production-safe mobile reconciliation/);
  assert.match(teamStageCss, /secondaryPageIntro\.appHeader\.teamIdentityTitleStage\[data-team-identity-stage="true"\]/);
  assert.match(teamStageCss, /grid-area: auto !important/);
});

test("team branding is a dominant but controlled part of every migrated title hierarchy", () => {
  assert.match(teamStage, /useTeamBranding/);
  assert.match(teamStage, /hasCustomLogo/);
  assert.match(teamStage, /useCleanTeamLogo/);
  assert.match(teamStage, /teamIdentityTitleStage__tonalCrest/);
  assert.match(teamStage, /teamIdentityTitleStage__fallbackCrest/);
  assert.match(teamStageCss, /--identity-crest: clamp\(96px, 25vw, 108px\)/);
  assert.match(teamStageCss, /object-fit: contain/);
  assert.doesNotMatch(teamStageCss, /object-fit: cover/);
  assert.match(playerOperationalWorkspace, /TeamIdentityTitleStage/);
  assert.match(playerHeader, /TeamIdentityTitleStage/);
  assert.match(coachHeader, /TeamIdentityTitleStage/);
});

test("mobile route mastheads keep strong team identity without swallowing the first viewport", () => {
  assert.match(teamStageCss, /--identity-title: clamp\(42px, 11vw, 54px\)/);
  assert.match(teamStageCss, /--identity-tonal: clamp\(178px, 52vw, 226px\)/);
  assert.match(teamStageCss, /teamIdentityTitleStage--longTitle[\s\S]*clamp\(39px, 10\.2vw, 48px\)/);
  assert.match(teamStageCss, /@media \(max-width: 760px\)/);
  assert.match(teamStageCss, /secondaryPageIntro\.appHeader\.teamIdentityTitleStage[\s\S]*display: block !important/);
  assert.match(teamStageCss, /secondaryPageIntro\.appHeader\.teamIdentityTitleStage[\s\S]*height: auto !important/);
});

test("primary decision moment remains a full-bleed dark performance stage rather than another floating card", () => {
  assert.match(enhancer, /\.secondaryPageDecision \{[\s\S]*margin-inline: calc\(var\(--layout-gutter, 16px\) \* -1\);/);
  assert.match(enhancer, /\.secondaryPageDecision \{[\s\S]*border-radius: 0;/);
  assert.match(enhancer, /linear-gradient\(128deg, #071a22 0%, #0a222b 58%, #102e35 100%\)/);
  assert.match(enhancer, /\.secondaryPageDecision h2 \{[\s\S]*font-size: clamp\(26px, 7\.3vw, 31px\)/);
  assert.match(enhancer, /\.secondaryPageDecision button \{[\s\S]*min-height: 44px;[\s\S]*background: #c8ff1a;/);
});

test("first-impression mobile controls and labels respect the product readability floor", () => {
  assert.match(teamStage, /secondaryPageAction/);
  assert.match(secondaryPageCss, /\.secondaryPageAction \{[\s\S]*min-height: var\(--control-height, 48px\)/);
  assert.match(teamStageCss, /font: 820 12px\/1\.15/);
  assert.match(teamStageCss, /teamIdentityTitleStage__status[\s\S]*font: 720 11px\/1\.2/);
  assert.match(teamStageCss, /prefers-reduced-motion: reduce/);
});

test("Coach secondary metrics use a readable 2x2 scoreboard rather than a clipped or compressed strip", () => {
  assert.match(metricCss, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(metricCss, /nth-child\(even\)\{border-left:1px solid/);
  assert.match(metricCss, /nth-child\(n\+3\)\{border-top:1px solid/);
  assert.match(metricCss, /font-size:31px!important/);
  assert.match(metricCss, /font-size:11px!important/);
  assert.match(metricCss, /\[data-premium-metric-evidence\]\{display:none!important\}/);
});

test("Schedule disclosure is structurally limited to two non-overlapping information lines", () => {
  assert.match(scheduleDisclosure, /data-visual-role="disclosure-title"/);
  assert.match(scheduleDisclosure, /data-visual-role="disclosure-meta"/);
  assert.match(scheduleCss, /min-height:\s*60px/);
  assert.match(scheduleCss, /\.copy \{[\s\S]*display:\s*grid;[\s\S]*gap:\s*4px/);
  assert.match(scheduleCss, /font:\s*760 11px\/1\.15/);
  assert.match(scheduleCss, /font:\s*760 14px\/1\.2/);
  assert.doesNotMatch(scheduleCss, /!important/);
});

test("secondary route framing spends first-viewport space on content, not dead runway", () => {
  assert.match(routeFramingCss, /shared-dashboard-back-action\{margin-bottom:-6px!important\}/);
  assert.match(routeFramingCss, /player-dashboard-identity-header"\]\{margin-inline:12px!important/);
  assert.match(routeFramingCss, /coachAdministrationWorkspace \.secondaryPageIntro\{row-gap:4px!important;padding-bottom:8px!important\}/);
});

test("Player and Coach Home use the same team-owned hero architecture with role-specific content", () => {
  for (const header of [playerHeader, coachHeader]) {
    assert.match(header, /TeamIdentityTitleStage/);
    assert.match(header, /variant="hero"/);
    assert.match(header, /surface="dark"/);
  }
  assert.match(playerHeader, /role="Player"/);
  assert.match(playerHeader, /title=\{displayName\}/);
  assert.match(coachHeader, /role="Coach"/);
  assert.match(coachHeader, /title="Mission Control"/);
  assert.match(teamStageCss, /--identity-crest: clamp\(104px, 29vw, 120px\)/);
});

test("legacy final-mobile rules cannot be treated as the desired first-impression specification", () => {
  assert.match(finalMobileCss, /Dark performance surfaces keep their own contrast in the final rendered authority/);
  assert.doesNotMatch(secondaryPageSystem, /SecondaryPageFirstViewport\.css/);
  assert.doesNotMatch(teamStage, /TeamIdentityTitleStageAuthority\.css/);
  assert.match(teamStageCss, /width: var\(--identity-crest\) !important/);
  assert.match(teamStageCss, /display: block !important/);
});

test("Program Branding previews the real Coach and Player title architecture", () => {
  assert.match(brandingPreview, /TeamBrandingProvider branding=\{branding\}/);
  assert.ok((brandingPreview.match(/TeamIdentityTitleStage/g) || []).length >= 3);
  assert.match(brandingPreview, /title="Mission Control"/);
  assert.match(brandingPreview, /title="Program Training"/);
});

test("Player Progress gains team-development framing while preserving its narrative command story", () => {
  assert.match(progressStory, /TeamIdentityTitleStage/);
  assert.match(progressStory, /role="Development"/);
  assert.match(progressStory, /title="Progress"/);
  assert.match(progressStory, /data-page-hierarchy="command-story"/);
  assert.match(progressStory, /data-layout-role="command-story-header"/);
  assert.match(progressStory, /data-testid="player-progress-metrics"/);
  assert.match(progressStory, /<h2>\{story\.headline\}<\/h2>/);
});
