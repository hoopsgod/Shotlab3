import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const model = fs.readFileSync("src/lib/playerCareerHistory.js", "utf8");
const component = fs.readFileSync("src/components/PlayerCareerHistory.jsx", "utf8");
const styles = fs.readFileSync("src/components/PlayerCareerHistory.module.css", "utf8");
const app = fs.readFileSync("src/App.jsx", "utf8");
const route = fs.readFileSync("functions/v1/season-archives/index.js", "utf8");

test("career model reads immutable archives without adding a persistence path", () => {
  assert.match(model, /seasonArchives/);
  assert.match(model, /playerSeasonSummaries/);
  assert.match(model, /deriveArchiveSummary/);
  assert.doesNotMatch(model, /fetch\(/);
  assert.doesNotMatch(model, /localStorage|insertRows|updateRows|upsertRows/);
});

test("career model preserves identity, team, and completed-season boundaries", () => {
  assert.match(model, /profileId/);
  assert.match(model, /userId/);
  assert.match(model, /playerId/);
  assert.match(model, /return teamIdOf\(row\) === normalizedTeamId/);
  assert.match(model, /identity\.hasStableIdentity/);
  assert.match(model, /Generic activity-row IDs are deliberately excluded/);
  assert.match(model, /filterLiveRowsOutsideArchivedSeasons/);
});

test("career calculations never combine unlike drill scores with shooting makes", () => {
  assert.match(model, /totalShootingMakes/);
  assert.match(model, /programEntryCount/);
  assert.match(model, /shootingMakes: homeMakes \+ shotLogMakes/);
  assert.doesNotMatch(model, /trainingTotal: homeMakes \+ programScore \+ shotLogMakes/);
  assert.match(component, /Career shooting makes/);
  assert.match(component, /Program entries/);
});

test("shared UI exposes totals, comparison, records, seasons, and accessible archive actions", () => {
  assert.match(component, /data-testid="player-career-history"/);
  assert.match(component, /Career History/);
  assert.match(component, /Current season vs last archive/);
  assert.match(component, /Personal records/);
  assert.match(component, /Season by season/);
  assert.match(component, /aria-label=\{`View archive/);
  assert.match(styles, /min-height:\s*44px/);
});

test("coach and player surfaces use the same career component", () => {
  assert.match(app, /import PlayerCareerHistory/);
  assert.match(app, /viewerRole="player"/);
  assert.match(app, /viewerRole="coach"/);
  assert.match(app, /seasonArchives=\{seasonArchives\}/);
  assert.match(app, /setSelectedSeasonArchiveId\(archiveId\);setSelP\(null\)/);
});

test("registered players receive only self-scoped archives through signed authentication", () => {
  assert.match(route, /readAuthenticatedIdentity/);
  assert.match(route, /collectTeamPriorityAccess/);
  assert.match(route, /playerArchiveProjection/);
  assert.match(route, /accessMode:\s*"player_self"/);
  assert.match(route, /writableTeamIds\.has\(teamId\)/);
  assert.doesNotMatch(route, /readUserId/);
});
