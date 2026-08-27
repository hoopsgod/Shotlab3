import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import buildThemeTokens from "../src/theme/buildThemeTokens.js";

const read = (path) => fs.readFileSync(path, "utf8");
const coach = read("src/components/CoachCommandCenter.jsx");
const coachHomeCss = read("src/components/CoachMissionControlTitleStage.css");
const titleCss = read("src/components/TeamIdentityTitleStage.css");
const secondaryCss = read("src/components/SecondaryPageSystem.css");
const coachConvergenceCss = read("src/styles/CoachRoleVisualConvergence2026.css");
const coachRouteCss = read("src/components/CoachRoutePerformanceStage.module.css");
const playerMetricCss = read("src/components/PlayerMetricHierarchy.module.css");
const playerProgressCss = read("src/components/PlayerProgressStory.module.css");
const insightRailCss = read("src/components/OperationalInsightRail.module.css");
const surfaceContractCss = read("src/styles/Phase3SurfaceContracts.css");
const leaderboardCss = read("src/components/Phase3CoachLeaderboardHierarchy.css");
const commandHierarchyCss = read("src/styles/CommandHierarchy2026.css");
const dashboardPrimitivesCss = read("src/components/CoachDashboardPrimitives.module.css");
const mobileNavigationCss = read("src/components/MobileNavigation.module.css");
const mobileNavigationAuthorityCss = read("src/components/MobileNavigationArchitecture.css");
const missionControlHierarchyCss = read("src/styles/MissionControlHierarchy2026.css");
const legacyFoundationCss = read("public/shotlab-v3-foundation.css");

test("Coach Home uses the full uploaded custom logo for every visible and tactical identity slot", () => {
  assert.match(coach, /const heroTeamLogoUrl = fullTeamLogoUrl;/);
  assert.match(coach, /<CourtArtwork logoUrl=\{heroTeamLogoUrl\}/);
  assert.match(coach, /className="mcHeroTeamMark"[\s\S]*src=\{heroTeamLogoUrl\}/);
  assert.doesNotMatch(coach, /configuredMarkSource|cleanMarkLogoUrl|DEFAULT_MARK/);
});

