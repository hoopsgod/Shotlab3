import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  getPlayerAssignmentLocal,
  loadPlayerAssignment,
  normalizePlayerAssignment,
  savePlayerAssignment,
  updatePlayerAssignmentState,
} from "../src/lib/playerAssignmentService.js";
import { sanitizePlayerAssignment as sanitizeApiAssignment } from "../functions/v1/player-assignments/index.js";

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

const assignment = {
  team_id: "team-a",
  player_identity: "player@example.com",
  player_name: "Player One",
  assignment_text: "Repeat Form Shooting and match 33 makes.",
  result_detail: "Home shots · 33 makes",
  state: "assigned",
  assigned_by: "coach@example.com",
  created_at: "2026-08-02T18:00:00.000Z",
  updated_at: "2026-08-02T18:00:00.000Z",
};

test("assignment normalization exposes player-safe fields only", () => {
  const normalized = normalizePlayerAssignment({ ...assignment, note: "private coach note", private_note: "never expose" });
  assert.equal(normalized.assignmentText, assignment.assignment_text);
  assert.equal(normalized.resultDetail, assignment.result_detail);
  assert.equal(normalized.playerIdentity, "player@example.com");
  assert.equal("note" in normalized, false);
  assert.equal("privateNote" in normalized, false);
  assert.equal(sanitizeApiAssignment({ ...assignment, state: "invalid" }).state, "assigned");
});

test("coach delivery writes the canonical player identity without private note data", async () => {
  const storage = memoryStorage({
    "sl:session": { email: "coach@example.com", role: "coach", teamId: "team-a" },
  });
  let payload = null;
  const result = await savePlayerAssignment({
    teamId: "team-a",
    playerIdentity: "PLAYER@EXAMPLE.COM",
    playerName: "Player One",
    assignmentText: assignment.assignment_text,
    resultDetail: assignment.result_detail,
    storage,
    fetchImpl: async (_url, options) => {
      payload = JSON.parse(options.body);
      return { ok: true, json: async () => ({ ok: true, storage_mode: "team_remote", assignment }) };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(payload.action, "assign");
  assert.equal(payload.assignment.player_identity, "player@example.com");
  assert.equal(payload.assignment.assignment_text, assignment.assignment_text);
  assert.equal("note" in payload.assignment, false);
  assert.equal("private_note" in payload.assignment, false);
});

test("player loads only their assignment and advances one state at a time", async () => {
  const storage = memoryStorage({
    "sl:session": { email: "player@example.com", role: "player", teamId: "team-a" },
  });
  let state = "assigned";
  const fetchImpl = async (_url, options = {}) => {
    if ((options.method || "GET") === "GET") {
      return { ok: true, json: async () => ({ ok: true, storage_mode: "team_remote", assignments: [{ ...assignment, state }] }) };
    }
    const payload = JSON.parse(options.body);
    state = payload.action === "acknowledge" ? "acknowledged" : payload.action === "start" ? "started" : "completed";
    return { ok: true, json: async () => ({ ok: true, storage_mode: "team_remote", assignment: { ...assignment, state } }) };
  };

  const loaded = await loadPlayerAssignment({ storage, fetchImpl });
  assert.equal(loaded.assignment.playerIdentity, "player@example.com");
  assert.equal(loaded.assignment.state, "assigned");
  for (const [action, expected] of [["acknowledge", "acknowledged"], ["start", "started"], ["complete", "completed"]]) {
    const updated = await updatePlayerAssignmentState({ teamId: "team-a", action, storage, fetchImpl });
    assert.equal(updated.ok, true);
    assert.equal(updated.assignment.state, expected);
  }
  assert.equal(getPlayerAssignmentLocal({ teamId: "team-a", playerIdentity: "player@example.com", storage }).state, "completed");
});

test("database, API, and UI contracts preserve role boundaries and acknowledgment evidence", () => {
  const migration = fs.readFileSync(new URL("../migrations/038_player_assignments.sql", import.meta.url), "utf8");
  const api = fs.readFileSync(new URL("../functions/v1/player-assignments/index.js", import.meta.url), "utf8");
  const coach = fs.readFileSync(new URL("../src/lib/coachFollowUpEnhancer.js", import.meta.url), "utf8");
  const player = fs.readFileSync(new URL("../src/components/PlayerCoachAssignmentCard.jsx", import.meta.url), "utf8");
  const bootstrap = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");

  assert.match(migration, /create table if not exists public\.player_assignments/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.player_assignments from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.player_assignments to service_role/i);
  assert.match(migration, /Private coach notes are never stored here/i);
  assert.match(api, /writableTeamIds\.has\(teamId\)/);
  assert.match(api, /active_player_required/);
  assert.match(api, /invalid_state_transition/);
  assert.match(api, /player_identity=eq/);
  assert.doesNotMatch(api, /private_note|coach_follow_ups/);
  assert.match(coach, /Deliver next assignment/);
  assert.match(coach, /coach-player-assignment-status/);
  assert.match(coach, /Private coach notes remain coach-only/);
  assert.match(player, /player-coach-assignment/);
  assert.match(player, /Acknowledge assignment/);
  assert.match(player, /Start assignment/);
  assert.match(player, /Mark assignment complete/);
  assert.match(bootstrap, /installPlayerAssignmentEnhancer\(\)/);
});
