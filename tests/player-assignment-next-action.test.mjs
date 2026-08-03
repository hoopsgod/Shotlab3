import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { derivePlayerAssignmentPriority } from "../src/lib/playerAssignmentPriority.js";

const base = {
  assignmentText: "Complete the five-spot shooting ladder.",
  dueDate: "2026-08-05",
};

test("assignment priority advances through acknowledge, start, and complete without skipping states", () => {
  const assigned = derivePlayerAssignmentPriority({ ...base, state: "assigned" }, { now: new Date(2026, 7, 4, 12) });
  assert.equal(assigned.priorityState, "assigned");
  assert.equal(assigned.steps[0].active, true);
  assert.deepEqual(assigned.steps.map((step) => step.done), [false, false, false]);

  const acknowledged = derivePlayerAssignmentPriority({ ...base, state: "acknowledged" }, { now: new Date(2026, 7, 4, 12) });
  assert.equal(acknowledged.priorityState, "acknowledged");
  assert.deepEqual(acknowledged.steps.map((step) => step.done), [true, false, false]);
  assert.equal(acknowledged.steps[1].active, true);

  const started = derivePlayerAssignmentPriority({ ...base, state: "started" }, { now: new Date(2026, 7, 4, 12) });
  assert.equal(started.priorityState, "started");
  assert.deepEqual(started.steps.map((step) => step.done), [true, true, false]);
  assert.equal(started.steps[2].active, true);

  const completed = derivePlayerAssignmentPriority({ ...base, state: "completed" }, { now: new Date(2026, 7, 6, 12) });
  assert.equal(completed.priorityState, "complete");
  assert.equal(completed.complete, true);
  assert.equal(completed.overdue, false);
  assert.deepEqual(completed.steps.map((step) => step.done), [true, true, true]);
});

test("overdue incomplete work becomes the highest player urgency while completed work never stays overdue", () => {
  const overdue = derivePlayerAssignmentPriority({ ...base, dueDate: "2026-08-03", state: "started" }, { now: new Date(2026, 7, 4, 12) });
  assert.equal(overdue.priorityState, "overdue");
  assert.equal(overdue.overdue, true);
  assert.match(overdue.title, /needs attention/i);
  assert.match(overdue.summary, /finish/i);

  const completed = derivePlayerAssignmentPriority({ ...base, dueDate: "2026-08-03", state: "completed" }, { now: new Date(2026, 7, 4, 12) });
  assert.equal(completed.overdue, false);
  assert.equal(completed.priorityState, "complete");
});

test("source contracts promote the existing assignment card without introducing another write path", () => {
  const card = fs.readFileSync(new URL("../src/components/PlayerCoachAssignmentCard.jsx", import.meta.url), "utf8");
  const enhancer = fs.readFileSync(new URL("../src/lib/playerAssignmentEnhancer.js", import.meta.url), "utf8");
  const service = fs.readFileSync(new URL("../src/lib/playerAssignmentService.js", import.meta.url), "utf8");

  assert.match(enhancer, /player-daily-primary-action/);
  assert.match(enhancer, /before-generic-primary/);
  assert.match(enhancer, /insertBefore\(nextHost, genericHero\)/);
  assert.match(card, /derivePlayerAssignmentPriority/);
  assert.match(card, /player-assignment-progress/);
  assert.match(card, /player-assignment-step-acknowledge/);
  assert.match(card, /player-assignment-step-start/);
  assert.match(card, /player-assignment-step-complete/);
  assert.match(card, /updatePlayerAssignmentState/);
  assert.doesNotMatch(card, /private_note|coach_follow_ups/);
  assert.doesNotMatch(enhancer, /fetch\s*=|XMLHttpRequest|\/v1\/player-assignments/);
  assert.match(service, /invalid_state_transition|updatePlayerAssignmentState/);
});
