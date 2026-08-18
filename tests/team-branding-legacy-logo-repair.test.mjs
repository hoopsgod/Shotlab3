import test from "node:test";
import assert from "node:assert/strict";

import resolveTeamBranding from "../src/theme/resolveTeamBranding.js";
import { DEFAULT_BRANDING } from "../src/theme/brandingDefaults.js";

test("legacy placeholder full-logo paths resolve to the canonical Titans demo logo", () => {
  for (const legacyLogo of [
    "/branding/titans-default-mark.svg",
    "/branding/titans-default-mark-free.svg",
    "/branding/titans-default-mark.svg?v=stale",
  ]) {
    const branding = resolveTeamBranding({
      logoUrl: legacyLogo,
      logoMarkUrl: DEFAULT_BRANDING.logoMarkUrl,
    });

    assert.equal(branding.logoUrl, DEFAULT_BRANDING.logoUrl);
    assert.equal(branding.logoMarkUrl, DEFAULT_BRANDING.logoMarkUrl);
  }
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

test("missing full-logo data still resolves through the canonical branding default", () => {
  const branding = resolveTeamBranding({ logoUrl: "" });

  assert.equal(branding.logoUrl, DEFAULT_BRANDING.logoUrl);
  assert.equal(branding.logoMarkUrl, DEFAULT_BRANDING.logoMarkUrl);
});
