import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const app = read("src/App.jsx");
const stage = read("src/components/TeamIdentityTitleStage.jsx");
const authority = read("public/shotlab-team-identity-title-authority.css");
const coach = read("src/components/CoachCommandCenter.jsx");
const brandingContext = read("src/context/TeamBrandingContext.jsx");
const brandingBoundary = read("scripts/apply-team-identity-branding-boundary.mjs");
const secondaryMark = read("src/components/SecondaryTeamBrandMark.jsx");
const storeEntry = read("src/teamStoreEntry.jsx");

test("Coach Home removes the duplicated foreground crest without depending on a fragile mobile cascade", () => {
  assert.doesNotMatch(stage, /CoachHomeIdentityReconciliation\.css/);
  assert.match(authority, /coach-primary-objective/);
  assert.match(authority, /\.mcProgramIdentity,[\s\S]*\.mcHeroTeamMark\s*\{[\s\S]*display:\s*none\s*!important/);
  assert.match(authority, /\.mcHeroContent\s*\{[\s\S]*padding:\s*28px 18px 24px\s*!important/);
  assert.match(authority, /\.mcCourtArtwork\s*\{[\s\S]*opacity:\s*\.44\s*!important/);
  assert.match(brandingBoundary, /Foreground team identity is owned by the Coach header/);
  assert.match(brandingBoundary, /Coach Home duplicate Hero logo removal/);
  assert.match(brandingBoundary, /replaceIfPresent[\s\S]*mcProgramIdentity/);
});

test("registered team logos are branding-driven across shared product identity surfaces", () => {
  assert.match(brandingContext, /hasCustomLogo/);
  assert.match(stage, /branding\?\.logoUrl \|\| branding\?\.logoMarkUrl/);
  assert.match(secondaryMark, /branding\?\.logoUrl \|\| branding\?\.logoMarkUrl/);
  assert.match(brandingBoundary, /const FALLBACK_LOGO = ""/);
  assert.match(brandingBoundary, /const DEFAULT_MARK = ""/);
  assert.match(brandingBoundary, /customFullLogoSource/);
  assert.match(brandingBoundary, /customMarkLogoSource/);
  assert.match(brandingBoundary, /const fullLogoSource = customFullLogoSource \|\| customMarkLogoSource/);
  assert.match(brandingBoundary, /const markSource = customMarkLogoSource \|\| customFullLogoSource/);
  assert.match(brandingBoundary, /LEGACY_DEMO_FULL/);
  assert.match(brandingBoundary, /LEGACY_DEMO_MARK/);
  assert.match(coach, /cleanMarkLogoUrl/);
  assert.match(storeEntry, /team\?\.branding/);
  assert.match(storeEntry, /TeamBrandingProvider branding=\{branding\}/);
});

test("a custom full logo outranks a stale Demo mark on Coach Home", () => {
  const fullPrecedence = brandingBoundary.indexOf("const fullLogoSource = customFullLogoSource || customMarkLogoSource");
  const markPrecedence = brandingBoundary.indexOf("const markSource = customMarkLogoSource || customFullLogoSource");
  const demoFallback = brandingBoundary.indexOf("useDemoArtwork ?");
  assert.ok(fullPrecedence >= 0, "Expected full-logo custom precedence in the Coach branding boundary");
  assert.ok(markPrecedence >= 0, "Expected mark-logo custom precedence in the Coach branding boundary");
  assert.ok(demoFallback >= 0, "Expected explicit Demo-only artwork fallback");
  assert.match(brandingBoundary, /rawFullLogoSource !== LEGACY_DEMO_FULL/);
  assert.match(brandingBoundary, /rawMarkLogoSource !== LEGACY_DEMO_MARK/);
});

test("Demo hydration preserves custom artwork and removes the stale Titans counterpart", () => {
  assert.match(brandingBoundary, /demoHasCustomFullLogo/);
  assert.match(brandingBoundary, /demoHasCustomMarkLogo/);
  assert.match(brandingBoundary, /demoSanitizedBranding/);
  assert.match(brandingBoundary, /demoHasCustomFullLogo&&demoRawMarkLogo===demoLegacyMarkLogo\?\{logoMarkUrl:""\}/);
  assert.match(brandingBoundary, /demoHasCustomMarkLogo&&demoRawFullLogo===demoLegacyFullLogo\?\{logoUrl:""\}/);
  assert.match(brandingBoundary, /demoBrandingNeedsRepair/);
  assert.match(brandingBoundary, /demoHasCustomLogo\?\{\}:\{logoUrl:demoLegacyFullLogo,logoMarkUrl:demoLegacyMarkLogo\}/);
});

test("Demo Coach branding saves replace legacy Titans artwork instead of carrying it into Home", () => {
  assert.match(brandingBoundary, /Demo Coach branding save normalization/);
  assert.match(brandingBoundary, /if\(isDemoAccount\(user\)\)/);
  assert.match(brandingBoundary, /const hasCustomFull=Boolean\(incomingFull&&incomingFull!==legacyDemoFull\)/);
  assert.match(brandingBoundary, /const hasCustomMark=Boolean\(incomingMark&&incomingMark!==legacyDemoMark\)/);
  assert.match(brandingBoundary, /if\(hasCustomFull&&effectiveMark===legacyDemoMark\)incomingBranding\.logoMarkUrl=""/);
  assert.match(brandingBoundary, /if\(hasCustomMark&&effectiveFull===legacyDemoFull\)incomingBranding\.logoUrl=""/);
  assert.match(brandingBoundary, /\.\.\.incomingBranding/);
});

test("branding saves update the team record that feeds the shared provider", () => {
  assert.match(app, /const saveTeamBranding=async\(nextBranding\)=>/);
  assert.match(app, /\.\.\.\(nextBranding\|\|\{\}\)/);
  assert.match(app, /const nextTeams=teams\.map\(t=>t\.id===team\.id\?\{\.\.\.t,branding:mergedBranding\}:t\)/);
  assert.match(app, /await P\("sl:teams",nextTeams,setTeams\)/);
  assert.match(app, /<TeamBrandingProvider branding=\{resolvedTeamBranding\}>/);
});

test("Titans artwork remains Demo seed data, not a registered-team fallback", () => {
  assert.match(brandingBoundary, /Demo Titans/);
  assert.match(brandingBoundary, /neutral Coach Mission Control logo fallback/);
  assert.doesNotMatch(authority, /titans-exact-logo|titans-default-mark/i);
});
