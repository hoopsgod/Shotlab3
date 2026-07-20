import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAllTimeHomeLeaderboardRows,
  buildAllTimeProgramLeaderboardRows,
  buildCurrentOffseasonHomeLeaderboardRows,
  buildCurrentOffseasonProgramLeaderboardRows,
  filterLiveRowsOutsideArchivedSeasons,
  getAllTimeLeaderboardPlayers,
  getAllTimeProgramDrills,
  getArchivedSeasonRanges,
  getSeasonLeaderboardCoverage,
} from "../src/lib/seasonLeaderboardAnalytics.js";

const teamId = "team-1";
const players = [
  { id: "player-a", playerId: "player-a", email: "a@example.com", name: "A Player", role: "player", teamId },
  { id: "player-b", playerId: "player-b", email: "b@example.com", name: "B Player", role: "player", teamId },
];

const archive = {
  id: "archive-2025",
  teamId,
  seasonName: "2025 Season",
  seasonStartDate: "2025-11-01",
  seasonEndDate: "2026-03-15",
  rosterSnapshot: [
    ...players,
    { id: "player-alumni", playerId: "player-alumni", email: "alumni@example.com", name: "Alumni Player", role: "player", teamId },
  ],
  programDrillSnapshot: [
    { id: "drill-1", name: "3 Minute Shooting" },
    { id: "historic-drill", name: "Historic Drill" },
  ],
  playerSeasonSummaries: [
    {
      playerId: "player-a",
      email: "a@example.com",
      name: "A Player",
      totalHomeMakes: 120,
      totalShotLogMakes: 30,
      lastActivityDate: "2026-03-10",
    },
    {
      playerId: "player-alumni",
      email: "alumni@example.com",
      name: "Alumni Player",
      totalHomeMakes: 180,
      totalShotLogMakes: 20,
      lastActivityDate: "2026-03-12",
    },
  ],
  programScoresSnapshot: [
    {
      id: "archived-program-a",
      teamId,
      playerId: "player-a",
      email: "a@example.com",
      name: "A Player",
      drillId: "drill-1",
      drillName: "3 Minute Shooting",
      score: 38,
      date: "2026-02-01",
      src: "program",
    },
    {
      id: "archived-program-alumni",
      teamId,
      playerId: "player-alumni",
      email: "alumni@example.com",
      name: "Alumni Player",
      drillId: "historic-drill",
      drillName: "Historic Drill",
      score: 44,
      date: "2026-02-05",
      src: "program",
    },
  ],
};

const liveHomeScores = [
  { id: "inside-score", teamId, playerId: "player-a", email: "a@example.com", name: "A Player", score: 999, date: "2026-02-10", src: "home" },
  { id: "outside-score-a", teamId, playerId: "player-a", email: "a@example.com", name: "A Player", score: 25, date: "2026-06-01", src: "home" },
  { id: "outside-score-b", teamId, playerId: "player-b", email: "b@example.com", name: "B Player", score: 40, date: "2026-06-02", src: "home" },
  { id: "undated-score", teamId, playerId: "player-b", email: "b@example.com", name: "B Player", score: 500, src: "home" },
  { id: "other-team-score", teamId: "team-2", playerId: "player-a", email: "a@example.com", score: 700, date: "2026-06-02", src: "home" },
];

const liveShotLogs = [
  { id: "inside-shot", teamId, playerId: "player-a", email: "a@example.com", name: "A Player", made: 500, date: "2026-02-11", src: "home" },
  { id: "outside-shot", teamId, playerId: "player-a", email: "a@example.com", name: "A Player", made: 15, date: "2026-06-03", src: "home" },
];

const liveProgramScores = [
  { id: "inside-program", teamId, playerId: "player-a", email: "a@example.com", name: "A Player", drillId: "drill-1", drillName: "3 Minute Shooting", score: 99, date: "2026-02-20", src: "program" },
  { id: "outside-program-a", teamId, playerId: "player-a", email: "a@example.com", name: "A Player", drillId: "drill-1", drillName: "3 Minute Shooting", score: 42, date: "2026-06-05", src: "program" },
  { id: "outside-program-b", teamId, playerId: "player-b", email: "b@example.com", name: "B Player", drillId: "drill-1", drillName: "3 Minute Shooting", score: 40, date: "2026-06-06", src: "program" },
];

