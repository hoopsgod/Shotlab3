import assert from "node:assert/strict";
import test from "node:test";
import { buildPlayerCareerHistory, getArchivedPlayerSeasons } from "../src/lib/playerCareerHistory.js";

const player = { email: "ari@example.com", profileId: "profile-ari", name: "Ari Player" };

const archives = [
  {
    id: "archive-2025",
    teamId: "team-1",
    seasonName: "2025 Season",
    seasonStartDate: "2025-01-01",
    seasonEndDate: "2025-03-01",
    playerSeasonSummaries: [{ profileId: "profile-ari", name: "Ari Player", totalHomeMakes: 100, totalProgramScore: 40, totalShotLogMakes: 60, eventRsvpCount: 8, scRsvpCount: 3, scLogCount: 2, bestProgramScore: 24 }],
  },
  {
    id: "archive-other-team",
    teamId: "team-2",
    seasonName: "Wrong Team",
    seasonEndDate: "2025-04-01",
    playerSeasonSummaries: [{ email: "ari@example.com", totalHomeMakes: 999 }],
  },
  {
    id: "archive-2026",
    teamId: "team-1",
    seasonName: "2026 Season",
    seasonStartDate: "2026-01-01",
    seasonEndDate: "2026-03-01",
    playerSeasonSummaries: [{ email: "ARI@example.com", name: "Ari Player", totalHomeMakes: 140, totalProgramScore: 50, totalShotLogMakes: 70, eventRsvpCount: 10, scRsvpCount: 4, scLogCount: 3, bestProgramScore: 31 }],
  },
];

test("builds chronological career history across stable player identities", () => {
  const history = buildPlayerCareerHistory({
    player,
    teamId: "team-1",
    seasonArchives: archives,
    scores: [{ teamId: "team-1", email: "ari@example.com", score: 160, src: "home" }],
    programScores: [{ teamId: "team-1", profileId: "profile-ari", score: 55 }],
    shotLogs: [{ teamId: "team-1", email: "ari@example.com", made: 80 }],
    rsvps: [{ teamId: "team-1", email: "ari@example.com" }],
    scRsvps: [{ teamId: "team-1", email: "ari@example.com" }],
    scLogs: [{ teamId: "team-1", email: "ari@example.com" }],
  });
  assert.deepEqual(history.seasons.map((season) => season.seasonName), ["2025 Season", "2026 Season", "Current Season"]);
  assert.equal(history.career.seasons, 3);
  assert.equal(history.career.totalHomeMakes, 400);
  assert.equal(history.career.totalProgramScore, 145);
  assert.equal(history.career.totalShotLogMakes, 210);
  assert.equal(history.career.trainingTotal, 755);
  assert.equal(history.records.bestTrainingSeason.seasonName, "Current Season");
  assert.equal(history.records.bestProgramScore, 55);
  assert.equal(history.improvement.comparedTo, "2026 Season");
  assert.equal(history.improvement.delta, 35);
});

test("strictly excludes other-team and teamless current rows", () => {
  const history = buildPlayerCareerHistory({
    player,
    teamId: "team-1",
    seasonArchives: archives,
    scores: [
      { teamId: "team-2", email: "ari@example.com", score: 900 },
      { email: "ari@example.com", score: 800 },
      { teamId: "team-1", email: "ari@example.com", score: 25 },
    ],
  });
  assert.equal(history.seasons.length, 3);
  assert.equal(history.seasons.at(-1).totalHomeMakes, 25);
  assert.equal(history.seasons.some((season) => season.seasonName === "Wrong Team"), false);
});

test("falls back to immutable archive snapshots when summaries are absent", () => {
  const legacyArchive = {
    id: "legacy",
    teamId: "team-1",
    seasonName: "Legacy Season",
    seasonEndDate: "2024-03-01",
    homeScoresSnapshot: [{ teamId: "team-1", email: "ari@example.com", score: 20 }],
    programScoresSnapshot: [{ teamId: "team-1", profileId: "profile-ari", score: 12 }],
    shotLogsSnapshot: [{ teamId: "team-1", email: "ari@example.com", made: 15 }],
    eventRsvpSnapshot: [{ teamId: "team-1", email: "ari@example.com" }],
    scRsvpSnapshot: [],
    scLogSnapshot: [],
  };
  const before = JSON.stringify(legacyArchive);
  const seasons = getArchivedPlayerSeasons({ player, teamId: "team-1", seasonArchives: [legacyArchive] });
  assert.equal(seasons.length, 1);
  assert.equal(seasons[0].trainingTotal, 47);
  assert.equal(JSON.stringify(legacyArchive), before, "career calculations must never mutate immutable archives");
});

test("does not match a different stable identity by name alone", () => {
  const archive = {
    id: "same-name",
    teamId: "team-1",
    seasonName: "Same Name",
    playerSeasonSummaries: [{ email: "different@example.com", name: "Ari Player", totalHomeMakes: 500 }],
  };
  const seasons = getArchivedPlayerSeasons({ player, teamId: "team-1", seasonArchives: [archive] });
  assert.equal(seasons.length, 0);
});
