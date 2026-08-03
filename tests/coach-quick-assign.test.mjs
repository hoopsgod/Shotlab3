import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildRecentAssignmentOptions, classifyQuickAssignResult } from "../src/lib/coachQuickAssignEnhancer.js";

test("recent assignment options are latest-first, unique, bounded, and text-only", () => {
  const options = buildRecentAssignmentOptions([
    {
      assignmentText: "  Complete the form shooting ladder.  ",
      resultDetail: "Private result context must not appear.",
      updatedAt: "2026-08-02T17:00:00.000Z",
    },
    {
      assignment_text: "complete   the form shooting ladder.",
      private_note: "Private note must not appear.",
      updated_at: "2026-08-02T18:00:00.000Z",
    },
    { assignmentText: "Make 50 game-speed finishes.", updatedAt: "2026-08-02T19:00:00.000Z" },
    { assignmentText: "Record 25 free throws.", updatedAt: "2026-08-02T16:00:00.000Z" },
    { assignmentText: "Complete the ball-handling circuit.", updatedAt: "2026-08-02T15:00:00.000Z" },
    { assignmentText: "Log a five-spot shooting workout.", updatedAt: "2026-08-02T14:00:00.000Z" },
    { assignmentText: "", updatedAt: "2026-08-02T20:00:00.000Z" },
  ]);

  assert.deepEqual(options, [
    "Make 50 game-speed finishes.",
    "complete   the form shooting ladder.",
    "Record 25 free throws.",
    "Complete the ball-handling circuit.",
  ]);
  assert.equal(options.some((text) => /private|result context/i.test(text)), false);
});

test("recent assignment option limit is safely bounded", () => {
  const assignments = Array.from({ length: 10 }, (_, index) => ({
    assignmentText: `Assignment ${index}`,
    updatedAt: `2026-08-02T${String(index).padStart(2, "0")}:00:00.000Z`,
  }));
  assert.equal(buildRecentAssignmentOptions(assignments, { limit: 100 }).length, 6);
  assert.deepEqual(buildRecentAssignmentOptions(assignments, { limit: 0 }), []);
});

test("quick assign distinguishes verified delivery from local-only storage", () => {
  const delivered = classifyQuickAssignResult({
    ok: true,
    storageMode: "team_remote",
    message: "Assignment delivered to the player.",
  });
  assert.equal(delivered.state, "delivered");
  assert.equal(delivered.delivered, true);
  assert.equal(delivered.retryable, false);

  const demo = classifyQuickAssignResult({
    ok: true,
    storageMode: "demo_local",
    message: "Assignment saved in this demo session.",
  });
  assert.equal(demo.state, "local");
  assert.equal(demo.delivered, false);
  assert.match(demo.message, /demo session/i);

  const local = classifyQuickAssignResult({
    ok: true,
    storageMode: "local_only",
    message: "Assignment saved on this device only.",
  });
  assert.equal(local.state, "local");
  assert.equal(local.delivered, false);
  assert.match(local.message, /device only/i);
});

test("quick assign remote failure is honest and retryable only after local save", () => {
  const retryable = classifyQuickAssignResult({
    ok: false,
    localSaved: true,
    storageMode: "local_fallback",
    message: "Saved locally, but player delivery sync failed.",
  });
  assert.equal(retryable.state, "error");
  assert.equal(retryable.delivered, false);
  assert.equal(retryable.retryable, true);
  assert.match(retryable.message, /delivery sync failed/i);

  const rejected = classifyQuickAssignResult({
    ok: false,
    message: "A player and assignment are required.",
  });
  assert.equal(rejected.state, "error");
  assert.equal(rejected.retryable, false);
});

test("Mission Control recent assignments reuse only assignment text through the existing secure write boundary", () => {
  const source = fs.readFileSync(new URL("../src/lib/coachQuickAssignEnhancer.js", import.meta.url), "utf8");

  assert.match(source, /loadTeamPlayerAssignments/);
  assert.match(source, /buildRecentAssignmentOptions/);
  assert.match(source, /Recent assignments/);
  assert.match(source, /Recent assignment loaded\. Review it before delivery\./);
  assert.match(source, /savePlayerAssignment/);
  assert.match(source, /data-assignment-state="unassigned"/);
  assert.match(source, /stopImmediatePropagation/);
  assert.match(source, /COACH_QUICK_ASSIGN_OPEN_EVENT/);
  assert.match(source, /QUICK_ASSIGN_MAX_LENGTH = 4000/);
  assert.match(source, /resultDetail: ""/);
  assert.match(source, /This action sends only the assignment text/);
  assert.doesNotMatch(source, /saveCoachFollowUp/);
  assert.match(source, /deliveryState === "delivered" \|\| deliveryState === "local"/);
  assert.match(source, /Open full player/);
});
