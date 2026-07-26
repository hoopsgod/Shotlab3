import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCoachPlayerDashboardRows,
  filterCoachPlayerDashboardRows,
  buildCoachPlayerDashboardMetrics,
  buildCoachEventDashboardRows,
  filterCoachEventDashboardRows,
  buildCoachEventDashboardMetrics,
  buildCoachPageDashboardSummary,
} from "../src/lib/coachOperationalDashboard.js";

const players = [
  { id: "coach", email: "coach@example.com", name: "Demo Coach", role: "coach", isCoach: true },
  { id: "p1", email: "active@example.com", name: "Active Player", role: "player" },
  { id: "p2", email: "quiet@example.com", name: "Quiet Player", role: "player" },
  { id: "p3", email: "new@example.com", name: "New Player", role: "player" },
];

const scores = [
  { id: "s1", email: "active@example.com", date: "2026-07-25", score: 42 },
  { id: "s2", email: "quiet@example.com", date: "2026-07-01", score: 20 },
];

const shotLogs = [
  { id: "h1", email: "active@example.com", date: "2026-07-25", made: 75 },
  { id: "h2", email: "quiet@example.com", date: "2026-07-01", made: 20 },
];

const rsvps = [
  { id: "r1", eventId: "e1", email: "active@example.com" },
  { id: "r2", eventId: "e1", email: "quiet@example.com" },
];

const scLogs = [{ id: "l1", email: "active@example.com", date: "2026-07-25" }];

test("player dashboard rows derive active, attention, and new states without coach identities", () => {
  const rows = buildCoachPlayerDashboardRows({ players, scores, shotLogs, rsvps, scLogs, weekStart: "2026-07-20" });
  assert.equal(rows.length, 3);
  assert.equal(rows.some((row) => row.email === "coach@example.com"), false);
  assert.equal(rows.find((row) => row.email === "active@example.com")?.statusKey, "active");
  assert.equal(rows.find((row) => row.email === "quiet@example.com")?.statusKey, "attention");
  assert.equal(rows.find((row) => row.email === "new@example.com")?.statusKey, "new");
  assert.equal(rows.find((row) => row.email === "active@example.com")?.weeklyMakes, 75);
});

test("player metrics and filters drive interactive roster views", () => {
  const rows = buildCoachPlayerDashboardRows({ players, scores, shotLogs, rsvps, scLogs, weekStart: "2026-07-20" });
  const metrics = buildCoachPlayerDashboardMetrics(rows);
  assert.deepEqual({ total: metrics.total, active: metrics.active, attention: metrics.attention, weeklyMakes: metrics.weeklyMakes }, { total: 3, active: 1, attention: 2, weeklyMakes: 75 });
  assert.equal(filterCoachPlayerDashboardRows(rows, { filter: "attention" }).length, 2);
  assert.equal(filterCoachPlayerDashboardRows(rows, { filter: "all", query: "active" }).length, 1);
  assert.equal(filterCoachPlayerDashboardRows(rows, { filter: "leaders" })[0]?.email, "active@example.com");
});

test("event dashboard rows expose RSVP gaps and ignore coach identities in roster capacity", () => {
  const events = [
    { id: "e1", title: "Practice", type: "run", date: "2026-07-27", time: "6:00 PM" },
    { id: "e2", title: "Film", type: "recovery", date: "2026-07-10", time: "4:00 PM" },
  ];
  const rows = buildCoachEventDashboardRows({ events, rsvps, roster: players, today: "2026-07-26" });
  assert.equal(rows.find((row) => row.key === "e1")?.confirmed, 2);
  assert.equal(rows.find((row) => row.key === "e1")?.missing, 1);
  assert.equal(rows.find((row) => row.key === "e1")?.needsResponse, true);
  assert.equal(filterCoachEventDashboardRows(rows, { status: "gaps" }).length, 1);
  assert.equal(filterCoachEventDashboardRows(rows, { status: "past" }).length, 1);
  const metrics = buildCoachEventDashboardMetrics(rows);
  assert.equal(metrics.upcoming, 1);
  assert.equal(metrics.past, 1);
  assert.equal(metrics.responseRate, 67);
});

test("remaining coach pages receive shared dashboard summaries", () => {
  const summary = buildCoachPageDashboardSummary({
    drills: [{ id: 1 }],
    programDrills: [{ id: 2 }, { id: 3 }],
    scSessions: [{ id: 4 }],
    scRsvps: [{ id: 5 }, { id: 6 }],
    scLogs: [{ id: 7 }],
    leaderboardRows: [{ name: "Leader" }],
    activityRows: [{ id: 8 }, { id: 9 }],
    seasonArchives: [{ id: 10 }],
  });
  assert.equal(summary.drills.total, 3);
  assert.equal(summary.strength.rsvps, 2);
  assert.equal(summary.leaderboards.leader.name, "Leader");
  assert.equal(summary.archives.total, 1);
});
