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

test("database and app contracts keep deadlines optional and date-only", () => {
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
  assert.match(playerCard, /player-assignment-due-date/);
  assert.match(bootstrap, /installCoachAssignmentDeadlineEnhancer\(\)/);
  assert.doesNotMatch(migration, /private_note|coach_note/i);
});
