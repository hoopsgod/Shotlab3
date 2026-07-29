import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  deriveCoachAssignmentOutcomes,
  readCoachAssignmentOutcomesFromStorage,
} from "../src/lib/coachAssignmentOutcomes.js";

const PRIORITY = {
  todayFocusText: "Win the first three steps",
  priorityDrillText: "Form Shooting",
  challengeText: "Complete the priority before optional work.",
};

const players = [
  { id: "p1", email: "one@example.com", name: "One Player", role: "player", teamId: "team-a" },
  { id: "p2", email: "two@example.com", name: "Two Player", role: "player", teamId: "team-a" },
  { id: "p3", email: "three@example.com", name: "Three Player", role: "player", teamId: "team-a" },
  { id: "removed", email: "removed@example.com", name: "Removed Player", role: "player", teamId: "team-a", rosterStatus: "removed" },
  { id: "other", email: "other@example.com", name: "Other Team", role: "player", teamId: "team-b" },
];

const drills = [{ id: "form-shooting", name: "Form Shooting" }, { id: "corner-threes", name: "Corner Threes" }];

const base = {
  teamId: "team-a",
  prioritiesByTeam: { "team-a": PRIORITY },
  players,
  drills,
  weekStart: "2026-07-26",
};

test("current priority outcomes are derived from real roster-scoped completions", () => {
  const result = deriveCoachAssignmentOutcomes({
    ...base,
    scores: [
      { email: "one@example.com", teamId: "team-a", drillId: "form-shooting", drillName: "Form Shooting", date: "2026-07-27", score: 42 },
      { email: "two@example.com", teamId: "team-a", drillId: "corner-threes", drillName: "Corner Threes", date: "2026-07-27", score: 18 },
      { email: "removed@example.com", teamId: "team-a", drillId: "form-shooting", date: "2026-07-27", score: 50 },
      { email: "other@example.com", teamId: "team-b", drillId: "form-shooting", date: "2026-07-27", score: 50 },
    ],
  });

  assert.equal(result.trackable, true);
  assert.equal(result.priorityDrill, "Form Shooting");
  assert.equal(result.total, 3);
  assert.equal(result.completedCount, 1);
  assert.equal(result.activeOtherCount, 1);
  assert.equal(result.notStartedCount, 1);
  assert.equal(result.completionRate, 33);
  assert.equal(result.rows.find((row) => row.name === "One Player")?.status, "completed");
  assert.equal(result.rows.find((row) => row.name === "Two Player")?.status, "active-other");
  assert.equal(result.rows.find((row) => row.name === "Three Player")?.status, "not-started");
  assert.equal(result.rows.some((row) => row.name === "Removed Player"), false);
  assert.equal(result.rows.some((row) => row.name === "Other Team"), false);
});

test("program priority completion matches normalized drill identities", () => {
  const result = deriveCoachAssignmentOutcomes({
    ...base,
    prioritiesByTeam: { "team-a": { ...PRIORITY, priorityDrillText: "Program Finishing" } },
    programDrills: [{ id: "program-finishing", name: "Program Finishing" }],
    programScores: [{ email: "three@example.com", team_id: "team-a", drill_id: "program-finishing", drill_name: "Program Finishing", session_date: "2026-07-28", score: 21 }],
  });

  assert.equal(result.trackable, true);
  assert.equal(result.lane, "program");
  assert.equal(result.completedCount, 1);
  assert.equal(result.rows.find((row) => row.name === "Three Player")?.status, "completed");
});

test("old completions do not satisfy the current-week response model", () => {
  const result = deriveCoachAssignmentOutcomes({
    ...base,
    scores: [{ email: "one@example.com", teamId: "team-a", drillId: "form-shooting", date: "2026-07-20", score: 42 }],
  });
  assert.equal(result.completedCount, 0);
  assert.equal(result.notStartedCount, 3);
});

test("free-text priorities that do not match a ShotLab drill do not produce fake tracking", () => {
  const result = deriveCoachAssignmentOutcomes({
    ...base,
    prioritiesByTeam: { "team-a": { ...PRIORITY, priorityDrillText: "Be tougher today" } },
  });
  assert.equal(result.trackable, false);
  assert.equal(result.total, 0);
});

test("storage reader resolves the active coach team and persisted stores", () => {
  const values = new Map(Object.entries({
    "sl:session": JSON.stringify({ email: "coach@example.com", teamId: "team-a" }),
    "sl:coach-priorities": JSON.stringify({ "team-a": PRIORITY }),
    "sl:players": JSON.stringify(players),
    "sl:player-profiles": JSON.stringify([]),
    "sl:drills": JSON.stringify(drills),
    "sl:program-drills": JSON.stringify([]),
    "sl:scores": JSON.stringify([{ email: "one@example.com", teamId: "team-a", drillId: "form-shooting", date: "2026-07-27", score: 42 }]),
    "sl:program-scores": JSON.stringify([]),
    "sl:shotlogs": JSON.stringify([]),
    "sl:sc-logs": JSON.stringify([]),
    "sl:teams": JSON.stringify([{ id: "team-a", joinCode: "ALPHA" }]),
  }));
  const storage = { getItem: (key) => values.get(key) || null };
  const result = readCoachAssignmentOutcomesFromStorage({ storage, now: new Date("2026-07-29T12:00:00") });
  assert.equal(result.teamId, "team-a");
  assert.equal(result.completedCount, 1);
});

test("enhancer reports outcomes only and never fabricates view receipts", () => {
  const source = fs.readFileSync(new URL("../src/lib/coachAssignmentOutcomeEnhancer.js", import.meta.url), "utf8");
  assert.match(source, /completed this week/i);
  assert.match(source, /priority still open/i);
  assert.doesNotMatch(source, /viewed assignment|seen by|read receipt/i);
  assert.match(source, /coach-assignment-outcome/);
});
