import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const finalMobileCss = fs.readFileSync(new URL("../public/shotlab-v3-mobile-corrections.css", import.meta.url), "utf8");
const enhancer = fs.readFileSync(new URL("../scripts/apply-mobile-premium-secondary-page-system.mjs", import.meta.url), "utf8");
const centeredRouteEnhancer = fs.readFileSync(new URL("../scripts/apply-mobile-centered-route-stage.mjs", import.meta.url), "utf8");
const secondaryPageSystem = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");
const secondaryBrandMark = fs.readFileSync(new URL("../src/components/SecondaryTeamBrandMark.jsx", import.meta.url), "utf8");
const playerOperationalWorkspace = fs.readFileSync(new URL("../src/components/PlayerOperationalWorkspace.jsx", import.meta.url), "utf8");
const playerHeader = fs.readFileSync(new URL("../src/components/PlayerDashboardHeader.jsx", import.meta.url), "utf8");
const coachHeader = fs.readFileSync(new URL("../src/components/CoachDashboardHeader.jsx", import.meta.url), "utf8");
const progressStory = fs.readFileSync(new URL("../src/components/PlayerProgressStory.jsx", import.meta.url), "utf8");
const brandingCss = fs.readFileSync(new URL("../src/screens/CoachTeamBrandingScreen.css", import.meta.url), "utf8");
const metricCss = fs.readFileSync(new URL("../src/components/Phase2PremiumMetricLayer.css", import.meta.url), "utf8");
const scheduleDisclosure = fs.readFileSync(new URL("../src/components/SecondaryPageDisclosure.jsx", import.meta.url), "utf8");
const scheduleCss = fs.readFileSync(new URL("../src/components/SecondaryPageDisclosure.module.css", import.meta.url), "utf8");
const routeFramingCss = fs.readFileSync(new URL("../public/shotlab-phase3-native-route-framing.css", import.meta.url), "utf8");

test("secondary routes use one explicit signature owner instead of a late competing first-viewport stylesheet", () => {
  assert.match(secondaryPageSystem, /import "\.\/SecondaryPageSystem\.css";/);
  assert.match(secondaryPageSystem, /import "\.\/Phase2PremiumActionLayer\.css";/);
  assert.match(secondaryPageSystem, /import "\.\/Phase3CoachLeaderboardHierarchy\.css";/);
  assert.doesNotMatch(secondaryPageSystem, /SecondaryPageFirstViewport\.css/);
  assert.match(enhancer, /ShotLab route stage: compact mark \+ editorial type \+ one touch-safe action rail/);
  assert.match(secondaryPageSystem, /data-mobile-stage="editorial"/);
  assert.match(secondaryPageSystem, /data-mobile-stage="performance"/);
});

test("team branding is prominent once per secondary-page identity hierarchy", () => {
  assert.match(secondaryBrandMark, /useTeamBranding/);
  assert.match(secondaryBrandMark, /branding\?\.logoUrl \|\| branding\?\.logoMarkUrl/);
  assert.match(secondaryBrandMark, /useCleanTeamLogo/);
  assert.match(secondaryPageSystem, /<SecondaryTeamBrandMark iconName=\{iconName\} variant="route"\/>/);
  assert.match(secondaryBrandMark, /width: "100%", height: "100%", overflow: "visible"/);
  assert.match(secondaryBrandMark, /transform: "scale\(1\.45\)"/);
  assert.match(centeredRouteEnhancer, /width: 56px/);
  assert.match(centeredRouteEnhancer, /height: 56px/);
  assert.match(centeredRouteEnhancer, /background: transparent/);
  assert.match(centeredRouteEnhancer, /border: 0/);
  assert.match(playerHeader, /useTeamBranding/);
  assert.match(playerHeader, /branding\?\.logoUrl \|\| branding\?\.logoMarkUrl/);
  assert.doesNotMatch(playerOperationalWorkspace, /SecondaryTeamBrandMark/);
});

