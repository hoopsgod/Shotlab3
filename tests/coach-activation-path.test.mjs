import test from "node:test";
import assert from "node:assert/strict";
import { deriveCoachActivationPath } from "../src/lib/coachActivationPath.js";

const model = (overrides = {}) => deriveCoachActivationPath({
  teamCode: "TEAM01",
  rosterSize: 0,
  hasScheduledSession: false,
  activeTodayCount: 0,
  hasLiveActivity: false,
  ...overrides,
});

test("coach activation exposes one next commercial milestone at a time", () => {
  const activation = model();
  assert.equal(activation.completed, 1);
  assert.equal(activation.total, 4);
  assert.equal(activation.next.id, "first-player");
  assert.equal(activation.next.action, "add-player");
});

test("the first player advances activation to the first team session", () => {
  const activation = model({ rosterSize: 1 });
  assert.equal(activation.completed, 2);
  assert.equal(activation.next.id, "first-session");
  assert.equal(activation.next.label, "Create session");
});

test("a one-player team with a session advances to first engagement", () => {
  const activation = model({ rosterSize: 1, hasScheduledSession: true });
  assert.equal(activation.completed, 3);
  assert.equal(activation.next.id, "first-engagement");
  assert.equal(activation.progress, 75);
});

test("live activity completes activation even when active-today count is zero", () => {
  const activation = model({ rosterSize: 1, hasScheduledSession: true, hasLiveActivity: true });
  assert.equal(activation.complete, true);
  assert.equal(activation.completed, 4);
  assert.equal(activation.next, null);
});

test("established rosters do not re-enter activation when old sessions or activity age out", () => {
  const activation = model({ rosterSize: 4, hasScheduledSession: false, activeTodayCount: 0, hasLiveActivity: false });
  assert.equal(activation.complete, true);
  assert.equal(activation.completed, 4);
  assert.equal(activation.next, null);
});

test("missing team access remains the first blocking milestone", () => {
  const activation = model({ teamCode: "", rosterSize: 12, hasScheduledSession: true, activeTodayCount: 3 });
  assert.equal(activation.next.id, "team-access");
  assert.equal(activation.next.action, "team-tools");
});
