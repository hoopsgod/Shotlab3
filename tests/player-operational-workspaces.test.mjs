import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildAtHomeWorkspaceModel,
  buildProgramWorkspaceModel,
  buildEventsWorkspaceModel,
  buildStrengthWorkspaceModel,
  buildLeaderboardWorkspaceModel,
  buildProfileWorkspaceModel,
  filterAtHomeDrills,
  filterProgramSessionBlocks,
} from "../src/lib/playerOperationalWorkspaces.js";

const today = "2026-07-27";
const email = "player@example.com";
const teamId = "team-1";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("At Home workspace prioritizes the next unfinished drill and filters rows", () => {
  const drills = [{ id: "d1", name: "Form" }, { id: "d2", name: "Volume" }];
  const scores = [{ drillId: "d1", email, teamId, date: today, score: 10 }];
  const model = buildAtHomeWorkspaceModel({ today, userEmail: email, teamId, drills, todayScores: scores, shotLogs: [{ email, teamId, date: today, made: 35 }], streak: 3, dailyGoal: 100 });
  assert.equal(model.primaryAction.drillId, "d2");
  assert.equal(model.metrics.find((metric) => metric.id === "open").value, 1);
  assert.deepEqual(filterAtHomeDrills({ drills, todayScores: scores, filter: "open" }).map((row) => row.id), ["d2"]);
  assert.deepEqual(filterAtHomeDrills({ drills, todayScores: scores, filter: "completed" }).map((row) => row.id), ["d1"]);
});

test("At Home completion ignores scores from unrelated drill collections", () => {
  const drills = [{ id: "d1", name: "Form" }, { id: "d2", name: "Volume" }];
  const scores = [
    { drillId: "d1", email, teamId, date: today, score: 10 },
    { drillId: "program-only", email, teamId, date: today, score: 999 },
  ];
  const model = buildAtHomeWorkspaceModel({ today, userEmail: email, teamId, drills, todayScores: scores });
  assert.equal(model.metrics.find((metric) => metric.id === "complete").value, 1);
  assert.equal(model.metrics.find((metric) => metric.id === "open").value, 1);
});

test("Program workspace identifies coach priority and preserves phase filtering", () => {
  const drills = [{ id: "p1", name: "Form Shooting" }, { id: "p2", name: "Game Speed Reads" }];
  const scores = [{ drillId: "p1", score: 18 }];
  const model = buildProgramWorkspaceModel({ programDrills: drills, todayScores: scores, allScores: scores, coachPriorities: { priorityDrillText: "Game Speed Reads" } });
  assert.equal(model.primaryAction.drillId, "p2");
  assert.equal(model.metrics.find((metric) => metric.id === "complete").value, 1);
  const blocks = [{ phase: "Form", drills: [drills[0]] }, { phase: "Game", drills: [drills[1]] }];
  assert.deepEqual(filterProgramSessionBlocks({ blocks, todayScores: scores, filter: "open" }).map((block) => block.phase), ["Game"]);
});

test("Program workspace never reopens a completed coach priority", () => {
  const drills = [{ id: "p1", name: "Form Shooting" }, { id: "p2", name: "Game Speed Reads" }];
  const model = buildProgramWorkspaceModel({
    programDrills: drills,
    todayScores: [{ drillId: "p1", score: 18 }],
    allScores: [{ drillId: "p1", score: 18 }, { drillId: "home-only", score: 999 }],
    coachPriorities: { priorityDrillText: "Form Shooting" },
  });
  assert.equal(model.primaryAction.drillId, "p2");
  assert.equal(model.metrics.find((metric) => metric.id === "pb").value, 18);
});

test("Events workspace prioritizes unresolved attendance", () => {
  const events = [
    { id: "e1", teamId, date: "2026-07-28", time: "6:00 PM", title: "Practice" },
    { id: "e2", teamId, date: "2026-07-30", time: "7:00 PM", title: "Open Gym" },
  ];
  const model = buildEventsWorkspaceModel({ events, rsvps: [{ eventId: "e2", email, teamId }], userEmail: email, teamId, today });
  assert.equal(model.primaryAction.eventId, "e1");
  assert.equal(model.metrics.find((metric) => metric.id === "missing").value, 1);
  assert.equal(model.metrics.find((metric) => metric.id === "confirmed").value, 1);
});

test("Strength workspace separates commitments and logged work", () => {
  const sessions = [{ id: "s1", teamId, date: "2026-07-28", time: "8:00 AM", sport: "Lift" }];
  const model = buildStrengthWorkspaceModel({ sessions, rsvps: [], logs: [{ email, teamId, date: today, sport: "Basketball" }], userEmail: email, teamId, today });
  assert.equal(model.primaryAction.sessionId, "s1");
  assert.equal(model.metrics.find((metric) => metric.id === "logged").value, 1);
});

test("Leaderboard workspace calculates rank gap", () => {
  const model = buildLeaderboardWorkspaceModel({ rows: [{ email: "leader@example.com", total: 140 }, { email, total: 110 }], userEmail: email, weeklyMakes: 75, streak: 4 });
  assert.equal(model.metrics.find((metric) => metric.id === "rank").value, "#2");
  assert.equal(model.metrics.find((metric) => metric.id === "gap").value, 30);
});

test("Profile workspace scopes activity to the active player and team", () => {
  const model = buildProfileWorkspaceModel({
    shotLogs: [{ email, teamId, made: 50 }, { email: "other@example.com", teamId, made: 500 }],
    scores: [{ email, teamId, score: 21 }],
    rsvps: [{ email, teamId, eventId: "e1" }],
    scLogs: [{ email, teamId, sport: "Basketball" }],
    userEmail: email,
    teamId,
    streak: 2,
  });
  assert.equal(model.metrics.find((metric) => metric.id === "makes").value, 50);
  assert.equal(model.metrics.find((metric) => metric.id === "best").value, 21);
  assert.equal(model.metrics.find((metric) => metric.id === "events").value, 1);
});

test("Workspace metrics expose click affordances only when they perform an action", async () => {
  const component = await read("src/components/PlayerOperationalWorkspace.jsx");
  const styles = await read("src/components/PlayerOperationalWorkspace.module.css");
  assert.match(component, /Boolean\(metric\?\.filter \|\| metric\?\.action\)/);
  assert.match(component, /data-interactive="false"/);
  assert.match(component, /data-interactive="true"/);
  assert.match(styles, /\.metricInteractive\{cursor:pointer\}/);
  assert.match(styles, /\.metricStatic\{/);
  assert.match(styles, /prefers-reduced-motion/);
});
