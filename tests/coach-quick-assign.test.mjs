import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { classifyQuickAssignResult } from "../src/lib/coachQuickAssignEnhancer.js";

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

test("Mission Control quick assign uses the existing secure write boundary and cannot overwrite active work", () => {
  const source = fs.readFileSync(new URL("../src/lib/coachQuickAssignEnhancer.js", import.meta.url), "utf8");

  assert.match(source, /savePlayerAssignment/);
  assert.match(source, /data-assignment-state="unassigned"/);
  assert.match(source, /stopImmediatePropagation/);
  assert.match(source, /COACH_QUICK_ASSIGN_OPEN_EVENT/);
  assert.match(source, /QUICK_ASSIGN_MAX_LENGTH = 4000/);
  assert.match(source, /resultDetail: ""/);
  assert.match(source, /This action sends only the assignment text/);
  assert.doesNotMatch(source, /saveCoachFollowUp|private_note|privateNote/);
  assert.match(source, /deliveryState === "delivered" \|\| deliveryState === "local"/);
  assert.match(source, /Open full player/);
});
