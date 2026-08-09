import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("src/App.jsx", "utf8");
const secondaryCss = readFileSync("src/components/SecondaryPageSystem.css", "utf8");
const branding = readFileSync("src/screens/CoachTeamBrandingScreen.jsx", "utf8");
const enhancer = readFileSync("scripts/apply-phase3h-coach-players-hierarchy.mjs", "utf8");

test("Coach navigation exposes rankings and team administration consistently", () => {
  assert.match(app, /\{k:"leaderboards",l:"Leaderboards"/);
  assert.match(app, /\{k:"settings",l:"Team & Account"/);
  assert.match(app, /getCoachNavItem\("leaderboards",\{mobileLabel:"Rankings"/);
  assert.match(app, /getCoachNavItem\("settings",\{mobileLabel:"Settings"/);
});

test("Players stays roster-focused while administration owns season and account tools", () => {
  const playersStart = app.indexOf('{tab==="players"&&!selP');
  const settingsStart = app.indexOf('{tab==="settings"');
  const playerDetailStart = app.indexOf('{tab==="players"&&selP', settingsStart);
  assert.ok(playersStart >= 0 && settingsStart > playersStart);
  assert.ok(playerDetailStart > settingsStart);

  const players = app.slice(playersStart, settingsStart);
  const settings = app.slice(settingsStart, playerDetailStart);
  assert.match(players, /<CoachRoster/);
  assert.match(players, /<CoachPlayerInviteForm/);
  assert.doesNotMatch(players, /coach-season-archive|<NewSeasonWizard|DEMO SETTINGS|LEGAL & SUPPORT|<AccountTrustActions/);

  assert.match(settings, /className="coachAdministrationWorkspace"/);
  assert.match(settings, /data-testid="coach-season-archive"/);
  assert.match(settings, /<CoachSeasonComparisonPanel/);
  assert.match(settings, /<NewSeasonWizard/);
  assert.match(settings, /DEMO SETTINGS/);
  assert.match(settings, /LEGAL & SUPPORT/);
  assert.match(settings, /<AccountTrustActions deleteAccount=\{deleteAccount\} preserveTeamData\/>/);
});

test("archive deep-links move into Team & Account instead of reopening Players", () => {
  assert.match(app, /onOpenArchives=\{\(\)=>setTab\("settings"\)\}/);
  assert.match(app, /onOpenArchive=\{\(archiveId\)=>\{setSelectedSeasonArchiveId\(archiveId\);setSelP\(null\);setTab\("settings"\);\}\}/);
  assert.match(enhancer, /coach-administration-workspace/);
  assert.doesNotMatch(enhancer, /coach-player-season-tools/);
});

test("Team & Account and Branding use the canonical editorial light workspace", () => {
  assert.match(secondaryCss, /\.coachAdministrationWorkspace\s*\{/);
  assert.match(secondaryCss, /\.coachAdministrationSection\s*\{/);
  assert.match(secondaryCss, /\.seasonArchiveDetail\s*\{/);
  assert.match(branding, /<SecondaryPageShell[^>]*className="brandingEditorialWorkspace"/);
  assert.match(branding, /<SecondaryPageIntro[^>]*eyebrow="Team identity system"/);
  assert.doesNotMatch(branding, /<AppHeader/);
});
