import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import resolveTeamBranding from "../src/theme/resolveTeamBranding.js";
import { DEFAULT_BRANDING } from "../src/theme/brandingDefaults.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const appSource = fs.readFileSync(path.join(here, "../src/App.jsx"), "utf8");
const titleStageSource = fs.readFileSync(path.join(here, "../src/components/TeamIdentityTitleStage.jsx"), "utf8");
const hierarchyCss = fs.readFileSync(path.join(here, "../src/components/TeamIdentityBrandHierarchy.css"), "utf8");
const playerHeaderSource = fs.readFileSync(path.join(here, "../src/components/PlayerDashboardHeader.jsx"), "utf8");
const playerHeaderCss = fs.readFileSync(path.join(here, "../src/components/PlayerDashboardHeader.css"), "utf8");

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

test("Player Home wide-name rules stay inside the Player workspace styling boundary", () => {
  assert.match(playerHeaderSource, /import "\.\/PlayerDashboardHeader\.css";/);
  assert.doesNotMatch(hierarchyCss, /playerDashboardIdentityStage/);
});

test("wide Player Home identities retain lexical wrapping authority across mobile", () => {
  assert.match(titleStageSource, /const wideTitleWord = longestWordLength >= 10;/);
  assert.match(titleStageSource, /wideTitleWord \? "teamIdentityTitleStage--wideWord" : ""/);
  assert.match(
    playerHeaderCss,
    /@media \(max-width: 760px\)[\s\S]*?\.playerDashboardIdentityStage\.teamIdentityTitleStage--hero\.teamIdentityTitleStage--wideWord \.teamIdentityTitleStage__title\s*\{[\s\S]*?overflow-wrap:\s*normal;[\s\S]*?word-break:\s*normal;[\s\S]*?hyphens:\s*none;/,
  );
});

test("wide Player Home crest separation is content-sensitive at the narrow collision interval", () => {
  assert.match(
    playerHeaderCss,
    /@media \(max-width: 360px\)[\s\S]*?\.playerDashboardIdentityStage\.teamIdentityTitleStage--hero\.teamIdentityTitleStage--wideWord \.teamIdentityTitleStage__crestSlot\s*\{[\s\S]*?transform:\s*translateY\(18px\);/,
  );
  assert.doesNotMatch(playerHeaderCss, /@media \(max-width: 360px\)[\s\S]*?\.playerDashboardIdentityStage\.teamIdentityTitleStage--hero(?!\.teamIdentityTitleStage--wideWord)[^\{]*\.teamIdentityTitleStage__crestSlot/);
});

test("extreme-small Player Home preserves wide lexical identity without shrinking the crest", () => {
  assert.match(playerHeaderCss, /@media \(max-width: 350px\)/);
  assert.match(playerHeaderCss, /\.playerDashboardIdentityStage\.teamIdentityTitleStage--hero\.teamIdentityTitleStage--wideWord \.teamIdentityTitleStage__title/);
  assert.match(playerHeaderCss, /width: calc\(100% \+ var\(--identity-crest\) \+ 16px\)/);
  assert.match(playerHeaderCss, /max-width: calc\(100% \+ var\(--identity-crest\) \+ 16px\)/);
  assert.doesNotMatch(playerHeaderCss, /--identity-crest:\s*(?:[0-9]|[1-9][0-9])px/);
});
