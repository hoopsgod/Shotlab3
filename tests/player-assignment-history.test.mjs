import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  listPlayerAssignmentHistoryLocal,
  saveNextPlayerAssignment,
} from "../src/lib/playerAssignmentHistoryService.js";
import { getPlayerAssignmentLocal, savePlayerAssignmentLocal } from "../src/lib/playerAssignmentService.js";

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

const TEAM_ID = "team-history";
const PLAYER = "player@example.com";
const completed = {
  teamId: TEAM_ID,
  playerIdentity: PLAYER,
  playerName: "Player One",
  assignmentText: "Complete the form shooting ladder.",
  resultDetail: "42 makes",
  dueDate: "2026-08-02",
  state: "completed",
  assignedBy: "coach@example.com",
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-02T12:00:00.000Z",
  acknowledgedAt: "2026-08-01T13:00:00.000Z",
  startedAt: "2026-08-01T14:00:00.000Z",
  completedAt: "2026-08-02T12:00:00.000Z",
};

const coachStorage = () => memoryStorage({
  "sl:session": { email: "coach@example.com", role: "coach", teamId: TEAM_ID },
});

test("failed assign-next preserves the completed current assignment and creates retryable history", async () => {
  const storage = coachStorage();
  savePlayerAssignmentLocal(completed, storage);
  const result = await saveNextPlayerAssignment({
    teamId: TEAM_ID,
    playerIdentity: PLAYER,
    playerName: "Player One",
    assignmentText: "Complete five-spot shooting.",
    storage,
    fetchImpl: async () => ({ ok: false, json: async () => ({ error: "offline" }) }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.retryable, true);
  assert.equal(getPlayerAssignmentLocal({ teamId: TEAM_ID, playerIdentity: PLAYER, storage }).state, "completed");
  assert.equal(listPlayerAssignmentHistoryLocal({ teamId: TEAM_ID, storage }).length, 1);
  assert.equal(listPlayerAssignmentHistoryLocal({ teamId: TEAM_ID, storage })[0].assignmentText, completed.assignmentText);
});

test("successful assign-next archives the completed record and activates only the new assignment", async () => {
  const storage = coachStorage();
  savePlayerAssignmentLocal(completed, storage);
  let payload = null;
  const result = await saveNextPlayerAssignment({
    teamId: TEAM_ID,
    playerIdentity: PLAYER,
    playerName: "Player One",
    assignmentText: "Complete five-spot shooting.",
    dueDate: "2026-08-06",
    storage,
    fetchImpl: async (_url, options) => {
      payload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          ok: true,
          storage_mode: "team_remote",
          archived_previous: true,
          archived_assignment: { ...completed, archived_at: "2026-08-02T21:00:00.000Z" },
          assignment: {
            team_id: TEAM_ID,
            player_identity: PLAYER,
            player_name: "Player One",
            assignment_text: "Complete five-spot shooting.",
            result_detail: "",
            due_date: "2026-08-06",
            state: "assigned",
            assigned_by: "coach@example.com",
            created_at: "2026-08-02T21:00:00.000Z",
            updated_at: "2026-08-02T21:00:00.000Z",
          },
        }),
      };
    },
  });

  assert.equal(result.ok, true);
  const current = getPlayerAssignmentLocal({ teamId: TEAM_ID, playerIdentity: PLAYER, storage });
  assert.equal(current.state, "assigned");
  assert.equal(current.assignmentText, "Complete five-spot shooting.");
  assert.equal(listPlayerAssignmentHistoryLocal({ teamId: TEAM_ID, storage }).length, 1);
  assert.equal(payload.team_id, TEAM_ID);
  assert.equal(payload.assignment.player_identity, PLAYER);
  assert.equal(payload.assignment.due_date, "2026-08-06");
  assert.equal("private_note" in payload.assignment, false);
  assert.equal("coach_note" in payload.assignment, false);
});

test("assign-next refuses to overwrite active work", async () => {
  const storage = coachStorage();
  savePlayerAssignmentLocal({ ...completed, state: "started", completedAt: "" }, storage);
  const result = await saveNextPlayerAssignment({
    teamId: TEAM_ID,
    playerIdentity: PLAYER,
    assignmentText: "This must not replace active work.",
    storage,
    fetchImpl: async () => { throw new Error("network must not be called"); },
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "completed_assignment_required");
  assert.equal(getPlayerAssignmentLocal({ teamId: TEAM_ID, playerIdentity: PLAYER, storage }).state, "started");
});

test("database, server, and UI contracts keep history immutable and private", () => {
  const migration = fs.readFileSync(new URL("../migrations/040_player_assignment_history.sql", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../functions/v1/player-assignment-history/index.js", import.meta.url), "utf8");
  const enhancer = fs.readFileSync(new URL("../src/lib/coachAssignNextEnhancer.js", import.meta.url), "utf8");
  const bootstrap = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");

  assert.match(migration, /primary key \(team_id, player_identity, created_at\)/i);
  assert.match(migration, /state = 'completed'/i);
  assert.match(migration, /revoke all on table public\.player_assignment_history from public, anon, authenticated/i);
  assert.match(route, /assignment_in_progress/);
  assert.match(route, /player_assignment_history/);
  assert.match(route, /archived_previous/);
  assert.match(enhancer, /Assign next/);
  assert.match(enhancer, /coach-assignment-history/);
  assert.match(bootstrap, /installCoachAssignNextEnhancer\(\)/);
  assert.doesNotMatch(migration, /private_note|coach_note/i);
  assert.doesNotMatch(route, /private_note|coach_note/i);
  assert.doesNotMatch(enhancer, /private_note|coach_note/i);
});
