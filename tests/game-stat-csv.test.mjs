import test from "node:test";
import assert from "node:assert/strict";
import { buildGameStatCsvPreview, parseCsvText, parseStatNumber } from "../src/lib/gameStatCsv.js";
import { buildGameStatIntelligence } from "../src/lib/gameStatAnalytics.js";

test("CSV parser preserves quoted commas and percentage values", () => {
  const parsed = parseCsvText('Name,Opponent,PTS,FG%\n"Doe, Jane","Brighton, HS",18,47.5%\n');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.records[0].values.Name, "Doe, Jane");
  assert.equal(parsed.records[0].values.Opponent, "Brighton, HS");
  assert.equal(parseStatNumber(parsed.records[0].values["FG%"]), 47.5);
});

test("season-total preview roster-matches by unique player identity and detects numeric metrics", () => {
  const preview = buildGameStatCsvPreview({
    csvText: "Player,Jersey,PTS,REB,FG%\nAva Stone,12,211,93,48.6%\nMia Cole,4,175,81,44.2%\n",
    roster: [
      { id: "p1", name: "Ava Stone", jersey_number: "12", email: "ava@example.com" },
      { id: "p2", name: "Mia Cole", jersey_number: "4", email: "mia@example.com" },
    ],
    importKind: "season_total",
  });
  assert.equal(preview.ok, true);
  assert.equal(preview.canCommit, true);
  assert.equal(preview.matchedRows, 2);
  assert.deepEqual(preview.statDefinitions.map((row) => row.key), ["pts", "reb", "fgpct"]);
  assert.equal(preview.statDefinitions.find((row) => row.key === "fgpct").aggregation, "average");
});

test("ambiguous roster identities block CSV commit instead of guessing", () => {
  const preview = buildGameStatCsvPreview({
    csvText: "Player,PTS\nJordan Smith,10\n",
    roster: [
      { id: "p1", name: "Jordan Smith", email: "j1@example.com" },
      { id: "p2", name: "Jordan Smith", email: "j2@example.com" },
    ],
    importKind: "season_total",
  });
  assert.equal(preview.ok, true);
  assert.equal(preview.canCommit, false);
  assert.equal(preview.ambiguousRows.length, 1);
});

test("game-by-game imports require a valid game date", () => {
  const missingDate = buildGameStatCsvPreview({
    csvText: "Player,PTS\nAva Stone,10\n",
    roster: [{ id: "p1", name: "Ava Stone" }],
    importKind: "game",
  });
  assert.equal(missingDate.ok, false);
  assert.equal(missingDate.error, "game_date_column_required");
});

test("season snapshots use stats-through date and program totals do not double count older cumulative snapshots", () => {
  const rows = [
    { id: "a", season_id: "s1", season_label: "2025-26", import_kind: "season_total", as_of_date: "2026-01-15", imported_at: "2026-03-01T00:00:00Z", player_id: "p1", player_email: "ava@example.com", player_name: "Ava", stat_key: "pts", stat_label: "PTS", stat_value: 100, aggregation: "sum", unit: "number" },
    { id: "b", season_id: "s1", season_label: "2025-26", import_kind: "season_total", as_of_date: "2026-02-15", imported_at: "2026-02-16T00:00:00Z", player_id: "p1", player_email: "ava@example.com", player_name: "Ava", stat_key: "pts", stat_label: "PTS", stat_value: 120, aggregation: "sum", unit: "number" },
    { id: "c", season_id: "s2", season_label: "2026-27", import_kind: "season_total", imported_at: "2026-12-01T00:00:00Z", player_id: "p1", player_email: "ava@example.com", player_name: "Ava", stat_key: "pts", stat_label: "PTS", stat_value: 90, aggregation: "sum", unit: "number" },
    { id: "d", season_id: "s1", season_label: "2025-26", import_kind: "season_total", imported_at: "2026-02-01T00:00:00Z", player_id: "p1", player_email: "ava@example.com", player_name: "Ava", stat_key: "fgpct", stat_label: "FG%", stat_value: 45, aggregation: "average", unit: "%" },
    { id: "e", season_id: "s2", season_label: "2026-27", import_kind: "season_total", imported_at: "2026-12-01T00:00:00Z", player_id: "p1", player_email: "ava@example.com", player_name: "Ava", stat_key: "fgpct", stat_label: "FG%", stat_value: 50, aggregation: "average", unit: "%" },
  ];
  const intelligence = buildGameStatIntelligence({ rows, currentSeasonId: "s2", viewerEmail: "ava@example.com" });
  assert.equal(intelligence.currentPlayerStats.find((row) => row.statKey === "pts").value, 90);
  assert.equal(intelligence.programPlayerStats.find((row) => row.statKey === "pts").value, 210);
  assert.equal(intelligence.programPlayerStats.find((row) => row.statKey === "fgpct").value, 47.5);
});