test("archive ranges are team-scoped and overlapping seasons collapse", () => {
  const ranges = getArchivedSeasonRanges({
    teamId,
    seasonArchives: [
      archive,
      { id: "archive-overlap", teamId, seasonName: "Overlap", seasonStartDate: "2026-03-01", seasonEndDate: "2026-04-01" },
      { id: "other-team", teamId: "team-2", seasonName: "Other", seasonStartDate: "2020-01-01", seasonEndDate: "2030-01-01" },
    ],
  });
  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].start, "2025-11-01");
  assert.equal(ranges[0].end, "2026-04-01");
  assert.deepEqual(ranges[0].archiveIds, ["archive-2025", "archive-overlap"]);
});

test("live rows inside archived seasons, undated rows, and other teams are excluded", () => {
  const filtered = filterLiveRowsOutsideArchivedSeasons(liveHomeScores, { seasonArchives: [archive], teamId });
  assert.deepEqual(filtered.map((row) => row.id), ["outside-score-a", "outside-score-b"]);
});

test("current/offseason home leaderboard contains only non-overlapping live activity", () => {
  const rows = buildCurrentOffseasonHomeLeaderboardRows({
    seasonArchives: [archive],
    teamId,
    homeScores: liveHomeScores,
    shotLogs: liveShotLogs,
    players,
  });
  assert.deepEqual(rows.map((row) => [row.name, row.total]), [
    ["A Player", 40],
    ["B Player", 40],
  ]);
  assert.ok(rows.every((row) => row.timeScope === "current"));
});

test("all-time home leaderboard adds frozen history once and keeps alumni", () => {
  const rows = buildAllTimeHomeLeaderboardRows({
    seasonArchives: [archive],
    teamId,
    homeScores: liveHomeScores,
    shotLogs: liveShotLogs,
    players,
  });
  assert.deepEqual(rows.map((row) => [row.name, row.total, row.archivedTotal, row.currentTotal]), [
    ["Alumni Player", 200, 200, 0],
    ["A Player", 190, 150, 40],
    ["B Player", 40, 0, 40],
  ]);
  assert.equal(rows.find((row) => row.name === "A Player")?.total, 190);
  assert.notEqual(rows.find((row) => row.name === "A Player")?.total, 1689);
});

test("current and all-time program leaderboards preserve best-score semantics without double counting", () => {
  const drill = { id: "drill-1", name: "3 Minute Shooting", teamId };
  const currentRows = buildCurrentOffseasonProgramLeaderboardRows({
    seasonArchives: [archive],
    teamId,
    programScores: liveProgramScores,
    drill,
    players,
  });
  assert.deepEqual(currentRows.map((row) => [row.name, row.total]), [
    ["A Player", 42],
    ["B Player", 40],
  ]);

  const allTimeRows = buildAllTimeProgramLeaderboardRows({
    seasonArchives: [archive],
    teamId,
    programScores: liveProgramScores,
    drill,
    players,
  });
  assert.deepEqual(allTimeRows.map((row) => [row.name, row.total]), [
    ["A Player", 42],
    ["B Player", 40],
  ]);
  assert.ok(allTimeRows.every((row) => row.timeScope === "all_time"));
});

test("all-time catalogs retain historical players and archived drills", () => {
  const allPlayers = getAllTimeLeaderboardPlayers({ seasonArchives: [archive], teamId, players });
  assert.ok(allPlayers.some((player) => player.email === "alumni@example.com"));

  const drills = getAllTimeProgramDrills({
    seasonArchives: [archive],
    teamId,
    programDrills: [{ id: "drill-1", name: "3 Minute Shooting" }],
  });
  assert.deepEqual(drills.map((drill) => drill.id), ["drill-1", "historic-drill"]);
});

test("coverage exposes archive count and latest frozen season end", () => {
  assert.deepEqual(getSeasonLeaderboardCoverage({ seasonArchives: [archive], teamId }), {
    archiveCount: 1,
    ranges: [
      {
        archiveId: "archive-2025",
        seasonName: "2025 Season",
        start: "2025-11-01",
        end: "2026-03-15",
        archiveIds: ["archive-2025"],
        seasonNames: ["2025 Season"],
      },
    ],
    latestArchiveEndDate: "2026-03-15",
  });
});

test("analytics do not mutate live or archived inputs", () => {
  const source = {
    archive: structuredClone(archive),
    homeScores: structuredClone(liveHomeScores),
    shotLogs: structuredClone(liveShotLogs),
    programScores: structuredClone(liveProgramScores),
    players: structuredClone(players),
  };
  const before = structuredClone(source);
  buildAllTimeHomeLeaderboardRows({ seasonArchives: [source.archive], teamId, homeScores: source.homeScores, shotLogs: source.shotLogs, players: source.players });
  buildAllTimeProgramLeaderboardRows({ seasonArchives: [source.archive], teamId, programScores: source.programScores, drill: { id: "drill-1", name: "3 Minute Shooting" }, players: source.players });
  assert.deepEqual(source, before);
});
