import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import resolveTeamBranding from "../src/theme/resolveTeamBranding.js";
import { DEFAULT_BRANDING } from "../src/theme/brandingDefaults.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const appSource = fs.readFileSync(path.join(here, "../src/App.jsx"), "utf8");
const hierarchyCss = fs.readFileSync(path.join(here, "../src/components/TeamIdentityBrandHierarchy.css"), "utf8");

test("registered team identity is injected at the shared branding authority boundary", () => {
  assert.match(appSource, /myTeam\?\.name\?\{teamName:myTeam\.name\}:\{\}/);
});

test("real registered identity does not inherit the bundled Demo Titans crest", () => {
  const resolved = resolveTeamBranding({ ...DEFAULT_BRANDING, teamName: "Webster Thomas" });
  assert.equal(resolved.teamName, "Webster Thomas");
  assert.equal(resolved.logoUrl, "");
  assert.equal(resolved.logoMarkUrl, "");
});

test("custom registered branding remains authoritative", () => {
  const resolved = resolveTeamBranding({
    ...DEFAULT_BRANDING,
    teamName: "Webster Thomas",
    primaryColor: "#123456",
    accentColor: "#abcdef",
    logoUrl: "https://cdn.example.com/custom-team-logo.png",
    logoMarkUrl: "https://cdn.example.com/custom-team-mark.png",
  });
  assert.equal(resolved.teamName, "Webster Thomas");
  assert.equal(resolved.primaryColor, "#123456");
  assert.equal(resolved.accentColor, "#abcdef");
  assert.match(resolved.logoUrl, /^https:\/\/cdn\.example\.com\/custom-team-logo\.png/);
  assert.match(resolved.logoMarkUrl, /^https:\/\/cdn\.example\.com\/custom-team-mark\.png/);
});

test("Demo Titans retains the bundled Demo identity", () => {
  const resolved = resolveTeamBranding({ ...DEFAULT_BRANDING, teamName: "Demo Titans" });
  assert.equal(resolved.teamName, "Demo Titans");
  assert.match(resolved.logoUrl, /titans-exact-logo/);
  assert.match(resolved.logoMarkUrl, /titans-default-mark/);
});

test("extreme-small Player Home preserves lexical identity without shrinking the crest", () => {
  assert.match(hierarchyCss, /@media \(max-width: 350px\)/);
  assert.match(hierarchyCss, /\.playerDashboardIdentityStage\.teamIdentityTitleStage--hero \.teamIdentityTitleStage__title/);
  assert.match(hierarchyCss, /width: calc\(100% \+ var\(--identity-crest\) \+ 16px\)/);
  assert.match(hierarchyCss, /overflow-wrap: normal;/);
  assert.match(hierarchyCss, /word-break: normal;/);
  assert.match(hierarchyCss, /hyphens: none;/);
  assert.doesNotMatch(hierarchyCss, /\.playerDashboardIdentityStage[^}]*--identity-crest:\s*(?:[0-9]|[1-9][0-9])px/s);
});
