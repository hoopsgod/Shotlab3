import test from "node:test";
import assert from "node:assert/strict";

import resolveTeamBranding from "../src/theme/resolveTeamBranding.js";
import { DEFAULT_BRANDING } from "../src/theme/brandingDefaults.js";

test("bundled Titans logo paths are removed from non-demo team branding", () => {
  for (const legacyLogo of [
    "/branding/titans-default-mark.svg",
    "/branding/titans-default-mark-free.svg",
    "/branding/titans-default-mark.svg?v=stale",
    DEFAULT_BRANDING.logoUrl,
  ]) {
    const branding = resolveTeamBranding({
      teamName: "Registered Team",
      logoUrl: legacyLogo,
      logoMarkUrl: DEFAULT_BRANDING.logoMarkUrl,
    });

    assert.equal(branding.logoUrl, "");
    assert.equal(branding.logoMarkUrl, "");
  }
});

test("Demo Titans keeps the canonical bundled demo identity", () => {
  const branding = resolveTeamBranding({
    teamName: "Demo Titans",
    logoUrl: DEFAULT_BRANDING.logoUrl,
    logoMarkUrl: DEFAULT_BRANDING.logoMarkUrl,
  });

  assert.equal(branding.logoUrl, DEFAULT_BRANDING.logoUrl);
  assert.equal(branding.logoMarkUrl, DEFAULT_BRANDING.logoMarkUrl);
});

test("custom team logos remain untouched by the legacy repair", () => {
  const customLogo = "data:image/png;base64,custom-team-logo";
  const customMark = "data:image/svg+xml;base64,custom-team-mark";
  const branding = resolveTeamBranding({
    logoUrl: customLogo,
    logoMarkUrl: customMark,
  });

  assert.equal(branding.logoUrl, customLogo);
  assert.equal(branding.logoMarkUrl, customMark);
});

test("missing team-logo data remains unconfigured until a coach adds branding", () => {
  const branding = resolveTeamBranding({ logoUrl: "", logoMarkUrl: "" });

  assert.equal(branding.logoUrl, "");
  assert.equal(branding.logoMarkUrl, "");
});