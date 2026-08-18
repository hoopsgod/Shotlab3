import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const stage = read("src/components/TeamIdentityTitleStage.jsx");
const css = read("src/components/TeamIdentityTitleStage.css");
const secondary = read("src/components/SecondaryPageSystem.jsx");
const playerHeader = read("src/components/PlayerDashboardHeader.jsx");
const playerWorkspace = read("src/components/PlayerOperationalWorkspace.jsx");
const coachCommand = read("src/components/CoachCommandCenter.jsx");
const coachHero = read("src/components/CoachPrimaryObjective.jsx");
const coachCss = read("src/components/CoachMissionControlV2.css");
const progressStory = read("src/components/PlayerProgressStory.jsx");
const trainingHeader = read("src/components/PlayerTrainingSessionHeader.jsx");
const brandingPreview = read("src/components/team/TeamBrandingPreview.jsx");
const brandingForm = read("src/components/team/TeamBrandingForm.jsx");
const brandingScreenCss = read("src/screens/CoachTeamBrandingScreen.css");
const brandingDefaults = read("src/theme/brandingDefaults.js");
const brandingBoundary = read("scripts/apply-team-identity-branding-boundary.mjs");
const routeEnhancers = read("scripts/run-route-enhancers.mjs");
const demoData = read("src/lib/demoData.js");
const renderedAuthority = read("public/shotlab-rendered-visual-authority.css");

test("team identity title stage is the shared Coach and Player title primitive", () => {
  assert.match(secondary, /TeamIdentityTitleStage/);
  assert.match(playerHeader, /TeamIdentityTitleStage/);
  assert.match(playerWorkspace, /TeamIdentityTitleStage/);
  assert.match(stage, /useTeamBranding/);
  assert.match(stage, /useCleanTeamLogo/);
  assert.match(stage, /data-team-identity-stage="true"/);
  assert.match(stage, /data-identity-role="team-name"/);
  assert.match(stage, /data-identity-role="brand-mark"/);
});

test("finite title variants are literal source classes so production pruning cannot erase them", () => {
  for (const marker of [
    "teamIdentityTitleStage--hero",
    "teamIdentityTitleStage--standard",
    "teamIdentityTitleStage--dark",
    "teamIdentityTitleStage--light",
  ]) assert.match(stage, new RegExp(marker));
  assert.doesNotMatch(stage, /teamIdentityTitleStage--\$\{/);
});

test("mobile crest geometry is materially larger without destructive cropping", () => {
  assert.match(css, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/);
  assert.match(css, /--identity-crest:\s*clamp\(104px, 29vw, 120px\)/);
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /drop-shadow/);
  assert.doesNotMatch(css, /clip-path/);
  assert.doesNotMatch(css, /border-radius:\s*50%/);
});

test("team crest and Player Home hero are isolated from legacy secondary-route authority", () => {
  assert.match(css, /position:\s*relative !important/);
  assert.match(css, /isolation:\s*isolate/);
  assert.match(css, /overflow:\s*hidden !important/);
  assert.match(css, /\.teamIdentityTitleStage--dark/);
  assert.match(css, /Player Home is the only place where the immersive Player credential remains visible/i);
});

test("late title authority owns mobile secondary geometry after legacy appHeader rules", () => {
  assert.match(css, /#root \[data-team-identity-stage="true"\] h1\.appHeaderTitle/);
  assert.match(css, /font-size:\s*var\(--identity-title\) !important/);
  assert.match(css, /letter-spacing:\s*-\.064em !important/);
});

test("one last public presentation layer remains mounted as the supplemental final authority", () => {
  assert.match(brandingBoundary, /shotlab-team-identity-title-authority\.css/);
  assert.match(routeEnhancers, /apply-team-identity-branding-boundary\.mjs/);
});

test("team colors remain decorative while semantic status stays protected", () => {
  assert.match(css, /color-mix\(in srgb, var\(--team-brand-primary/);
  assert.match(css, /\.teamIdentityTitleStage__status/);
  assert.doesNotMatch(css, /--status-(?:success|error|warning):\s*var\(--team/);
});

test("Coach Home integrates program identity into Mission Control rather than stacking a second hero", () => {
  assert.doesNotMatch(coachCommand, /TeamIdentityTitleStage/);
  assert.match(coachHero, /programName/);
  assert.match(coachHero, /teamLogo/);
  assert.match(coachHero, /\.mcProgramIdentity/);
  assert.match(coachHero, /\.mcHeroTeamMark/);
  assert.match(coachCss, /\.mcHeroTeamMark/);
});

test("Player operational routes preserve their meanings inside team-owned title stages", () => {
  for (const marker of [
    '"at-home": "Player"',
    'program: "Program"',
    'events: "Schedule"',
    'strength: "Physical Development"',
    'leaderboards: "Compete"',
    'profile: "Development"',
  ]) assert.ok(playerWorkspace.includes(marker), `missing ${marker}`);
  assert.match(playerWorkspace, /aria-label=\{`\$\{model\.title\} metrics`\}/);
  assert.match(playerWorkspace, /scheduleWorkspaceActionReveal/);
  assert.match(renderedAuthority, /secondary Player routes own identity in their page title stage/i);
});

test("Program Branding previews production titles and has a neutral no-logo state", () => {
  const occurrences = (brandingPreview.match(/TeamIdentityTitleStage/g) || []).length;
  assert.ok(occurrences >= 3, "expected import plus Coach and Player title previews");
  assert.match(brandingPreview, /TeamBrandingProvider branding=\{branding\}/);
  assert.match(brandingForm, /const FALLBACK_LOGO = ""/);
  assert.match(brandingForm, /const FALLBACK_MARK = ""/);
  assert.match(brandingForm, /No logo uploaded\. ShotLab will use the team initials in title stages\./);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(brandingScreenCss, /#root \.branding-industrial__preview \.branding-industrial__panel-header/);
  assert.match(brandingScreenCss, /background:transparent!important/);
  assert.match(brandingScreenCss, /border-radius:0!important/);
});

test("global defaults are neutral and Demo identity is explicit team data", () => {
  assert.match(brandingDefaults, /logoUrl:\s*""/);
  assert.match(brandingDefaults, /logoMarkUrl:\s*""/);
  assert.match(demoData, /name:\s*"Demo Titans"/);
});
