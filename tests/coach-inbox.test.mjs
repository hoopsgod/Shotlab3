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

test("coach inbox promotes the next event RSVP gap into an exact attendance action", () => {
  const model = buildCoachInboxModel({
    attentionItems: [],
    activationPath: { complete: true, next: null },
    hasScheduledSession: true,
    nextEventDateFormatted: "Aug 3",
    eventReadiness: {
      eventId: "practice-aug-3",
      title: "Team Practice",
      dateLabel: "Aug 3 at 6:00 PM",
      confirmed: 4,
      missing: 2,
      responseRate: 67,
    },
  });

  assert.equal(model.actionableCount, 1);
  assert.equal(model.allClear, false);
  assert.deepEqual(model.items[0], {
    kind: "event-readiness",
    title: "Team Practice",
    detail: "2 of 6 players still need to RSVP.",
    meta: "67% confirmed · Aug 3 at 6:00 PM",
    label: "Review RSVPs",
    action: "open-event-readiness",
    eventId: "practice-aug-3",
    tone: "warning",
  });
});

test("coach inbox does not create false readiness alerts for complete or malformed event data", () => {
  const complete = buildCoachInboxModel({
    attentionItems: [],
    activationPath: { complete: true, next: null },
    eventReadiness: {
      eventId: "complete-event",
      title: "Team Practice",
      confirmed: 6,
      missing: 0,
      responseRate: 100,
    },
  });
  const malformed = buildCoachInboxModel({
    attentionItems: [],
    activationPath: { complete: true, next: null },
    eventReadiness: {
      eventId: "undated-event",
      title: "Unknown event",
      confirmed: 0,
      missing: 4,
      responseRate: 0,
    },
  });

  assert.equal(complete.actionableCount, 0);
  assert.equal(malformed.actionableCount, 0);
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
