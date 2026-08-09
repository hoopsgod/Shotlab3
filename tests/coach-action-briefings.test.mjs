import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildCoachEventActionBriefing,
  buildCoachPlayerActionBriefing,
  formatCoachScheduleDate,
} from "../src/lib/coachActionBriefings.js";

const dashboardSource = fs.readFileSync(new URL("../src/components/CoachInteractiveDashboards.jsx", import.meta.url), "utf8");
const enhancerSource = fs.readFileSync(new URL("../scripts/apply-expert-app-review-v2.mjs", import.meta.url), "utf8");
const phase5bSource = fs.readFileSync(new URL("../scripts/apply-phase5b-practice-readiness.mjs", import.meta.url), "utf8");

test("player briefing gives a real setup action before roster data exists", () => {
  const model = buildCoachPlayerActionBriefing();
  assert.equal(model.total, 0);
  assert.equal(model.activeRate, 0);
  assert.equal(model.decision.title, "Build the roster intelligence signal");
  assert.deepEqual(model.decision.action, { kind: "add-player", label: "Add Player" });
  assert.equal(model.insights.length, 3);
});

test("player briefing names the attention queue without inventing performance claims", () => {
  const rows = [
    { name: "Alex Morgan", statusKey: "active", engagementScore: 8, weeklyMakes: 120, weeklyActivityCount: 3 },
    { name: "Ryan Lee", statusKey: "new", engagementScore: 0 },
    { name: "Avery Stone", statusKey: "attention", engagementScore: 2 },
    { name: "Mia Reed", statusKey: "attention", engagementScore: 1 },
  ];
  const model = buildCoachPlayerActionBriefing({ metrics: { total: 4, active: 1, leader: rows[0] }, rows });
  assert.equal(model.activeRate, 25);
  assert.equal(model.attentionRows.length, 3);
  assert.equal(model.decision.tone, "attention");
  assert.match(model.insights[0].body, /Ryan, Avery, Mia need a direct next step/);
  assert.doesNotMatch(JSON.stringify(model), /percentile|top \d+%|better than/i);
});

test("singular player briefing uses polished agreement", () => {
  const model = buildCoachPlayerActionBriefing({ metrics: { total: 1, active: 0 }, rows: [{ name: "Ryan Lee", statusKey: "new", engagementScore: 0 }] });
  assert.equal(model.decision.title, "1 player needs a coaching touchpoint");
  assert.match(model.decision.detail, /1 player has no recorded activity/);
});

test("healthy player briefing prioritizes recognition and keeps exact evidence", () => {
  const rows = [
    { name: "Emma North", statusKey: "active", engagementScore: 12, weeklyMakes: 240, weeklyActivityCount: 5 },
    { name: "Jayden Cole", statusKey: "active", engagementScore: 9, weeklyMakes: 180, weeklyActivityCount: 4 },
  ];
  const model = buildCoachPlayerActionBriefing({ metrics: { total: 2, active: 2, leader: rows[0] }, rows });
  assert.equal(model.activeRate, 100);
  assert.equal(model.decision.tone, "positive");
  assert.equal(model.insights[1].title, "Emma North");
  assert.deepEqual(model.insights[2].progress, { value: 2, max: 2, label: "Weekly roster activation", detail: "2 of 2" });
});

test("event briefing creates a useful empty-calendar action", () => {
  const model = buildCoachEventActionBriefing({ metrics: { total: 0, upcoming: 0, awaitingResponse: 0, responseRate: 0 }, rows: [] });
  assert.equal(model.decision.title, "Calendar is open");
  assert.deepEqual(model.decision.action, { kind: "create-event", label: "Create Event" });
  assert.equal(model.insights[1].title, "No RSVP signal yet");
});

test("event briefing uses RSVP coverage and refuses future attendance inference", () => {
  const next = {
    title: "Team Practice",
    date: "2026-08-08",
    time: "6:30 PM",
    location: "Main Gym",
    rosterCount: 10,
    responded: 8,
    awaitingResponse: 2,
    event: { id: "event-8" },
  };
  const rows = [{ title: "Team Practice", needsResponse: true }, { title: "Film", needsResponse: false }];
  const model = buildCoachEventActionBriefing({ metrics: { next, total: 4, upcoming: 2, awaitingResponse: 2, responded: 8, responseRate: 80, past: 2 }, rows });
  assert.equal(model.nextId, "event-8");
  assert.equal(model.decision.tone, "attention");
  assert.deepEqual(model.decision.action, { kind: "open-event", id: "event-8", label: "Resolve RSVPs" });
  assert.match(model.decision.detail, /8 RSVPs received · 2 awaiting response/);
  assert.equal(model.insights[0].title, "2 awaiting responses");
  assert.equal(model.insights[1].title, "8 of 10 RSVP'd");
  assert.match(model.insights[1].body, /does not infer future attendance/);
  assert.deepEqual(model.insights[1].progress, { value: 8, max: 10, label: "Next-session RSVP coverage", detail: "80% responded" });
  assert.equal(model.insights[2].title, "80% roster response");
});

test("event briefing recognizes complete RSVP coverage without claiming attendance", () => {
  const next = { title: "Game", date: "2026-08-09", time: "4:00 PM", location: "Field House", rosterCount: 12, responded: 12, awaitingResponse: 0, id: 12 };
  const model = buildCoachEventActionBriefing({ metrics: { next, total: 3, upcoming: 1, awaitingResponse: 0, responded: 12, responseRate: 100, past: 2 }, rows: [{ needsResponse: false }] });
  assert.equal(model.decision.tone, "positive");
  assert.deepEqual(model.decision.action, { kind: "open-event", id: 12, label: "Open Event" });
  assert.equal(model.insights[0].title, "RSVP coverage is complete");
  assert.equal(model.insights[1].title, "12 of 12 RSVP'd");
  assert.doesNotMatch(JSON.stringify(model), /unavailable|attending/);
});

test("schedule formatting and dashboard integration remain stable", () => {
  assert.equal(formatCoachScheduleDate("2026-08-08"), "Aug 8");
  assert.match(formatCoachScheduleDate("2026-08-08", { weekday: true }), /Sat, Aug 8/);
  assert.match(dashboardSource, /buildCoachEventActionBriefing\(\{ metrics, rows \}\)/);
  assert.match(enhancerSource, /path === "src\/components\/CoachInteractiveDashboards\.jsx"/);
  assert.match(phase5bSource, /Awaiting RSVP/);
  assert.match(phase5bSource, /Next-session RSVP coverage/);
});
