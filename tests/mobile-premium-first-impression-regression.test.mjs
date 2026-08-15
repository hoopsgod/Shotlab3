import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const finalMobileCss = fs.readFileSync(new URL("../public/shotlab-v3-mobile-corrections.css", import.meta.url), "utf8");
const enhancer = fs.readFileSync(new URL("../scripts/apply-mobile-premium-secondary-page-system.mjs", import.meta.url), "utf8");
const secondaryPageSystem = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");
const firstViewportCss = fs.readFileSync(new URL("../src/components/SecondaryPageFirstViewport.css", import.meta.url), "utf8");
const playerHeader = fs.readFileSync(new URL("../src/components/PlayerDashboardHeader.jsx", import.meta.url), "utf8");
const coachHeader = fs.readFileSync(new URL("../src/components/CoachDashboardHeader.jsx", import.meta.url), "utf8");
const progressStory = fs.readFileSync(new URL("../src/components/PlayerProgressStory.jsx", import.meta.url), "utf8");
const brandingCss = fs.readFileSync(new URL("../src/screens/CoachTeamBrandingScreen.css", import.meta.url), "utf8");

test("secondary routes load one explicit signature first-viewport owner after older route layers", () => {
  const premiumAction = secondaryPageSystem.indexOf('import "./Phase2PremiumActionLayer.css";');
  const legacyHierarchy = secondaryPageSystem.indexOf('import "./Phase3CoachLeaderboardHierarchy.css";');
  const firstViewport = secondaryPageSystem.indexOf('import "./SecondaryPageFirstViewport.css";');
  assert.ok(premiumAction >= 0 && legacyHierarchy >= 0 && firstViewport > premiumAction && firstViewport > legacyHierarchy);
  assert.match(secondaryPageSystem, /data-mobile-stage="editorial"/);
  assert.match(secondaryPageSystem, /data-mobile-stage="performance"/);
});

test("mobile route mastheads have sports-editorial scale without exceeding the first viewport", () => {
  assert.match(firstViewportCss, /\.secondaryPageIntro\.appHeader\s*\{[\s\S]*min-height: 134px !important/);
  assert.match(firstViewportCss, /\.secondaryPageIntro__title\.appHeaderTitle\s*\{[\s\S]*font-size: clamp\(36px, 10\.8vw, 43px\) !important/);
  assert.match(firstViewportCss, /\.secondaryPageIntro__summary\s*\{[\s\S]*font-size: 14px !important/);
  assert.match(firstViewportCss, /\.secondaryPageIntro__icon\s*\{[\s\S]*width: 46px !important;[\s\S]*border-left: 3px solid #c8ff1a !important/);
});

test("primary decision moment is a full-bleed dark performance stage rather than another floating card", () => {
  assert.match(firstViewportCss, /\.secondaryPageDecision\s*\{[\s\S]*margin-inline: calc\(var\(--layout-gutter, 16px\) \* -1\) !important/);
  assert.match(firstViewportCss, /\.secondaryPageDecision\s*\{[\s\S]*border-radius: 0 !important/);
  assert.match(firstViewportCss, /linear-gradient\(126deg, #061923 0%, #082430 58%, #0b2d37 100%\) !important/);
  assert.match(firstViewportCss, /\.secondaryPageDecision h2\s*\{[\s\S]*font-size: clamp\(28px, 8vw, 34px\) !important/);
  assert.match(firstViewportCss, /\.secondaryPageDecision button\s*\{[\s\S]*min-height: 44px !important;[\s\S]*background: #c8ff1a !important/);
  assert.match(enhancer, /Performance band: one edge-to-edge decisive moment, not a floating dashboard card/);
});

test("first-impression mobile controls and labels respect the product readability floor", () => {
  assert.match(firstViewportCss, /\.secondaryPageAction\s*\{[\s\S]*min-height: 44px !important;[\s\S]*font-size: 12px !important/);
  assert.match(firstViewportCss, /\.secondaryPageIntro__status\s*\{[\s\S]*font-size: 11px !important/);
  assert.match(firstViewportCss, /\.secondaryPageDecision__eyebrow\s*\{[\s\S]*font-size: 11px !important/);
  assert.doesNotMatch(firstViewportCss, /font-size:\s*(?:8|9|10)(?:\.\d+)?px\b/);
});

test("Coach and Player home identity stages carry visible team branding instead of tiny utility chrome", () => {
  assert.match(playerHeader, /data-identity-role=\"brand-mark\"\]\{width:58px!important;height:58px!important/);
  assert.match(playerHeader, /data-identity-role=\"tagline\"\]\{display:block!important/);
  assert.match(coachHeader, /data-identity-role=\"brand-mark\"\]\{width:60px!important;height:60px!important/);
  assert.match(coachHeader, /data-identity-role=\"brand-button\"\]\{[\s\S]*width:44px!important;min-height:44px!important/);
});

test("legacy final-mobile rules cannot be treated as the desired first-impression specification", () => {
  assert.match(finalMobileCss, /Dark performance surfaces keep their own contrast in the final rendered authority/);
  assert.doesNotMatch(firstViewportCss, /opacity:\s*\.17\s*!important/);
  assert.doesNotMatch(firstViewportCss, /min-height:\s*40px\s*!important/);
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
