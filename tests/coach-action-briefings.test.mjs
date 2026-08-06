import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildCoachEventActionBriefing,
  buildCoachPlayerActionBriefing,
  formatCoachScheduleDate,
} from "../src/lib/coachActionBriefings.js";

const dashboardSource = fs.readFileSync(new URL("../src/components/CoachInteractiveDashboards.jsx", import.meta.url), "utf8");

test("player briefing gives a real setup action before roster data exists", () => {
  const model = buildCoachPlayerActionBriefing();
  assert.equal(model.total, 0);
  assert.equal(model.activeRate, 0);
  assert.equal(model.decision.title, "Build the roster intelligence signal");
  assert.deepEqual(model.decision.action, { kind: "add-player", label: "Add Player" });
  assert.equal(model.insights.length, 3);
  assert.equal(model.insights[0].action.kind, "add-player");
});

test("player briefing names the attention queue without inventing performance claims", () => {
  const rows = [
    { name: "Alex Morgan", statusKey: "active", engagementScore: 8, weeklyMakes: 120, weeklyActivityCount: 3 },
    { name: "Ryan Lee", statusKey: "new", engagementScore: 0 },
    { name: "Avery Stone", statusKey: "attention", engagementScore: 2 },
    { name: "Mia Reed", statusKey: "attention", engagementScore: 1 },
  ];
  const model = buildCoachPlayerActionBriefing({
    metrics: { total: 4, active: 1, attention: 3, weeklyMakes: 120, weeklyActions: 6, leader: rows[0] },
    rows,
  });

  assert.equal(model.activeRate, 25);
  assert.equal(model.attentionRows.length, 3);
  assert.equal(model.noActivityRows.length, 1);
  assert.equal(model.followUpRows.length, 2);
  assert.equal(model.decision.tone, "attention");
  assert.deepEqual(model.decision.action, { kind: "filter", value: "attention", label: "Open attention queue" });
  assert.match(model.decision.detail, /1 player has no recorded activity/);
  assert.match(model.insights[0].body, /Ryan, Avery, Mia need a direct next step/);
  assert.doesNotMatch(JSON.stringify(model), /percentile|top \d+%|better than/i);
});

test("singular player briefing uses polished agreement", () => {
  const model = buildCoachPlayerActionBriefing({
    metrics: { total: 1, active: 0 },
    rows: [{ name: "Ryan Lee", statusKey: "new", engagementScore: 0 }],
  });
  assert.equal(model.decision.title, "1 player needs a coaching touchpoint");
  assert.match(model.decision.detail, /1 player has no recorded activity/);
  assert.match(model.insights[0].body, /Ryan needs a direct next step/);
});

test("healthy player briefing prioritizes recognition and keeps exact evidence", () => {
  const rows = [
    { name: "Emma North", statusKey: "active", engagementScore: 12, weeklyMakes: 240, weeklyActivityCount: 5 },
    { name: "Jayden Cole", statusKey: "active", engagementScore: 9, weeklyMakes: 180, weeklyActivityCount: 4 },
  ];
  const model = buildCoachPlayerActionBriefing({ metrics: { total: 2, active: 2, leader: rows[0] }, rows });
  assert.equal(model.activeRate, 100);
  assert.equal(model.decision.tone, "positive");
  assert.deepEqual(model.decision.action, { kind: "filter", value: "active", label: "Recognize active players" });
  assert.equal(model.insights[1].title, "Emma North");
  assert.match(model.insights[1].body, /240 weekly makes and 5 logged actions/);
  assert.deepEqual(model.insights[2].progress, { value: 2, max: 2, label: "Weekly roster activation", detail: "2 of 2" });
});

test("event briefing creates a useful empty-calendar action", () => {
  const model = buildCoachEventActionBriefing({ metrics: { total: 0, upcoming: 0, missing: 0, responseRate: 0 }, rows: [] });
  assert.equal(model.decision.title, "Calendar is open");
  assert.deepEqual(model.decision.action, { kind: "create-event", label: "Create Event" });
  assert.equal(model.insights[0].title, "No event to evaluate");
  assert.equal(model.insights[2].tone, "attention");
});

test("event briefing turns missing RSVPs into a direct attendance action", () => {
  const next = {
    title: "Team Practice",
    date: "2026-08-08",
    time: "6:30 PM",
    location: "Main Gym",
    confirmed: 7,
    missing: 3,
    event: { id: "event-8" },
  };
  const rows = [
    { title: "Team Practice", needsResponse: true },
    { title: "Film", needsResponse: false },
  ];
  const model = buildCoachEventActionBriefing({
    metrics: { next, total: 4, upcoming: 2, missing: 3, confirmed: 7, responseRate: 70, past: 2 },
    rows,
  });

  assert.equal(model.nextId, "event-8");
  assert.equal(model.decision.tone, "attention");
  assert.deepEqual(model.decision.action, { kind: "open-event", id: "event-8", label: "Manage Attendance" });
  assert.match(model.decision.detail, /7 confirmed and 3 still missing/);
  assert.equal(model.insights[0].title, "3 unresolved responses");
  assert.deepEqual(model.insights[0].action, { kind: "status-filter", value: "gaps", label: "Show Gaps" });
  assert.equal(model.insights[1].tone, "info");
});

test("event briefing recognizes a fully ready schedule", () => {
  const next = { title: "Game", date: "2026-08-09", time: "4:00 PM", location: "Field House", confirmed: 12, missing: 0, id: 12 };
  const model = buildCoachEventActionBriefing({ metrics: { next, total: 3, upcoming: 1, missing: 0, confirmed: 12, responseRate: 100, past: 2 }, rows: [{ needsResponse: false }] });
  assert.equal(model.decision.tone, "positive");
  assert.deepEqual(model.decision.action, { kind: "open-event", id: 12, label: "Open Event" });
  assert.equal(model.insights[0].title, "No RSVP gaps");
  assert.equal(model.insights[1].tone, "positive");
});

test("schedule formatting and dashboard integration remain stable", () => {
  assert.equal(formatCoachScheduleDate("2026-08-08"), "Aug 8");
  assert.match(formatCoachScheduleDate("2026-08-08", { weekday: true }), /Sat, Aug 8/);
  assert.equal(formatCoachScheduleDate("TBD"), "TBD");
  assert.match(dashboardSource, /buildCoachPlayerActionBriefing\(\{ metrics, rows \}\)/);
  assert.match(dashboardSource, /buildCoachEventActionBriefing\(\{ metrics, rows \}\)/);
  assert.match(dashboardSource, /resolvePlayerAction/);
  assert.match(dashboardSource, /resolveEventAction/);
  assert.match(dashboardSource, /coach-players-decision-brief/);
  assert.match(dashboardSource, /coach-events-decision-brief/);
});
