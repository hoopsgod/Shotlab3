import test from "node:test";
import assert from "node:assert/strict";

import { buildCoachInboxModel } from "../src/lib/coachInbox.js";

test("coach inbox combines truthful follow-up and activation actions without inventing alerts", () => {
  const model = buildCoachInboxModel({
    attentionItems: [
      { name: "Ari", detail: "No activity in seven days", meta: "Last active Jul 24", actionLabel: "Review" },
      { title: "Tamaya", detail: "Account setup is incomplete" },
    ],
    activationPath: {
      complete: false,
      next: { id: "first-session", title: "Schedule the first team session", detail: "Give players a reason to open ShotLab.", label: "Create session", action: "schedule-session" },
    },
    hasScheduledSession: false,
  });

  assert.equal(model.actionableCount, 3);
  assert.deepEqual(model.items.map((item) => item.kind), ["attention", "attention", "activation"]);
  assert.deepEqual(model.items.map((item) => item.title), ["Ari", "Tamaya", "Schedule the first team session"]);
  assert.equal(model.items[0].sourceIndex, 0);
  assert.equal(model.items[2].action, "schedule-session");
});

test("coach inbox shows the upcoming session as context once activation is complete", () => {
  const model = buildCoachInboxModel({
    attentionItems: [],
    activationPath: { complete: true, next: null },
    hasScheduledSession: true,
    nextEventDateFormatted: "Mon, Aug 3 at 6:00 PM",
  });

  assert.equal(model.actionableCount, 0);
  assert.equal(model.allClear, true);
  assert.deepEqual(model.items, []);
  assert.deepEqual(model.context, {
    kind: "session",
    title: "Next team session",
    detail: "Mon, Aug 3 at 6:00 PM",
    label: "Open session",
    action: "open-session",
  });
});

test("coach inbox omits false session context and handles malformed collections safely", () => {
  const model = buildCoachInboxModel({
    attentionItems: null,
    activationPath: null,
    hasScheduledSession: false,
    nextEventDateFormatted: "None",
  });

  assert.deepEqual(model.items, []);
  assert.equal(model.actionableCount, 0);
  assert.equal(model.context, null);
  assert.equal(model.allClear, true);
});
