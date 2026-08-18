import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const stage = read("src/components/TeamIdentityTitleStage.jsx");
const css = read("src/components/TeamIdentityTitleStage.css");
const renderedAuthority = read("public/shotlab-team-identity-title-authority.css");
const secondary = read("src/components/SecondaryPageSystem.jsx");
const secondaryCss = read("src/components/SecondaryPageSystem.css");
const playerHeader = read("src/components/PlayerDashboardHeader.jsx");
const coachHeader = read("src/components/CoachDashboardHeader.jsx");
const playerWorkspace = read("src/components/PlayerOperationalWorkspace.jsx");
const progressStory = read("src/components/PlayerProgressStory.jsx");
const trainingHeader = read("src/components/PlayerTrainingSessionHeader.jsx");
const brandingPreview = read("src/components/team/TeamBrandingPreview.jsx");
const brandingForm = read("src/components/team/TeamBrandingForm.jsx");
const brandingDefaults = read("src/theme/brandingDefaults.js");
const brandingBoundary = read("scripts/apply-team-identity-branding-boundary.mjs");
const routeEnhancers = read("scripts/run-route-enhancers.mjs");

test("team identity title stage is the shared Coach and Player title primitive", () => {
  assert.match(stage, /data-team-identity-stage="true"/);
  assert.match(stage, /useCleanTeamLogo/);
  assert.match(stage, /teamIdentityTitleStage__tonalCrest/);
  assert.match(stage, /aria-hidden="true"/);
  assert.match(stage, /teamIdentityTitleStage__fallbackCrest/);
  assert.match(secondary, /TeamIdentityTitleStage/);
  assert.match(playerHeader, /TeamIdentityTitleStage/);
  assert.match(coachHeader, /TeamIdentityTitleStage/);
  assert.match(playerWorkspace, /TeamIdentityTitleStage/);
  assert.match(progressStory, /TeamIdentityTitleStage/);
});

test("finite title variants are literal source classes so production pruning cannot erase them", () => {
  assert.match(stage, /variant === "hero" \? "teamIdentityTitleStage--hero" : "teamIdentityTitleStage--standard"/);
  assert.match(stage, /surface === "dark" \? "teamIdentityTitleStage--dark" : "teamIdentityTitleStage--light"/);
  assert.doesNotMatch(stage, /`teamIdentityTitleStage--\$\{variant\}`/);
  assert.doesNotMatch(stage, /`teamIdentityTitleStage--\$\{surface\}`/);
});

test("mobile crest geometry is materially larger without destructive cropping", () => {
  assert.match(css, /--identity-crest:\s*clamp\(96px,\s*25vw,\s*108px\)/);
  assert.match(css, /--identity-crest:\s*clamp\(104px,\s*29vw,\s*120px\)/);
  assert.match(css, /object-fit:\s*contain/);
  assert.doesNotMatch(css, /object-fit:\s*cover/);
  assert.match(css, /--identity-tonal:\s*clamp/);
  assert.match(trainingHeader, /teamCrest/);
});

test("team crest and Player Home hero are isolated from legacy secondary-route authority", () => {
  assert.match(stage, /className="teamIdentityTitleStage__crestSlot" data-identity-role="brand-panel"/);
  assert.doesNotMatch(stage, /teamIdentityTitleStage__crestSlot secondaryPageIntro__icon/);
  assert.match(css, /performance-shell--player\.is-mobile:not\(\[data-workspace-tab="home"\]\)[\s\S]*player-dashboard-identity-header/);
  assert.match(css, /player-dashboard-identity-header[^\{]*\{\s*display:\s*none\s*!important/);
});

test("late title authority owns mobile secondary geometry after legacy appHeader rules", () => {
  assert.match(renderedAuthority, /secondaryPageIntro\.teamIdentityTitleStage\[data-team-identity-stage="true"\]/);
  assert.match(renderedAuthority, /display:\s*block\s*!important/);
  assert.match(renderedAuthority, /grid-template-columns:\s*minmax\(0,1fr\)\s*var\(--identity-crest\)\s*!important/);
  assert.match(renderedAuthority, /min-width:\s*var\(--identity-crest\)\s*!important/);
});

test("one last public presentation layer remains a supplemental final authority", () => {
  assert.doesNotMatch(stage, /TeamIdentityTitleStageAuthority\.css/);
  assert.match(renderedAuthority, /final rendered authority/i);
  assert.match(renderedAuthority, /secondaryPageIntro\.teamIdentityTitleStage/);
  assert.match(renderedAuthority, /--identity-crest:\s*clamp\(104px, 29vw, 120px\) !important/);
  assert.match(renderedAuthority, /font-size: var\(--identity-title\) !important/);
  assert.match(renderedAuthority, /object-fit: contain !important/);
  assert.match(brandingBoundary, /shotlab-team-identity-title-authority/);
});

test("team colors remain decorative while semantic status stays protected", () => {
  assert.match(css, /--team-brand-primary/);
  assert.match(css, /--team-brand-secondary/);
  const statusRule = secondaryCss.match(/\.secondaryPageIntro__status\s*\{[^}]*\}/)?.[0] || "";
  assert.match(statusRule, /color:\s*#536057/);
  assert.match(statusRule, /background:\s*transparent/);
  assert.doesNotMatch(statusRule, /--team-brand-/);
  assert.doesNotMatch(css, /background:\s*var\(--team-brand-primary[^\n]*!important;\s*\/\*\s*status/i);
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
});

test("global defaults are neutral and Demo identity is explicit team data", () => {
  assert.match(brandingDefaults, /logoUrl:\s*""/);
  assert.match(brandingDefaults, /logoMarkUrl:\s*""/);
  assert.doesNotMatch(brandingDefaults, /titans/i);
  assert.match(brandingBoundary, /teamName:myTeam\?\.branding\?\.teamName\|\|myTeam\?\.name\|\|"Your Team"/);
  assert.match(brandingBoundary, /name:\?"Demo Titans"|name:"Demo Titans"|name: "Demo Titans"/);
  assert.match(brandingBoundary, /logoUrl:\?"\/branding\/titans-exact-logo\.png\.PNG"|logoUrl:"\/branding\/titans-exact-logo\.png\.PNG"|logoUrl: "\/branding\/titans-exact-logo\.png\.PNG"/);
  assert.match(routeEnhancers, /scripts\/apply-team-identity-branding-boundary\.mjs/);
});

test("Coach Home integrates program identity into Mission Control rather than stacking a second hero", () => {
  assert.match(brandingBoundary, /mcProgramIdentity/);
  assert.match(brandingBoundary, /mcTeamFallback/);
  assert.match(renderedAuthority, /Coach Home — the existing Mission Control decision surface becomes the immersive team Hero variant/);
  assert.match(renderedAuthority, /coach-dashboard-identity-header[\s\S]*display: none !important/);
  assert.match(renderedAuthority, /mcHeroTeamMark[\s\S]*clamp\(112px,30vw,128px\)/);
});