test("mobile route mastheads keep editorial hierarchy without swallowing the first viewport", () => {
  assert.match(enhancer, /\.secondaryPageIntro \{[\s\S]*min-height: 0;[\s\S]*padding: 7px 0 12px;/);
  assert.match(enhancer, /\.secondaryPageIntro \.secondaryPageIntro__title\.appHeaderTitle,[\s\S]*font-size: clamp\(31px, 8\.5vw, 34px\) !important/);
  assert.match(enhancer, /\.secondaryPageIntro__summary \{ display: none; \}/);
  assert.match(enhancer, /\.secondaryPageIntro__icon \{[\s\S]*width: 30px;[\s\S]*height: 30px;[\s\S]*background: #0b2028;[\s\S]*color: #c8ff1a;/);
  assert.match(secondaryPageSystem, /coachPlayerDetailWorkspace \.secondaryPageIntro__title,.coachAdministrationWorkspace \.secondaryPageIntro__title\{max-width:16ch!important\}/);
  assert.match(secondaryPageSystem, /brandingEditorialWorkspace \.secondaryPageIntro__title\{max-width:18ch!important;white-space:nowrap\}/);
  assert.doesNotMatch(enhancer, /width: 74px/);
  assert.doesNotMatch(centeredRouteEnhancer, /width: (?:7[0-9]|8[0-9]|9[0-9])px/);
});

test("primary decision moment is a full-bleed dark performance stage rather than another floating card", () => {
  assert.match(enhancer, /\.secondaryPageDecision \{[\s\S]*margin-inline: calc\(var\(--layout-gutter, 16px\) \* -1\);/);
  assert.match(enhancer, /\.secondaryPageDecision \{[\s\S]*border-radius: 0;/);
  assert.match(enhancer, /linear-gradient\(128deg, #071a22 0%, #0a222b 58%, #102e35 100%\)/);
  assert.match(enhancer, /\.secondaryPageDecision h2 \{[\s\S]*font-size: clamp\(26px, 7\.3vw, 31px\)/);
  assert.match(enhancer, /\.secondaryPageDecision button \{[\s\S]*min-height: 44px;[\s\S]*background: #c8ff1a;/);
  assert.match(enhancer, /Performance band: one edge-to-edge decisive moment, not a floating dashboard card/);
});

test("first-impression mobile controls and labels respect the product readability floor", () => {
  assert.match(enhancer, /\.secondaryPageAction \{[\s\S]*min-height: 44px;[\s\S]*font-size: 12px;/);
  assert.match(enhancer, /\.secondaryPageIntro__eyebrow \{[^}]*font-size: 11px/);
  assert.match(enhancer, /\.secondaryPageIntro__status \{[\s\S]*font-size: 11px/);
  assert.match(enhancer, /\.secondaryPageDecision__eyebrow \{[^}]*font-size: 11px/);
  assert.doesNotMatch(enhancer, /font-size:\s*(?:8|9|10)(?:\.\d+)?px\b/);
});

test("Coach secondary metrics use a readable 2x2 scoreboard rather than a clipped or compressed strip", () => {
  assert.match(metricCss, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(metricCss, /nth-child\(even\)\{border-left:1px solid/);
  assert.match(metricCss, /nth-child\(n\+3\)\{border-top:1px solid/);
  assert.match(metricCss, /font-size:31px!important/);
  assert.match(metricCss, /font-size:11px!important/);
  assert.match(metricCss, /\[data-premium-metric-evidence\]\{display:none!important\}/);
  assert.doesNotMatch(metricCss, /flex-basis:82vw!important/);
  assert.doesNotMatch(metricCss, /repeat\(auto-fit,minmax\(76px,1fr\)\)/);
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
  assert.match(routeFramingCss, /font-size:11px!important/);
});

test("Player Home uses a compact athlete credential while Coach retains its existing identity controls", () => {
  assert.match(playerHeader, /grid-template-columns:56px minmax\(0,1fr\)!important/);
  assert.match(playerHeader, /min-height:82px!important/);
  assert.match(playerHeader, /data-identity-role=\"brand-mark\"\]\{width:52px!important;height:52px!important/);
  assert.match(playerHeader, /data-identity-role=\"name\"\]\{[\s\S]*font-size:23px!important/);
  assert.match(playerHeader, /data-identity-role=\"team-name\"\][\s\S]*overflow-wrap:anywhere!important/);
  assert.match(playerHeader, /data-identity-role=\"tagline\"\],\[data-identity-role=\"mission\"\]\)\{display:none!important/);
  assert.match(coachHeader, /data-identity-role=\"brand-mark\"\]\{width:60px!important;height:60px!important/);
  assert.match(coachHeader, /data-identity-role=\"brand-button\"\]\{[\s\S]*width:44px!important;min-height:44px!important/);
});

test("legacy final-mobile rules cannot be treated as the desired first-impression specification", () => {
  assert.match(finalMobileCss, /Dark performance surfaces keep their own contrast in the final rendered authority/);
  assert.doesNotMatch(enhancer, /opacity:\s*\.17/);
  assert.doesNotMatch(enhancer, /min-height:\s*40px/);
  assert.doesNotMatch(secondaryPageSystem, /SecondaryPageFirstViewport\.css/);
});

test("Program Branding keeps intentional dark identity contrast against later global surface authorities", () => {
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview\{[^}]*background:linear-gradient\(145deg,#0a2633,#102f39\)!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__panel-header\{[^}]*background:transparent!important[^}]*box-shadow:none!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__panel-header h2\{color:#f8faf6!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__panel-header p\{color:#c6d1cf!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__kicker\{color:#c8ff1a!important/);
});

test("Player Progress remains a purposeful command-story surface instead of gaining a redundant page title", () => {
  assert.match(progressStory, /data-page-hierarchy="command-story"/);
  assert.match(progressStory, /data-layout-role="command-story-header"/);
  assert.match(progressStory, /data-testid="player-progress-metrics"/);
  assert.doesNotMatch(progressStory, /data-visual-role="page-intro"/);
});
