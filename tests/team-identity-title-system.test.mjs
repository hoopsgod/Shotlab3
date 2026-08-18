import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const stage = read("src/components/TeamIdentityTitleStage.jsx");
const css = read("src/components/TeamIdentityTitleStage.css");
const secondary = read("src/components/SecondaryPageSystem.jsx");
const playerHeader = read("src/components/PlayerDashboardHeader.jsx");
const coachHeader = read("src/components/CoachDashboardHeader.jsx");
const playerWorkspace = read("src/components/PlayerOperationalWorkspace.jsx");
const brandingPreview = read("src/components/team/TeamBrandingPreview.jsx");

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
});

test("mobile crest geometry is materially larger without destructive cropping", () => {
  assert.match(css, /--identity-crest:\s*clamp\(88px,\s*24vw,\s*104px\)/);
  assert.match(css, /--identity-crest:\s*clamp\(104px,\s*29vw,\s*120px\)/);
  assert.match(css, /object-fit:\s*contain/);
  assert.doesNotMatch(css, /object-fit:\s*cover/);
  assert.match(css, /--identity-tonal:\s*clamp/);
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
