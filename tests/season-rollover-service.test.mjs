import test from "node:test";
import assert from "node:assert/strict";
import { createNewSeason } from "../src/lib/seasonRolloverService.js";

const coach = { id: "coach-1", email: "coach@example.com", role: "coach", teamId: "team-1" };
const sourceArchive = {
  id: "archive-1",
  teamId: "team-1",
  rosterSnapshot: [{ userId: "11111111-1111-4111-8111-111111111111", email: "player@example.com", name: "Player", role: "player", status: "active" }],
};

test("does not expose a new active season when persistence fails", async () => {
  const result = await createNewSeason({
    coach,
    teamId: "team-1",
    sourceArchive,
    seasonName: "2027",
    seasonStartDate: "2027-06-01",
    transitionId: "transition-fail",
    playerSelections: { "11111111-1111-4111-8111-111111111111": "returning" },
    persistPlan: async () => ({ ok: false, code: "server_error", error: "failed" }),
  });
  assert.deepEqual(result, { ok: false, code: "server_error", error: "failed" });
});

test("returns a zero-history active season only after persistence succeeds", async () => {
  let capturedPlan;
  const result = await createNewSeason({
    coach,
    teamId: "team-1",
    sourceArchive,
    seasonName: "2027",
    seasonStartDate: "2027-06-01",
    transitionId: "transition-ok",
    playerSelections: { "11111111-1111-4111-8111-111111111111": "returning" },
    persistPlan: async ({ plan }) => {
      capturedPlan = plan;
      return { ok: true, seasonId: "season-1", transitionId: plan.transitionId, idempotent: false };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.season.id, "season-1");
  assert.equal(result.activeSeasons.length, 1);
  assert.equal(capturedPlan.returningMemberships[0].statistics.homeMakes, 0);
  assert.equal(capturedPlan.carryForwardPolicy.historicalScores, false);
});
