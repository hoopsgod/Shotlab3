import test from "node:test";
import assert from "node:assert/strict";

import {
  ROLLOVER_PLAYER_STATUSES,
  buildSeasonRolloverPlan,
  isEligibleArchivedPlayer,
  stablePlayerIdentity,
  validateSeasonRolloverInput,
} from "../src/lib/seasonRollover.js";

const coach = { id: "coach-1", email: "coach@example.com", role: "coach", teamId: "team-1" };
const archive = {
  id: "archive-1",
  teamId: "team-1",
  rosterSnapshot: [
    { id: "membership-1", userId: "user-1", email: "a@example.com", name: "A Player", teamId: "team-1", role: "player", status: "active" },
    { id: "membership-2", profileId: "profile-2", email: "b@example.com", name: "B Player", teamId: "team-1", role: "player", status: "active" },
    { id: "membership-3", userId: "user-3", email: "removed@example.com", name: "Removed", teamId: "team-1", role: "player", status: "removed" },
    { id: "coach-row", userId: "coach-1", email: "coach@example.com", teamId: "team-1", role: "coach", status: "active" },
  ],
};

test("validates coach, team, archive, dates, and duplicate active seasons", () => {
  assert.equal(validateSeasonRolloverInput({ coach, teamId: "team-2", sourceArchive: archive, seasonName: "2027", seasonStartDate: "2027-06-01" }).code, "wrong_team");
  assert.equal(validateSeasonRolloverInput({ coach, teamId: "team-1", sourceArchive: { ...archive, teamId: "team-2" }, seasonName: "2027", seasonStartDate: "2027-06-01" }).code, "archive_wrong_team");
  assert.equal(validateSeasonRolloverInput({ coach, teamId: "team-1", sourceArchive: archive, seasonName: "2027", seasonStartDate: "06/01/2027" }).code, "invalid_start_date");
  assert.equal(validateSeasonRolloverInput({ coach, teamId: "team-1", sourceArchive: archive, seasonName: "2027", seasonStartDate: "2027-06-01", projectedEndDate: "2027-05-01" }).code, "invalid_date_range");
  assert.equal(validateSeasonRolloverInput({ coach, teamId: "team-1", sourceArchive: archive, seasonName: "2027", seasonStartDate: "2027-06-01", existingActiveSeasons: [{ teamId: "team-1", name: "2027", status: "active" }] }).code, "duplicate_active_season");
});

test("uses durable player identity and excludes removed and coach rows", () => {
  assert.equal(stablePlayerIdentity(archive.rosterSnapshot[0]), "user-1");
  assert.equal(stablePlayerIdentity(archive.rosterSnapshot[1]), "profile-2");
  assert.equal(isEligibleArchivedPlayer(archive.rosterSnapshot[0]), true);
  assert.equal(isEligibleArchivedPlayer(archive.rosterSnapshot[2]), false);
  assert.equal(isEligibleArchivedPlayer(archive.rosterSnapshot[3]), false);
});

test("builds an immutable, idempotent rollover plan with zero history", () => {
  const original = structuredClone(archive);
  const result = buildSeasonRolloverPlan({
    coach,
    teamId: "team-1",
    sourceArchive: archive,
    seasonName: "Summer 2027",
    seasonStartDate: "2027-06-01",
    projectedEndDate: "2027-08-31",
    transitionId: "rollover-123",
    playerSelections: {
      "user-1": ROLLOVER_PLAYER_STATUSES.RETURNING,
      "profile-2": ROLLOVER_PLAYER_STATUSES.GRADUATED,
    },
    selectedProgramDrillIds: ["drill-1", "drill-1", ""],
    selectedEventTemplateIds: ["event-1"],
    selectedStrengthTemplateIds: ["strength-1"],
    now: () => "2027-05-01T12:00:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.plan.transitionId, "rollover-123");
  assert.equal(result.plan.returningMemberships.length, 1);
  assert.equal(result.plan.returningMemberships[0].identity, "user-1");
  assert.deepEqual(result.plan.returningMemberships[0].statistics, {
    homeMakes: 0,
    programScore: 0,
    attendance: 0,
    eventRsvps: 0,
    strengthAttendance: 0,
    streak: 0,
  });
  assert.deepEqual(result.plan.reusableStructure.programDrillIds, ["drill-1"]);
  assert.equal(result.plan.carryForwardPolicy.historicalScores, false);
  assert.equal(result.plan.excludedPlayers.length, 2);
  assert.deepEqual(archive, original);
});

test("defaults unselected eligible players to not returning", () => {
  const result = buildSeasonRolloverPlan({
    coach,
    teamId: "team-1",
    sourceArchive: archive,
    seasonName: "Summer 2027",
    seasonStartDate: "2027-06-01",
    transitionId: "rollover-456",
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.plan.playerDecisions.map((row) => row.status), ["not_returning", "not_returning"]);
  assert.equal(result.plan.returningMemberships.length, 0);
});

test("requires a transition identifier", () => {
  const result = buildSeasonRolloverPlan({ coach, teamId: "team-1", sourceArchive: archive, seasonName: "2027", seasonStartDate: "2027-06-01" });
  assert.equal(result.code, "transition_id_required");
});
