import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSeasonArchive,
  createSeasonArchive,
  getSeasonArchiveDetailModel,
  normalizeArchiveDate,
} from "../src/lib/seasonArchive.js";

const coach = { email: "coach@a.test", name: "Coach A", role: "coach", teamId: "team-a" };

function base(overrides = {}) {
  return {
    teamId: "team-a",
    coach,
    seasonName: "2026 Summer",
    seasonStartDate: "2026-05-01",
    seasonEndDate: "2026-07-01",
    activeRosterPlayers: [
      { id: "p1", playerId: "p1", email: "one@a.test", name: "Player One", role: "player", teamId: "team-a", status: "active" },
    ],
    playerProfiles: [
      { id: "profile-1", userId: "one@a.test", teamId: "team-a", firstName: "Player", lastName: "One" },
    ],
    scores: [
      { id: "home-1", teamId: "team-a", playerId: "p1", email: "one@a.test", score: 12, date: "2026-05-01" },
      { id: "home-2", teamId: "team-a", playerId: "p1", email: "one@a.test", score: 8, date: "2026-07-01" },
    ],
    programScores: [
      { id: "program-1", teamId: "team-a", playerId: "p1", email: "one@a.test", score: 20, date: "2026-06-02" },
    ],
    shotLogs: [
      { id: "shots-1", teamId: "team-a", playerId: "p1", email: "one@a.test", made: 30, date: "2026-06-03" },
    ],
    events: [
      { id: "event-1", teamId: "team-a", title: "Practice", date: "2026-06-04" },
    ],
    rsvps: [
      { id: "rsvp-1", teamId: "team-a", eventId: "event-1", playerId: "p1", email: "one@a.test", attended: true },
    ],
    scSessions: [
      { id: "sc-1", teamId: "team-a", title: "Lift", date: "2026-06-05" },
    ],
    scRsvps: [
      { id: "scr-1", teamId: "team-a", sessionId: "sc-1", playerId: "p1", email: "one@a.test" },
    ],
    scLogs: [
      { id: "scl-1", teamId: "team-a", sessionId: "sc-1", playerId: "p1", email: "one@a.test", completed: true },
    ],
    programDrills: [{ id: "pd1", name: "Program Drill" }],
    drills: [{ id: "d1", name: "Home Drill" }],
    challenges: [
      { id: "challenge-1", teamId: "team-a", from: "one@a.test", to: "one@a.test", date: "2026-06-06" },
    ],
    existingArchives: [],
    now: () => "2026-07-04T00:00:00.000Z",
    ...overrides,
  };
}

test("normalizes supported archive dates and rejects invalid dates", () => {
  assert.equal(normalizeArchiveDate("2026-06-03"), "2026-06-03");
  assert.equal(normalizeArchiveDate("2026-06-03T12:30:00.000Z"), "2026-06-03");
  assert.equal(normalizeArchiveDate("not-a-date"), "");
});

test("requires an authorized coach, season name, and valid date range", () => {
  assert.equal(buildSeasonArchive({ ...base(), coach: { role: "player", teamId: "team-a" } }).ok, false);
  assert.equal(buildSeasonArchive({ ...base(), seasonName: " " }).error, "Season name is required.");
  assert.equal(buildSeasonArchive({ ...base(), seasonStartDate: "" }).error, "Season start and end dates are required.");
  assert.equal(buildSeasonArchive({ ...base(), seasonStartDate: "2026-08-01" }).error, "Season start date must be on or before the end date.");
});

test("builds an inclusive, team-scoped frozen snapshot with accurate totals", () => {
  const result = buildSeasonArchive(base());
  assert.equal(result.ok, true);
  const { archive } = result;
  assert.equal(archive.version, 2);
  assert.equal(archive.homeScoresSnapshot.length, 2, "both season boundary dates are included");
  assert.equal(archive.programScoresSnapshot.length, 1);
  assert.equal(archive.eventRsvpSnapshot.length, 1, "RSVP inherits the related event date");
  assert.equal(archive.scRsvpSnapshot.length, 1, "S&C RSVP inherits the related session date");
  assert.equal(archive.scLogSnapshot.length, 1, "S&C log inherits the related session date");
  assert.deepEqual(archive.summary, {
    rosterCount: 1,
    playerProfileCount: 1,
    homeScoreCount: 2,
    programScoreCount: 1,
    shotLogCount: 1,
    eventCount: 1,
    eventRsvpCount: 1,
    scSessionCount: 1,
    scRsvpCount: 1,
    scLogCount: 1,
    totalHomeMakes: 20,
    totalProgramScore: 20,
    totalShotLogMakes: 30,
  });
  assert.equal(archive.playerSeasonSummaries[0].totalHomeMakes, 20);
  assert.equal(archive.playerSeasonSummaries[0].lastActivityDate, "2026-06-05");
});

