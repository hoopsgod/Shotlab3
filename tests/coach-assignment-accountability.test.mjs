import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildCoachAssignmentAccountability,
  loadCoachAssignmentAccountability,
  readActiveCoachRoster,
} from "../src/lib/coachAssignmentAccountability.js";
import {
  listPlayerAssignmentsLocal,
  loadTeamPlayerAssignments,
} from "../src/lib/playerAssignmentService.js";

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

const teamId = "team-accountability";
const players = [
  { email: "coach@example.com", name: "Coach", role: "coach", teamId },
  { email: "assigned@example.com", name: "Assigned Player", role: "player", teamId },
  { email: "ack@example.com", name: "Acknowledged Player", role: "player", teamId },
  { email: "started@example.com", name: "Started Player", role: "player", teamId },
  { email: "complete@example.com", name: "Complete Player", role: "player", teamId },
  { email: "open@example.com", name: "Open Player", role: "player", teamId },
  { email: "removed@example.com", name: "Removed Player", role: "player", teamId: null, removedFromTeamId: teamId, rosterStatus: "removed" },
  { email: "other@example.com", name: "Other Team", role: "player", teamId: "other-team" },
];

const assignment = (email, state, updatedAt) => ({
  team_id: teamId,
  player_identity: email,
  player_name: email.split("@")[0],
  assignment_text: `Assignment for ${email}`,
  result_detail: "Home shots · 33 makes",
  state,
  updated_at: updatedAt,
  created_at: updatedAt,
  note: "private coach note must never enter the accountability model",
  private_note: "also private",
});

test("active roster includes only current players on the coach team", () => {
  const storage = memoryStorage({
    "sl:session": { email: "coach@example.com", role: "coach", teamId },
    "sl:players": players,
  });
  const roster = readActiveCoachRoster({ storage });
  assert.deepEqual(roster.map((row) => row.playerIdentity), [
    "ack@example.com",
    "assigned@example.com",
    "complete@example.com",
    "open@example.com",
    "started@example.com",
  ]);
});

test("accountability model reports every state and prioritizes the next coach action", () => {
  const roster = players
    .filter((player) => player.role === "player" && player.teamId === teamId)
    .map((player) => ({ teamId, playerIdentity: player.email, playerName: player.name }));
  const model = buildCoachAssignmentAccountability({
    teamId,
    players: roster,
    assignments: [
      assignment("complete@example.com", "completed", "2026-08-02T14:00:00.000Z"),
      assignment("started@example.com", "started", "2026-08-02T13:00:00.000Z"),
      assignment("ack@example.com", "acknowledged", "2026-08-02T12:00:00.000Z"),
      assignment("assigned@example.com", "assigned", "2026-08-02T11:00:00.000Z"),
    ],
  });

  assert.equal(model.total, 5);
  assert.deepEqual(model.counts, { unassigned: 1, assigned: 1, acknowledged: 1, started: 1, completed: 1 });
  assert.equal(model.delivered, 4);
  assert.equal(model.responded, 3);
  assert.equal(model.responseRate, 75);
  assert.equal(model.completionRate, 25);
  assert.equal(model.actionCount, 4);
  assert.deepEqual(model.actionRows.map((row) => row.playerIdentity), [
    "open@example.com",
    "assigned@example.com",
    "ack@example.com",
    "started@example.com",
  ]);
  assert.deepEqual(model.completedRows.map((row) => row.playerIdentity), ["complete@example.com"]);
  assert.equal("note" in model.rows[1], false);
  assert.equal("privateNote" in model.rows[1], false);
});

test("coach team load uses one team-scoped request and replaces stale local assignment state", async () => {
  const storage = memoryStorage({
    "sl:session": { email: "coach@example.com", role: "coach", teamId },
    "sl:players": players,
    "sl:player-assignments": {
      [`${teamId}::old@example.com`]: assignment("old@example.com", "assigned", "2026-07-30T11:00:00.000Z"),
      "other-team::other@example.com": { ...assignment("other@example.com", "assigned", "2026-07-30T11:00:00.000Z"), team_id: "other-team" },
    },
  });
  let request = null;
  const remote = assignment("assigned@example.com", "assigned", "2026-08-02T11:00:00.000Z");
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ ok: true, storage_mode: "team_remote", assignments: [remote] }) };
  };

  const result = await loadCoachAssignmentAccountability({ storage, fetchImpl });
  assert.equal(request.url, `/v1/player-assignments?team_id=${teamId}`);
  assert.equal(request.options.method, "GET");
  assert.equal(result.ok, true);
  assert.equal(result.storageMode, "team_remote");
  assert.equal(result.model.counts.assigned, 1);
  assert.equal(result.model.counts.unassigned, 4);
  assert.deepEqual(listPlayerAssignmentsLocal({ teamId, storage }).map((row) => row.playerIdentity), ["assigned@example.com"]);
  assert.deepEqual(listPlayerAssignmentsLocal({ teamId: "other-team", storage }).map((row) => row.playerIdentity), ["other@example.com"]);
});

test("successful empty remote response clears stale team assignments while player sessions cannot request the team queue", async () => {
  const coachStorage = memoryStorage({
    "sl:session": { email: "coach@example.com", role: "coach", teamId },
    "sl:player-assignments": { [`${teamId}::stale@example.com`]: assignment("stale@example.com", "started", "2026-08-01T11:00:00.000Z") },
  });
  const cleared = await loadTeamPlayerAssignments({
    storage: coachStorage,
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true, storage_mode: "team_remote", assignments: [] }) }),
  });
  assert.equal(cleared.ok, true);
  assert.deepEqual(cleared.assignments, []);
  assert.deepEqual(listPlayerAssignmentsLocal({ teamId, storage: coachStorage }), []);

  const playerStorage = memoryStorage({ "sl:session": { email: "assigned@example.com", role: "player", teamId } });
  let called = false;
  const forbidden = await loadTeamPlayerAssignments({ storage: playerStorage, fetchImpl: async () => { called = true; } });
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.error, "coach_required");
  assert.equal(called, false);
});

test("source contracts install the read-only coach panel and keep private follow-ups outside it", () => {
  const enhancer = fs.readFileSync(new URL("../src/lib/coachAssignmentAccountabilityEnhancer.js", import.meta.url), "utf8");
  const bootstrap = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");
  const workflow = fs.readFileSync(new URL("../.github/workflows/coach-player-invitations.yml", import.meta.url), "utf8");

  assert.match(enhancer, /coach-assignment-accountability/);
  assert.match(enhancer, /data-unassigned-count/);
  assert.match(enhancer, /data-acknowledged-count/);
  assert.match(enhancer, /data-started-count/);
  assert.match(enhancer, /data-completed-count/);
  assert.match(enhancer, /openExactPlayerFollowUp/);
  assert.doesNotMatch(enhancer, /coachFollowUpService|record\.note|privateNote/);
  assert.match(bootstrap, /installCoachAssignmentAccountabilityEnhancer\(\)/);
  assert.match(workflow, /coach-assignment-accountability\.test\.mjs/);
  assert.match(workflow, /coach-assignment-accountability\.spec\.mjs/);
});
