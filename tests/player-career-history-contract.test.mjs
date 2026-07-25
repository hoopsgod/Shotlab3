import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const model = fs.readFileSync("src/lib/playerCareerHistory.js", "utf8");
const component = fs.readFileSync("src/components/PlayerCareerHistory.jsx", "utf8");
const app = fs.readFileSync("src/App.jsx", "utf8");

test("career model reads immutable archives without adding a persistence path", () => {
  assert.match(model, /seasonArchives/);
  assert.match(model, /playerSeasonSummaries/);
  assert.match(model, /deriveArchiveSummary/);
  assert.doesNotMatch(model, /fetch\(/);
  assert.doesNotMatch(model, /localStorage|insertRows|updateRows|upsertRows/);
});

test("career model preserves stable identity and strict team boundaries", () => {
  assert.match(model, /profileId/);
  assert.match(model, /userId/);
  assert.match(model, /playerId/);
  assert.match(model, /return teamIdOf\(row\) === normalizedTeamId/);
  assert.match(model, /identity\.hasStableIdentity/);
  assert.match(model, /Generic activity-row IDs are deliberately excluded/);
});

test("career calculations never combine unlike drill scores with shooting makes", () => {
  assert.match(model, /totalShootingMakes/);
  assert.match(model, /programEntryCount/);
  assert.match(model, /shootingMakes: homeMakes \+ shotLogMakes/);
  assert.doesNotMatch(model, /trainingTotal: homeMakes \+ programScore \+ shotLogMakes/);
  assert.doesNotMatch(component, /Career Training/);
  assert.match(component, /Career Shooting Makes/);
  assert.match(component, /Program Entries/);
});

test("shared UI exposes career totals, improvement, records, and season rows", () => {
  assert.match(component, /data-testid="player-career-history"/);
  assert.match(component, /CAREER HISTORY/);
  assert.match(component, /Season-over-season shooting/);
  assert.match(component, /Personal records/);
  assert.match(component, /Season by season/);
  assert.match(component, /VIEW ARCHIVE/);
  assert.match(component, /immutable season archives/i);
});

test("coach and player surfaces use the same career component", () => {
  assert.match(app, /import PlayerCareerHistory/);
  assert.match(app, /viewerRole="player"/);
  assert.match(app, /viewerRole="coach"/);
  assert.match(app, /seasonArchives=\{seasonArchives\}/);
  assert.match(app, /onOpenArchive=\{\(archiveId\)=>\{setSelectedSeasonArchiveId\(archiveId\);setSelP\(null\);\}\}/);
});
