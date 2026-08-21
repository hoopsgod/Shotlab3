import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import resolveTeamBranding from "../src/theme/resolveTeamBranding.js";
import { DEFAULT_BRANDING } from "../src/theme/brandingDefaults.js";

const titleStageSource = await readFile(new URL("../src/components/TeamIdentityTitleStage.jsx", import.meta.url), "utf8");
const commandCenterSource = await readFile(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const providerSource = await readFile(new URL("../src/branding/TeamBrandingProvider.tsx", import.meta.url), "utf8");
const runtimeContextSource = await readFile(new URL("../src/context/TeamBrandingContext.jsx", import.meta.url), "utf8");
const demoDataSource = await readFile(new URL("../src/lib/demoData.js", import.meta.url), "utf8");

test("registered teams without branding remain logo-unconfigured", () => {
  const branding = resolveTeamBranding({ teamName: "Webster Thomas" });
  assert.equal(branding.logoUrl, "");
  assert.equal(branding.logoMarkUrl, "");
  assert.match(providerSource, /resolveTeamBranding\(branding \|\| \{\}\)/);
  assert.match(runtimeContextSource, /resolveTeamBranding\(branding \|\| \{\}\)/);
});

test("historical bundled Titans defaults cannot leak into registered team branding", () => {
  const branding = resolveTeamBranding({
    teamName: "Registered Team",
    logoUrl: DEFAULT_BRANDING.logoUrl,
    logoMarkUrl: DEFAULT_BRANDING.logoMarkUrl,
  });
  assert.equal(branding.logoUrl, "");
  assert.equal(branding.logoMarkUrl, "");
});

test("Demo Titans owns its logo as explicit demo data instead of a global fallback", () => {
  assert.match(demoDataSource, /teamName: "Demo Titans"/);
  assert.match(demoDataSource, /logoUrl: "\/branding\/titans-exact-logo\.png\.PNG"/);
  assert.match(demoDataSource, /logoMarkUrl: "\/branding\/titans-default-mark\.svg"/);
  const branding = resolveTeamBranding({
    teamName: "Demo Titans",
    logoUrl: DEFAULT_BRANDING.logoUrl,
    logoMarkUrl: DEFAULT_BRANDING.logoMarkUrl,
  });
  assert.equal(branding.logoUrl, DEFAULT_BRANDING.logoUrl);
  assert.equal(branding.logoMarkUrl, DEFAULT_BRANDING.logoMarkUrl);
});

test("shared Coach title stages replace missing logos with an actionable premium monogram", () => {
  assert.match(titleStageSource, /showLogoSetupAction/);
  assert.match(titleStageSource, /data-identity-role="brand-fallback"/);
  assert.match(titleStageSource, /data-team-logo-fallback=\{fallbackInitials\}/);
  assert.match(titleStageSource, />Add logo<\/span>/);
  assert.doesNotMatch(titleStageSource, /Click here to add your custom team logo/);
  assert.match(titleStageSource, /brandingAction\?\.onClick/);
  assert.match(titleStageSource, /data-nav-key=\\?"branding\\?"/);
  assert.match(titleStageSource, /mobile-navigation-more/);
  assert.match(titleStageSource, /coach-dashboard-identity-header/);
});

test("Mission Control exposes the same premium monogram affordance in every Coach logo placement", () => {
  assert.match(commandCenterSource, /data-team-logo-fallback=\{mark\}/);
  assert.match(commandCenterSource, /<strong>\{mark\}<\/strong><small>Add logo<\/small>/);
  assert.doesNotMatch(commandCenterSource, /Click here to add your custom team logo/);
  assert.match(commandCenterSource, /mcRailLogoSetup/);
  assert.match(commandCenterSource, /mcHeaderLogoSetup/);
  assert.match(commandCenterSource, /mcHeroLogoSetup/);
  assert.match(commandCenterSource, /mcDrawerLogoSetup/);
  assert.match(commandCenterSource, /const openBrandingSettings = \(\) =>/);
  assert.match(commandCenterSource, /coach-dashboard-identity-header/);
});