test("Coach mobile Home keeps the tactical court visible and brand-driven", () => {
  assert.doesNotMatch(coachHomeCss, /\.mcCourtArtwork,[\s\S]*?\.mcHeroScrim\s*\{\s*display:\s*none;/);
  assert.doesNotMatch(missionControlHierarchyCss, /\.mcCourtArtwork,[\s\S]*?\.mcHeroScrim\s*\{[\s\S]*?display:\s*none\s*!important/);
  assert.match(coachHomeCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\][\s\S]*var\(--team-brand-surface-elevated[\s\S]*var\(--team-brand-surface-deep/);
  assert.match(coachHomeCss, /\.mcHeroContent\s*\{[\s\S]*background:\s*transparent/);
  assert.doesNotMatch(coachHomeCss, /\.mcHeroIdentity::after\s*\{[\s\S]*content:\s*"Mission Control"/);
});

test("Coach Home contains the full custom logo at desktop and mobile widths", () => {
  assert.match(coachHomeCss, /\.mcHeroIdentity\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+clamp\(/);
  assert.match(coachHomeCss, /\.mcHeroTeamMark\s*\{[\s\S]*width:\s*clamp\(/);
  assert.match(coachHomeCss, /\.mcHeroTeamMark img\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;[\s\S]*object-fit:\s*contain/);
  assert.match(coachHomeCss, /@media \(max-width:\s*700px\)[\s\S]*\.mcHeroTeamMark\s*\{[\s\S]*width:\s*var\(--coach-hero-crest\)/);
});

test("legacy compatibility cannot enlarge or recolor the compact Coach utility lockup", () => {
  assert.doesNotMatch(legacyFoundationCss, /body\.mission-control-active \.mcBrandCopy/);
  assert.match(coachHomeCss, /\.mcHeader\[data-testid="mission-control-team-header"\][\s\S]*\.mcBrandCopy small\s*\{[\s\S]*font-size:\s*9px/);
  assert.match(coachHomeCss, /\.mcHeader\[data-testid="mission-control-team-header"\][\s\S]*\.mcBrandCopy strong\s*\{[\s\S]*color:\s*#f5f8f9;[\s\S]*font-size:\s*14px/);
});

test("team palettes derive accessible branded atmosphere and secondary-action tokens", () => {
  const blue = buildThemeTokens({ primaryColor: "#3B82F6", secondaryColor: "#93C5FD" }).cssVariables;
  const red = buildThemeTokens({ primaryColor: "#EF4444", secondaryColor: "#FCA5A5" }).cssVariables;

  for (const key of [
    "--team-brand-surface-deep",
    "--team-brand-surface",
    "--team-brand-surface-elevated",
    "--team-brand-page-wash",
    "--team-brand-secondary-action",
    "--team-brand-on-secondary",
    "--team-brand-secondary-soft",
  ]) {
    assert.ok(blue[key], `${key} is available to shared surfaces`);
    if (key !== "--team-brand-on-secondary") {
      assert.notEqual(blue[key], red[key], `${key} responds to the selected team palette`);
    }
  }

  assert.equal(blue["--semantic-danger"], red["--semantic-danger"]);
  assert.equal(blue["--semantic-warning"], red["--semantic-warning"]);
});

test("shared authenticated surfaces consume the brand atmosphere instead of fixed navy", () => {
  assert.match(titleCss, /var\(--team-brand-surface-elevated/);
  assert.match(titleCss, /var\(--team-brand-surface-deep/);
  assert.match(secondaryCss, /var\(--team-brand-surface-elevated/);
  assert.match(secondaryCss, /var\(--team-brand-surface-deep/);
  assert.match(coachConvergenceCss, /--coach-2026-navy:\s*var\(--team-brand-surface-deep/);
  assert.match(coachConvergenceCss, /--coach-2026-navy-2:\s*var\(--team-brand-surface-elevated/);
  assert.match(coachRouteCss, /var\(--team-brand-surface-elevated/);
  assert.match(coachRouteCss, /var\(--team-brand-surface-deep/);
  assert.match(playerMetricCss, /metricPrimary[\s\S]*var\(--team-brand-surface-elevated[\s\S]*var\(--team-brand-surface-deep/);
  assert.match(playerProgressCss, /\.hero\s*\{[\s\S]*var\(--team-brand-surface-elevated[\s\S]*var\(--team-brand-surface-deep/);
  assert.match(insightRailCss, /\.primaryCard\s*\{[\s\S]*var\(--team-brand-surface-elevated[\s\S]*var\(--team-brand-surface-deep/);
  assert.doesNotMatch(playerMetricCss, /#061923|#082430|#0b2d37|rgba\(17,19,20,.94\)/);
  assert.doesNotMatch(playerProgressCss, /linear-gradient\(150deg,\s*#0f1412/);
  assert.doesNotMatch(insightRailCss, /linear-gradient\(145deg,\s*#0b2633,\s*#071820\)/);
  assert.match(surfaceContractCss, /--sl-surface-dark-material:\s*var\(--team-brand-surface-deep/);
  assert.match(surfaceContractCss, /--sl-surface-dark-material-elevated:\s*var\(--team-brand-surface-elevated/);
  assert.match(surfaceContractCss, /primary-decision[\s\S]*linear-gradient\(145deg, var\(--sl-surface-dark-material-elevated\), var\(--sl-surface-dark-material\) 72%\)/);
  assert.match(leaderboardCss, /secondaryPageDecision[\s\S]*var\(--team-brand-surface-elevated[\s\S]*var\(--team-brand-surface-deep/);
  assert.doesNotMatch(leaderboardCss, /linear-gradient\(145deg, #171b18, #0c0f0d/);
  assert.match(commandHierarchyCss, /player-primary-logging-region[\s\S]*var\(--team-brand-surface-elevated[\s\S]*var\(--team-brand-surface-deep/);
  assert.match(dashboardPrimitivesCss, /commandBar[\s\S]*var\(--team-brand-surface-elevated[\s\S]*var\(--team-brand-surface-deep/);
  assert.match(mobileNavigationCss, /\.dock\s*\{[\s\S]*var\(--team-brand-surface-deep/);
  assert.match(mobileNavigationAuthorityCss, /mobile-navigation-dock[\s\S]*var\(--team-brand-surface-deep/);
});

test("secondary actions use the selected secondary team color without recoloring semantic status", () => {
  assert.match(titleCss, /teamIdentityTitleStage__action--primary[\s\S]*--team-brand-surface-deep/);
  assert.match(titleCss, /teamIdentityTitleStage__action:not\(\.teamIdentityTitleStage__action--primary\)[\s\S]*--team-brand-secondary-action/);
  assert.match(secondaryCss, /secondaryPageEvidence[\s\S]*--team-brand-secondary-soft/);
  assert.match(coachConvergenceCss, /cta-secondary[\s\S]*--team-brand-secondary-soft/);
});