test("excludes other-team, outside-season, missing-date, and removed-player activity", () => {
  const removed = { id: "p2", playerId: "p2", email: "removed@a.test", name: "Removed", role: "player", teamId: "team-a", status: "inactive" };
  const result = buildSeasonArchive(base({
    activeRosterPlayers: [...base().activeRosterPlayers, removed],
    scores: [
      ...base().scores,
      { id: "outside", teamId: "team-a", playerId: "p1", email: "one@a.test", score: 100, date: "2026-07-02" },
      { id: "missing", teamId: "team-a", playerId: "p1", email: "one@a.test", score: 100 },
      { id: "removed-score", teamId: "team-a", playerId: "p2", email: "removed@a.test", score: 100, date: "2026-06-01" },
      { id: "other-team", teamId: "team-b", playerId: "p1", email: "one@a.test", score: 100, date: "2026-06-01" },
    ],
    shotLogs: [
      ...base().shotLogs,
      { id: "removed-shots", teamId: "team-a", playerId: "p2", email: "removed@a.test", made: 100, date: "2026-06-01" },
    ],
    rsvps: [
      ...base().rsvps,
      { id: "removed-rsvp", teamId: "team-a", eventId: "event-1", playerId: "p2", email: "removed@a.test" },
    ],
  }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.archive.rosterSnapshot.map((row) => row.email), ["one@a.test"]);
  assert.deepEqual(result.archive.homeScoresSnapshot.map((row) => row.id), ["home-1", "home-2"]);
  assert.deepEqual(result.archive.shotLogsSnapshot.map((row) => row.id), ["shots-1"]);
  assert.deepEqual(result.archive.eventRsvpSnapshot.map((row) => row.id), ["rsvp-1"]);
  assert.equal(result.archive.diagnostics.excludedOutsideSeason.homeScores, 1);
  assert.equal(result.archive.diagnostics.excludedMissingDate.homeScores, 1);
  assert.equal(result.archive.diagnostics.excludedInactivePlayer.homeScores, 1);
  assert.equal(result.archive.diagnostics.excludedOtherTeam.homeScores, 1);
  assert.ok(!JSON.stringify(result.archive).includes("removed@a.test"));
});

test("profile-only active players remain supported", () => {
  const result = buildSeasonArchive(base({
    activeRosterPlayers: [{ id: "manual-1", profileId: "manual-1", teamId: "team-a", firstName: "Manual", lastName: "Player", source: "profile" }],
    playerProfiles: [{ id: "manual-1", profileId: "manual-1", teamId: "team-a", firstName: "Manual", lastName: "Player" }],
    scores: [{ id: "manual-score", teamId: "team-a", profileId: "manual-1", score: 11, date: "2026-06-01" }],
    programScores: [], shotLogs: [], rsvps: [], scRsvps: [], scLogs: [], challenges: [],
  }));
  assert.equal(result.ok, true);
  assert.equal(result.archive.playerSeasonSummaries[0].name, "Manual Player");
  assert.equal(result.archive.playerSeasonSummaries[0].totalHomeMakes, 11);
});

test("duplicate team-season ranges are rejected deterministically", () => {
  const existing = [{ teamId: "team-a", seasonName: "2026 SUMMER", seasonStartDate: "2026-05-01", seasonEndDate: "2026-07-01" }];
  const result = buildSeasonArchive(base({ existingArchives: existing }));
  assert.equal(result.ok, false);
  assert.equal(result.code, "duplicate_archive");
});

test("building an archive never mutates live data and the snapshot stays frozen", () => {
  const input = base();
  const before = JSON.stringify(input);
  const result = buildSeasonArchive(input);
  assert.equal(JSON.stringify(input), before);
  input.scores[0].score = 999;
  input.activeRosterPlayers[0].name = "Changed";
  assert.equal(result.archive.homeScoresSnapshot[0].score, 12);
  assert.equal(result.archive.rosterSnapshot[0].name, "Player One");
});

test("createSeasonArchive reports success only after durable persistence succeeds", async () => {
  const existingArchives = [];
  let persisted = false;
  const result = await createSeasonArchive(base({
    existingArchives,
    persistArchive: async ({ archive }) => {
      persisted = true;
      return { ok: true, archive: { ...archive, createdAt: "2026-07-04T00:00:01.000Z" } };
    },
  }));
  assert.equal(persisted, true);
  assert.equal(result.ok, true);
  assert.equal(existingArchives.length, 1);
  assert.equal(existingArchives[0].createdAt, "2026-07-04T00:00:01.000Z");
});

test("failed persistence creates no false success and does not alter archive state", async () => {
  const existingArchives = [];
  const result = await createSeasonArchive(base({
    existingArchives,
    persistArchive: async () => ({ ok: false, error: "Server write failed", code: "archive_write_failed" }),
  }));
  assert.equal(result.ok, false);
  assert.equal(result.error, "Server write failed");
  assert.deepEqual(existingArchives, []);
});

test("concurrent duplicate submissions collapse into one server write", async () => {
  const existingArchives = [];
  let writes = 0;
  const input = base({
    existingArchives,
    persistArchive: async ({ archive }) => {
      writes += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { ok: true, archive };
    },
  });
  const [first, second] = await Promise.all([createSeasonArchive(input), createSeasonArchive(input)]);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(writes, 1);
  assert.equal(existingArchives.length, 1);
});

test("detail model remains read-only and readable", () => {
  const { archive } = buildSeasonArchive(base());
  const detail = getSeasonArchiveDetailModel(archive);
  assert.equal(detail.seasonName, "2026 Summer");
  assert.equal(detail.seasonRange, "2026-05-01 — 2026-07-01");
  assert.ok(detail.sections.some((section) => section.title === "PLAYER SEASON SUMMARIES" && section.rows[0].includes("Player One")));
});
