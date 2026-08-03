import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildAssignmentDeadlineMap } from "../src/lib/coachAssignmentDeadlineEnhancer.js";
import {
  assignmentDateKey,
  assignmentDueDateFromOffset,
  formatAssignmentDueDate,
  isAssignmentOverdue,
  normalizeAssignmentDueDate,
} from "../src/lib/assignmentDeadline.js";
import { savePlayerAssignment } from "../src/lib/playerAssignmentService.js";

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test("assignment deadlines accept only real date-only values", () => {
  assert.equal(normalizeAssignmentDueDate("2026-08-05"), "2026-08-05");
  assert.equal(normalizeAssignmentDueDate("2026-02-29"), "");
  assert.equal(normalizeAssignmentDueDate("08/05/2026"), "");
  assert.equal(normalizeAssignmentDueDate(""), "");
});

test("deadline helpers use local calendar days without UTC drift", () => {
  const noon = new Date(2026, 7, 2, 12, 0, 0);
  assert.equal(assignmentDateKey(noon), "2026-08-02");
  assert.equal(assignmentDueDateFromOffset(1, noon), "2026-08-03");
  assert.equal(assignmentDueDateFromOffset(7, noon), "2026-08-09");
  assert.match(formatAssignmentDueDate("2026-08-05"), /Aug/i);
});

test("only incomplete work past its calendar deadline is overdue", () => {
  const now = new Date(2026, 7, 5, 12, 0, 0);
  assert.equal(isAssignmentOverdue({ dueDate: "2026-08-04", state: "assigned", now }), true);
  assert.equal(isAssignmentOverdue({ dueDate: "2026-08-05", state: "started", now }), false);
  assert.equal(isAssignmentOverdue({ dueDate: "2026-08-04", state: "completed", now }), false);
  assert.equal(isAssignmentOverdue({ dueDate: "", state: "assigned", now }), false);
});

test("coach deadline map is identity-scoped and marks only incomplete past-due work", () => {
  const now = new Date(2026, 7, 5, 12, 0, 0);
  const map = buildAssignmentDeadlineMap([
    { playerIdentity: "A@EXAMPLE.COM", dueDate: "2026-08-04", state: "started" },
    { player_identity: "b@example.com", due_date: "2026-08-04", state: "completed" },
    { playerIdentity: "c@example.com", dueDate: "", state: "assigned" },
  ], { now });
  assert.equal(map.size, 2);
  assert.equal(map.get("a@example.com").overdue, true);
  assert.equal(map.get("b@example.com").overdue, false);
});

test("assignment service normalizes and sends an optional due date without private data", async () => {
  const storage = memoryStorage({ "sl:session": { email: "coach@example.com", role: "coach", teamId: "team-a" } });
  let payload = null;
  const result = await savePlayerAssignment({
    teamId: "team-a",
    playerIdentity: "player@example.com",
    playerName: "Player One",
    assignmentText: "Complete the shooting ladder.",
    dueDate: "2026-08-05",
    storage,
    fetchImpl: async (_url, options) => {
      payload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          ok: true,
          storage_mode: "team_remote",
          assignment: {
            team_id: "team-a",
            player_identity: "player@example.com",
            player_name: "Player One",
            assignment_text: "Complete the shooting ladder.",
            result_detail: "",
            due_date: "2026-08-05",
            state: "assigned",
            assigned_by: "coach@example.com",
          },
        }),
      };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.assignment.dueDate, "2026-08-05");
  assert.equal(payload.assignment.due_date, "2026-08-05");
  assert.equal("note" in payload.assignment, false);
  assert.equal("private_note" in payload.assignment, false);
});

test("database and app contracts keep deadlines optional, direct, and date-only", () => {
  const migration = fs.readFileSync(new URL("../migrations/039_player_assignment_due_dates.sql", import.meta.url), "utf8");
  const api = fs.readFileSync(new URL("../functions/v1/player-assignments/index.js", import.meta.url), "utf8");
  const service = fs.readFileSync(new URL("../src/lib/playerAssignmentService.js", import.meta.url), "utf8");
  const quickAssign = fs.readFileSync(new URL("../src/lib/coachQuickAssignEnhancer.js", import.meta.url), "utf8");
  const playerCard = fs.readFileSync(new URL("../src/components/PlayerCoachAssignmentCard.jsx", import.meta.url), "utf8");
  const bootstrap = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");

  assert.match(migration, /add column if not exists due_date date/i);
  assert.match(migration, /timezone drift/i);
  assert.match(api, /due_date/);
  assert.match(api, /invalid_due_date/);
  assert.match(service, /dueDate/);
  assert.match(quickAssign, /coach-quick-assign-due-date/);
  assert.match(quickAssign, /setDueDate\(""\)/);
  assert.match(quickAssign, /savePlayerAssignment\([\s\S]*dueDate/);
  assert.doesNotMatch(quickAssign, /window\.fetch\s*=/);
  assert.match(playerCard, /player-assignment-due-date/);
  assert.match(bootstrap, /installCoachAssignmentDeadlineEnhancer\(\)/);
  assert.doesNotMatch(bootstrap, /installCoachQuickAssignDeadlineEnhancer/);
  assert.doesNotMatch(migration, /private_note|coach_note/i);
});
