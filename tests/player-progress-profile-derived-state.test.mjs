import test from "node:test";
import assert from "node:assert/strict";
import { derivePlayerProgressProfile } from "../src/lib/progressProfile.js";

test("player progress profile derives metrics from existing app state only", () => {
  const result = derivePlayerProgressProfile({
    playerEmail: "player@team.com",
    shotLogs: [
      { email: "player@team.com", made: 20, date: "2026-05-10" },
      { email: "player@team.com", made: 12, date: "2026-05-09" },
    ],
    scores: [{ email: "player@team.com", score: 8, date: "2026-05-08" }],
    rsvps: [{ email: "player@team.com", eventId: "e1" }],
    events: [{ id: "e1" }, { id: "e2" }],
    players: [{ email: "player@team.com" }],
    now: "2026-05-10T12:00:00.000Z",
  });

  assert.equal(result.totalAtHomeShots, 32);
  assert.equal(result.currentStreak, 2);
  assert.equal(result.weeklyActivityCount, 2);
  assert.equal(result.eventsAttended, 1);
  assert.equal(result.rsvpParticipationRate, 50);
  assert.equal(result.sevenDayTrend.length, 7);
});

test("player progress profile empty state for new players", () => {
  const result = derivePlayerProgressProfile({
    playerEmail: "new@team.com",
    shotLogs: [],
    scores: [],
    rsvps: [],
    events: [],
    players: [],
    now: "2026-05-10T12:00:00.000Z",
  });
  assert.equal(result.isEmpty, true);
  assert.equal(result.totalAtHomeShots, 0);
  assert.equal(result.currentStreak, 0);
});
