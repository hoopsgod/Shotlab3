import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const stage = read("src/components/TeamIdentityTitleStage.jsx");
const css = read("src/components/TeamIdentityTitleStage.css");
const authority = read("src/components/TeamIdentityTitleStageAuthority.css");
const secondary = read("src/components/SecondaryPageSystem.jsx");
const playerHeader = read("src/components/PlayerDashboardHeader.jsx");
const coachHeader = read("src/components/CoachDashboardHeader.jsx");
const playerWorkspace = read("src/components/PlayerOperationalWorkspace.jsx");
const progressStory = read("src/components/PlayerProgressStory.jsx");
const trainingHeader = read("src/components/PlayerTrainingSessionHeader.jsx");
const brandingPreview = read("src/components/team/TeamBrandingPreview.jsx");
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

test("mobile crest geometry is materially larger without destructive cropping", () => {
  assert.match(css, /--identity-crest:\s*clamp\(88px,\s*24vw,\s*104px\)/);
  assert.match(css, /--identity-crest:\s*clamp\(104px,\s*29vw,\s*120px\)/);
  assert.match(css, /object-fit:\s*contain/);
  assert.doesNotMatch(css, /object-fit:\s*cover/);
  assert.match(css, /--identity-tonal:\s*clamp/);
  assert.match(trainingHeader, /teamCrest/);
});

test("late mobile route enhancers cannot collapse migrated team-title geometry", () => {
  assert.match(stage, /TeamIdentityTitleStageAuthority\.css/);
  assert.match(authority, /secondaryPageIntro\.teamIdentityTitleStage/);
  assert.match(authority, /width: var\(--identity-crest\) !important/);
  assert.match(authority, /font-size: var\(--identity-title\) !important/);
  assert.match(authority, /display: block !important/);
});

test("team colors remain decorative while semantic status stays protected", () => {
  assert.match(css, /--team-brand-primary/);
  assert.match(css, /--team-brand-secondary/);
  assert.match(css, /var\(--semantic-neutral/);
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
});

test("Program Branding previews the real production title component", () => {
  const occurrences = (brandingPreview.match(/TeamIdentityTitleStage/g) || []).length;
  assert.ok(occurrences >= 3, "expected import plus Coach and Player title previews");
  assert.match(brandingPreview, /TeamBrandingProvider branding=\{branding\}/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("global defaults are program-neutral and the authoritative team name is merged at runtime", () => {
  assert.match(brandingDefaults, /logoUrl:\s*""/);
  assert.match(brandingDefaults, /logoMarkUrl:\s*""/);
  assert.doesNotMatch(brandingDefaults, /titans/i);
  assert.match(brandingBoundary, /teamName:myTeam\?\.branding\?\.teamName\|\|myTeam\?\.name\|\|"Your Team"/);
  assert.match(brandingBoundary, /name: "Demo Titans"/);
  assert.match(brandingBoundary, /logoUrl: "\/branding\/titans-exact-logo\.png\.PNG"/);
  assert.match(brandingBoundary, /No logo uploaded\. ShotLab will use the team initials in title stages\./);
  assert.match(routeEnhancers, /scripts\/apply-team-identity-branding-boundary\.mjs/);
});
