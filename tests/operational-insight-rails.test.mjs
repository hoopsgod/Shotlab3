import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  buildCoachOperationalInsightRail,
  buildPlayerOperationalInsightRail,
} from "../src/lib/operationalInsightRails.js";

const workspace = (overrides = {}) => ({
  title: "Workspace",
  subtitle: "Current status",
  status: "Current",
  primaryAction: { label: "Open", target: "home" },
  metrics: [],
  ...overrides,
});

test("player rail prioritizes unresolved team commitments before training work", () => {
  const model = buildPlayerOperationalInsightRail({
    activeTab: "home",
    atHome: workspace({ metrics: [{ id: "open", value: 3 }] }),
    program: workspace({ metrics: [{ id: "open", value: 2 }] }),
    events: workspace({
      subtitle: "Open Gym · 2026-08-01 · 6:00 PM",
      primaryAction: { label: "Resolve next RSVP", target: "program" },
      metrics: [{ id: "missing", value: 1 }],
    }),
    strength: workspace({ metrics: [{ id: "logged", value: 2 }] }),
    leaderboard: workspace({ metrics: [{ id: "weekly", value: 180 }, { id: "rank", value: "#2" }, { id: "streak", value: "4D" }] }),
    profile: workspace({ metrics: [{ id: "makes", value: 1200 }] }),
  });
  assert.equal(model.status, "6 open");
  assert.equal(model.items[0].title, "1 event response open");
  assert.equal(model.items[0].action.target, "program");
  assert.match(model.items[1].title, /#2/);
  assert.match(model.items[1].body, /1200 verified/);
});

test("player rail becomes positive when assigned work and responses are current", () => {
  const base = workspace({ metrics: [] });
  const model = buildPlayerOperationalInsightRail({
    atHome: workspace({ metrics: [{ id: "open", value: 0 }] }),
    program: workspace({ metrics: [{ id: "open", value: 0 }] }),
    events: workspace({ metrics: [{ id: "missing", value: 0 }] }),
    strength: workspace({ status: "Commitments current", metrics: [{ id: "logged", value: 1 }] }),
    leaderboard: base,
    profile: base,
  });
  assert.equal(model.status, "Current");
  assert.equal(model.items[0].tone, "positive");
  assert.match(model.items[0].title, /assigned work is current/i);
});

test("coach rail prioritizes attendance gaps and keeps every card actionable", () => {
  const model = buildCoachOperationalInsightRail({
    activeTab: "feed",
    rosterCount: 10,
    activeTodayCount: 4,
    activeThisWeekCount: 8,
    inactivePlayersCount: 2,
    eventMetrics: {
      missing: 5,
      upcoming: 2,
      next: { title: "Team Practice", date: "2026-08-02", time: "6:00 PM", responseRate: 50 },
    },
    strengthRows: [{ statusKey: "overdue" }],
    pageSummary: { archives: { total: 1 }, leaderboards: { ranked: 8 } },
  });
  assert.equal(model.status, "8 signals");
  assert.equal(model.items[0].action.target, "events");
  assert.equal(model.items[0].action.filter, "gaps");
  assert.equal(model.items[2].title, "4/10 active today");
  assert.equal(model.items.every((item) => Boolean(item.action)), true);
});

test("coach rail guides an empty program toward roster activation", () => {
  const model = buildCoachOperationalInsightRail({
    rosterCount: 0,
    eventMetrics: {},
    pageSummary: { archives: { total: 0 }, leaderboards: { ranked: 0 } },
  });
  assert.equal(model.items[0].title, "Build the active roster");
  assert.deepEqual(model.items[0].action, { target: "players", intent: "add" });
  assert.match(model.items[3].body, /Archive the completed season/);
});

test("desktop shells mount live insight rails and remove shipped placeholder copy", () => {
  const app = fs.readFileSync("src/App.jsx", "utf8");
  const component = fs.readFileSync("src/components/OperationalInsightRail.jsx", "utf8");
  assert.match(app, /buildPlayerOperationalInsightRail/);
  assert.match(app, /buildCoachOperationalInsightRail/);
  assert.match(app, /testId="player-operational-insight-rail"/);
  assert.match(app, /testId="coach-operational-insight-rail"/);
  assert.doesNotMatch(app, /Add widgets here later/);
  assert.match(component, /Live decision support/);
  assert.match(component, /onAction/);
});
