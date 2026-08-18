import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const app = read("src/App.jsx");
const stage = read("src/components/TeamIdentityTitleStage.jsx");
const reconciliation = read("src/components/CoachHomeIdentityReconciliation.css");
const coach = read("src/components/CoachCommandCenter.jsx");
const brandingContext = read("src/context/TeamBrandingContext.jsx");
const brandingBoundary = read("scripts/apply-team-identity-branding-boundary.mjs");
const secondaryMark = read("src/components/SecondaryTeamBrandMark.jsx");
const storeEntry = read("src/teamStoreEntry.jsx");

test("Coach Home removes the duplicated foreground crest on mobile without removing team identity", () => {
  assert.match(stage, /CoachHomeIdentityReconciliation\.css/);
  assert.match(reconciliation, /coach-primary-objective/);
  assert.match(reconciliation, /\.mcHeroTeamMark\s*\{[\s\S]*display:\s*none\s*!important/);
  assert.match(reconciliation, /\.mcProgramIdentity\s*\{[\s\S]*display:\s*none\s*!important/);
  assert.match(reconciliation, /\.mcHeroContent\s*\{[\s\S]*padding:\s*28px 18px 24px\s*!important/);
  assert.match(coach, /<CourtArtwork logoUrl=\{cleanMarkLogoUrl\}/);
  assert.match(coach, /mcHeaderTeamMark[\s\S]*cleanMarkLogoUrl/);
});

test("registered team logos are branding-driven across shared product identity surfaces", () => {
  assert.match(brandingContext, /hasCustomLogo/);
  assert.match(stage, /branding\?\.logoUrl \|\| branding\?\.logoMarkUrl/);
  assert.match(secondaryMark, /branding\?\.logoUrl \|\| branding\?\.logoMarkUrl/);
  assert.match(brandingBoundary, /const FALLBACK_LOGO = ""/);
  assert.match(brandingBoundary, /const DEFAULT_MARK = ""/);
  assert.match(coach, /const fullLogoSource = branding\?\.logoUrl \|\| FALLBACK_LOGO/);
  assert.match(coach, /const markSource = branding\?\.logoMarkUrl/);
  assert.match(coach, /cleanMarkLogoUrl/);
  assert.match(storeEntry, /team\?\.branding/);
  assert.match(storeEntry, /TeamBrandingProvider branding=\{branding\}/);
});

test("branding saves update the team record that feeds the shared provider", () => {
  assert.match(app, /const saveTeamBranding=async\(nextBranding\)=>/);
  assert.match(app, /\.\.\.\(nextBranding\|\|\{\}\)/);
  assert.match(app, /const nextTeams=teams\.map\(t=>t\.id===team\.id\?\{\.\.\.t,branding:mergedBranding\}:t\)/);
  assert.match(app, /await P\("sl:teams",nextTeams,setTeams\)/);
  assert.match(app, /<TeamBrandingProvider branding=\{resolvedTeamBranding\}>/);
});

test("Titans artwork remains demo seed data, not a registered-team fallback", () => {
  assert.match(brandingBoundary, /Demo Titans/);
  assert.match(brandingBoundary, /neutral Coach Mission Control logo fallback/);
  assert.doesNotMatch(reconciliation, /titans-exact-logo|titans-default-mark/i);
});
