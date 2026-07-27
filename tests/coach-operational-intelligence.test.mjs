import test from "node:test";
import assert from "node:assert/strict";
import {
  buildActivityIntelligenceRows,
  buildDrillIntelligenceRows,
  buildEventIntelligenceModel,
  buildLeaderboardIntelligenceRows,
  buildPlayerIntelligenceModel,
  buildSeasonComparisonModel,
  buildStrengthIntelligenceRows,
  filterActivityIntelligenceRows,
  filterDrillIntelligenceRows,
  filterLeaderboardIntelligenceRows,
  filterStrengthIntelligenceRows,
} from "../src/lib/coachOperationalIntelligence.js";

const roster = [
  { id: "p1", email: "one@example.com", name: "Player One", role: "player" },
  { id: "p2", email: "two@example.com", name: "Player Two", role: "player" },
];

test("player intelligence matches canonical identities and calculates weekly trend", () => {
  const model = buildPlayerIntelligenceModel({
    playerRow: { key: "one", player: roster[0], statusKey: "active", statusLabel: "Active this week" },
    shotLogs: [
      { id: "current", player_email: "ONE@example.com", made: 40, date: "2026-07-24" },
      { id: "prior", email: "one@example.com", made: 20, date: "2026-07-15" },
    ],
    scores: [{ id: "score", email: "one@example.com", score: 10, date: "2026-07-25" }],
    rsvps: [{ eventId: "e1", email: "one@example.com" }],
    events: [{ id: "e1", date: "2026-08-01" }, { id: "e2", date: "2026-08-02" }],
    scRsvps: [{ sessionId: "s1", email: "one@example.com" }],
    scLogs: [{ sessionId: "s1", email: "one@example.com", date: "2026-07-25" }],
    weekStart: "2026-07-20",
    previousWeekStart: "2026-07-13",
    today: "2026-07-26",
  });
  assert.equal(model.weeklyMakes, 40);
  assert.equal(model.previousWeeklyMakes, 20);
  assert.equal(model.weeklyActions, 3);
  assert.equal(model.previousWeeklyActions, 1);
  assert.equal(model.attendanceRate, 50);
  assert.equal(model.scCompletionRate, 100);
});

test("event intelligence exposes confirmed and missing roster players", () => {
  const model = buildEventIntelligenceModel({
    eventRow: { event: { id: "event-1", title: "Practice", date: "2026-08-01" } },
    roster,
    rsvps: [{ eventId: "event-1", player_email: "one@example.com" }],
  });
  assert.equal(model.confirmed.length, 1);
  assert.equal(model.missing.length, 1);
  assert.equal(model.responseRate, 50);
  assert.equal(model.missing[0].name, "Player Two");
});

test("drill selectors surface underused work and respect search", () => {
  const rows = buildDrillIntelligenceRows({
    drills: [{ id: "d1", name: "Form Shooting" }, { id: "d2", name: "Corner Threes" }],
    programDrills: [{ id: "p1", name: "Program Finishing" }],
    scores: [{ drillId: "d1", score: 20, date: "2026-07-25" }, { drillId: "d1", score: 30, date: "2026-07-26" }, { drillId: "d1", score: 40, date: "2026-07-26" }],
    programScores: [],
  });
  assert.equal(rows.find((row) => row.key === "d1").statusKey, "active");
  assert.deepEqual(filterDrillIntelligenceRows(rows, { scope: "underused" }).map((row) => row.key).sort(), ["d2", "p1"]);
  assert.deepEqual(filterDrillIntelligenceRows(rows, { query: "corner" }).map((row) => row.key), ["d2"]);
});

test("strength selectors identify committed players without completion logs", () => {
  const rows = buildStrengthIntelligenceRows({
    sessions: [{ id: "s1", sport: "Team Lift", date: "2026-07-20" }],
    rsvps: [{ sessionId: "s1", email: "one@example.com" }, { sessionId: "s1", email: "two@example.com" }],
    logs: [{ sessionId: "s1", email: "one@example.com" }],
    roster,
    today: "2026-07-26",
  });
  assert.equal(rows[0].statusKey, "overdue");
  assert.equal(rows[0].overduePlayers.length, 1);
  assert.equal(rows[0].completionRate, 50);
  assert.equal(filterStrengthIntelligenceRows(rows, { scope: "overdue" }).length, 1);
});

test("leaderboard intelligence calculates weekly improvement and scopes risers", () => {
  const rows = buildLeaderboardIntelligenceRows({
    leaderboardRows: [{ rank: 1, email: "one@example.com", name: "Player One", total: 100 }],
    shotLogs: [{ email: "one@example.com", made: 30, date: "2026-07-25" }, { email: "one@example.com", made: 10, date: "2026-07-15" }],
    weekStart: "2026-07-20",
    previousWeekStart: "2026-07-13",
  });
  assert.equal(rows[0].improvement, 20);
  assert.equal(filterLeaderboardIntelligenceRows(rows, { scope: "risers" }).length, 1);
});

test("activity filters preserve category and search behavior", () => {
  const rows = buildActivityIntelligenceRows({
    scores: [{ id: "score", email: "one@example.com", name: "Player One", score: 20, date: "2026-07-25" }],
    shotLogs: [{ id: "shot", email: "two@example.com", name: "Player Two", made: 50, date: "2026-07-26" }],
  });
  assert.equal(filterActivityIntelligenceRows(rows, { scope: "shooting" }).length, 1);
  assert.equal(filterActivityIntelligenceRows(rows, { query: "player one" })[0].type, "score");
});

test("season comparison uses archive summary without mutating source records", () => {
  const archive = { id: "a1", seasonName: "2025-26", summary: { rosterCount: 2, shotLogCount: 4, totalShotLogMakes: 100, eventCount: 3, eventRsvpCount: 5, scSessionCount: 2, scLogCount: 4 } };
  const model = buildSeasonComparisonModel({ currentRoster: roster, currentShotLogs: [{ made: 80 }, { made: 70 }], currentEvents: [{}, {}, {}, {}], archives: [archive] });
  assert.equal(model.selected.id, "a1");
  assert.equal(model.metrics.find((metric) => metric.key === "totalShotLogMakes").delta, 50);
  assert.equal(archive.summary.totalShotLogMakes, 100);
});
