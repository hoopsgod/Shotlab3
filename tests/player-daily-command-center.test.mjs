import assert from "node:assert/strict";
import test from "node:test";
import { derivePlayerDailyCommandCenter } from "../src/lib/playerDailyCommandCenter.js";

const TODAY = "2026-07-27";
const base = {
  today: TODAY,
  now: new Date("2026-07-27T12:00:00Z"),
  userEmail: "player@example.com",
  teamId: "team-1",
  dailyGoal: 100,
  weeklyGoal: 500,
  drills: [
    { id: "form", name: "Form Shooting", desc: "Mechanics" },
    { id: "corners", name: "Corner Threes", desc: "Volume" },
  ],
  programDrills: [{ id: "finish", name: "Program Finishing" }],
  todayHomeScores: [],
  todayProgramScores: [],
  events: [],
  rsvps: [],
  scSessions: [],
  scRsvps: [],
  shotLogs: [],
  scLogs: [],
  coachPriorities: {
    priorityDrillText: "Form Shooting",
    todayFocusText: "Clean mechanics",
    challengeText: "Complete Form Shooting before adding volume.",
    updatedAt: "2026-07-27T08:00:00Z",
  },
};

test("urgent event RSVP outranks current coach-priority drill", () => {
  const model = derivePlayerDailyCommandCenter({
    ...base,
    events: [{ id: "practice", teamId: "team-1", title: "Team Practice", date: "2026-07-28", time: "6:00 PM" }],
  });
  assert.equal(model.primaryAction.kind, "event-rsvp");
  assert.equal(model.primaryAction.target, "program");
  assert.equal(model.queue[1].kind, "home-drill");
  assert.equal(model.queue[1].source, "coach");
});

test("current coach-priority drill outranks daily volume when no urgent commitment exists", () => {
  const model = derivePlayerDailyCommandCenter({ ...base, todayMakes: 20, weeklyMakes: 80 });
  assert.equal(model.primaryAction.kind, "home-drill");
  assert.equal(model.primaryAction.drillId, "form");
  assert.equal(model.primaryAction.source, "coach");
  assert.equal(model.coachSignal.freshness, "current");
  assert.equal(model.coachSignal.stale, false);
});

test("stale coach guidance is excluded from the player task queue", () => {
  const model = derivePlayerDailyCommandCenter({
    ...base,
    now: new Date("2026-07-29T12:00:00Z"),
    todayMakes: 20,
    weeklyMakes: 80,
    coachPriorities: {
      ...base.coachPriorities,
      updatedAt: "2026-07-19T08:00:00Z",
    },
  });

  assert.equal(model.coachSignal.freshness, "stale");
  assert.equal(model.coachSignal.stale, true);
  assert.equal(model.coachSignal.ageDays, 10);
  assert.equal(model.coachSignal.focus, "");
  assert.equal(model.coachSignal.priorityDrill, "");
  assert.equal(model.coachSignal.challenge, "");
  assert.equal(model.primaryAction.kind, "shots");
  assert.equal(model.queue.some((task) => task.source === "coach"), false);
});

test("daily shot target becomes primary after coach drill is complete", () => {
  const model = derivePlayerDailyCommandCenter({
    ...base,
    todayMakes: 35,
    weeklyMakes: 120,
    todayHomeScores: [{ drillId: "form", date: TODAY, score: 40 }],
  });
  assert.equal(model.primaryAction.kind, "shots");
  assert.match(model.primaryAction.title, /65 makes/);
  assert.equal(model.daily.pct, 35);
});

test("urgent S&C commitment is surfaced after the daily target is complete", () => {
  const model = derivePlayerDailyCommandCenter({
    ...base,
    todayMakes: 100,
    weeklyMakes: 400,
    todayHomeScores: [{ drillId: "form", date: TODAY, score: 40 }],
    scSessions: [{ id: "lift", teamId: "team-1", sport: "Team Lift", date: "2026-07-28", time: "8:00 AM" }],
  });
  assert.equal(model.primaryAction.kind, "sc-rsvp");
  assert.equal(model.primaryAction.target, "sc");
});

test("activation loop tracks team, training result, and team commitment", () => {
  const model = derivePlayerDailyCommandCenter({
    ...base,
    shotLogs: [{ id: "shot", email: "player@example.com", teamId: "team-1", made: 40, date: TODAY }],
    rsvps: [{ id: "rsvp", eventId: "event", email: "player@example.com", teamId: "team-1" }],
  });
  assert.equal(model.activation.complete, true);
  assert.equal(model.activation.completeCount, 3);
  assert.equal(model.activation.pct, 100);
});

test("completed day resolves to progress review rather than a dead end", () => {
  const model = derivePlayerDailyCommandCenter({
    ...base,
    todayMakes: 100,
    weeklyMakes: 500,
    todayHomeScores: [{ drillId: "form" }, { drillId: "corners" }],
    todayProgramScores: [{ drillId: "finish" }],
  });
  assert.equal(model.allCoreComplete, true);
  assert.equal(model.primaryAction.kind, "progress");
  assert.equal(model.primaryAction.target, "profile");
});