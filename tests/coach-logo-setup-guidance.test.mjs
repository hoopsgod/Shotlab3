import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import resolveTeamBranding from "../src/theme/resolveTeamBranding.js";

const titleStageSource = await readFile(new URL("../src/components/TeamIdentityTitleStage.jsx", import.meta.url), "utf8");
const commandCenterSource = await readFile(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const providerSource = await readFile(new URL("../src/branding/TeamBrandingProvider.tsx", import.meta.url), "utf8");
const demoDataSource = await readFile(new URL("../src/lib/demoData.js", import.meta.url), "utf8");

const PROMPT = "Click here to add your custom team logo";

test("registered teams without branding remain logo-unconfigured", () => {
  const branding = resolveTeamBranding({ teamName: "Webster Thomas" });
  assert.equal(branding.logoUrl, "");
  assert.equal(branding.logoMarkUrl, "");
  assert.match(providerSource, /resolveTeamBranding\(branding \|\| \{\}\)/);
});

test("Demo Titans owns its logo as explicit demo data instead of a global fallback", () => {
  assert.match(demoDataSource, /teamName: "Demo Titans"/);
  assert.match(demoDataSource, /logoUrl: "\/branding\/titans-exact-logo\.png\.PNG"/);
  assert.match(demoDataSource, /logoMarkUrl: "\/branding\/titans-default-mark\.svg"/);
});

test("shared Coach title stages replace missing logos with an actionable Branding prompt", () => {
  assert.match(titleStageSource, new RegExp(PROMPT));
  assert.match(titleStageSource, /data-identity-role="brand-setup"/);
  assert.match(titleStageSource, /brandingAction\?\.onClick/);
  assert.match(titleStageSource, /coach-dashboard-identity-header/);
});

test("Mission Control exposes the same Branding prompt in every Coach logo placement", () => {
  assert.match(commandCenterSource, new RegExp(PROMPT));
  assert.match(commandCenterSource, /mcRailLogoSetup/);
  assert.match(commandCenterSource, /mcHeaderLogoSetup/);
  assert.match(commandCenterSource, /mcHeroLogoSetup/);
  assert.match(commandCenterSource, /mcDrawerLogoSetup/);
  assert.match(commandCenterSource, /const openBrandingSettings = \(\) =>/);
  assert.match(commandCenterSource, /coach-dashboard-identity-header/);
});