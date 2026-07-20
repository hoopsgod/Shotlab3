import test from "node:test";
import assert from "node:assert/strict";
import { createSeasonArchive } from "../src/lib/seasonArchive.js";

const base = (overrides = {}) => ({
  teamId: "team-a",
  coach: { email: "coach@a.test", name: "Coach A", role: "coach", teamId: "team-a" },
  seasonName: "2026 Season",
  seasonStartDate: "2026-01-01",
  seasonEndDate: "2026-12-31",
  activeRosterPlayers: [{ id: "p1", playerId: "p1", email: "p1@a.test", name: "Player", role: "player", teamId: "team-a" }],
  playerProfiles: [],
  scores: [{ id: "s1", playerId: "p1", email: "p1@a.test", teamId: "team-a", score: 10, date: "2026-02-01" }],
  existingArchives: [],
  now: () => "2026-07-15T00:00:00.000Z",
  ...overrides,
});

test("compatibility metadata gives React a new list without adding an archive before persistence", async () => {
  let resolvePersist;
  const existingArchives = [];
  const request = createSeasonArchive(base({
    existingArchives,
    persistArchive: ({ archive }) => new Promise((resolve) => { resolvePersist = () => resolve({ ok: true, archive }); }),
  }));

  assert.equal(request.ok, true);
  assert.equal(request.archive.seasonName, "2026 Season");
  assert.notEqual(request.seasonArchives, existingArchives, "React receives a new array reference");
  assert.deepEqual(request.seasonArchives, [], "pending archive is not exposed as saved");
  assert.deepEqual(existingArchives, [], "source state remains unchanged while the write is pending");

  resolvePersist();
  const result = await request;
  assert.equal(result.ok, true);
  assert.equal(result.seasonArchives.length, 1);
  assert.equal(request.seasonArchives.length, 1, "the React-compatible list is filled only after success");
  assert.equal(existingArchives.length, 1);
});

test("failed persistence never inserts into the React-compatible list", async () => {
  const existingArchives = [];
  const request = createSeasonArchive(base({
    existingArchives,
    persistArchive: async () => ({ ok: false, error: "write failed", code: "archive_write_failed" }),
  }));
  assert.equal(request.ok, true);
  assert.deepEqual(request.seasonArchives, []);
  const result = await request;
  assert.equal(result.ok, false);
  assert.deepEqual(request.seasonArchives, []);
  assert.deepEqual(existingArchives, []);
});
