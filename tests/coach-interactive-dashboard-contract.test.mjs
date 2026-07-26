import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync("src/App.jsx", "utf8");
const primitivesSource = fs.readFileSync("src/components/CoachDashboardPrimitives.jsx", "utf8");
const dashboardSource = fs.readFileSync("src/components/CoachInteractiveDashboards.jsx", "utf8");
const dashboardCss = fs.readFileSync("src/components/CoachDashboardPrimitives.module.css", "utf8");
const integrationCss = fs.readFileSync("src/styles/CoachInteractiveDashboard.css", "utf8");

const section = (start, end) => {
  const from = appSource.indexOf(start);
  const to = appSource.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `Missing section start: ${start}`);
  assert.notEqual(to, -1, `Missing section end: ${end}`);
  return appSource.slice(from, to);
};

test("reusable dashboard components expose operational interaction patterns", () => {
  for (const component of [
    "DashboardCommandBar",
    "InteractiveMetricStrip",
    "DashboardFilterRail",
    "DashboardInsightCard",
    "DashboardSection",
    "DashboardProgress",
    "DashboardDetailDrawer",
  ]) {
    assert.match(primitivesSource, new RegExp(`export function ${component}`));
  }
  assert.match(dashboardCss, /\.commandBar/);
  assert.match(dashboardCss, /\.metricStrip/);
  assert.match(dashboardCss, /\.filterRail/);
  assert.match(dashboardCss, /\.drawerLayer/);
  assert.match(dashboardCss, /@media \(max-width: 820px\)/);
  assert.match(dashboardCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test("players and events use reference interactive dashboard compositions", () => {
  assert.match(dashboardSource, /export function CoachPlayersInteractiveDashboard/);
  assert.match(dashboardSource, /coach-players-command-bar/);
  assert.match(dashboardSource, /coach-players-metric-strip/);
  assert.match(dashboardSource, /coach-players-filter-rail/);
  assert.match(dashboardSource, /export function CoachEventsInteractiveDashboard/);
  assert.match(dashboardSource, /coach-events-command-bar/);
  assert.match(dashboardSource, /coach-events-metric-strip/);
  assert.match(dashboardSource, /coach-events-filter-rail/);
});

test("App wires dashboard selectors and compositions into live coach routes", () => {
  assert.match(appSource, /CoachPlayersInteractiveDashboard/);
  assert.match(appSource, /CoachEventsInteractiveDashboard/);
  assert.match(appSource, /CoachPageDashboardHeader/);
  assert.match(appSource, /buildCoachPlayerDashboardRows/);
  assert.match(appSource, /buildCoachEventDashboardRows/);
  assert.match(appSource, /filterCoachPlayerDashboardRows/);
  assert.match(appSource, /filterCoachEventDashboardRows/);
  assert.match(appSource, /CoachInteractiveDashboard\.css/);

  const players = section('{tab==="players"&&!selP', '{tab==="players"&&selP');
  assert.match(players, /coach-players-interactive-dashboard|CoachPlayersInteractiveDashboard/);
  assert.match(players, /filteredCoachRosterPlayers/);
  assert.match(players, /filteredCoachPlayerDashboardRows/);
  assert.match(players, /coach-season-tools/);
  assert.match(players, /coach-roster-operations/);

  const events = section('{tab==="events"', '{tab==="leaderboards"');
  assert.match(events, /CoachEventsInteractiveDashboard/);
  assert.match(events, /filteredEvents/);
  assert.match(events, /dashboardLegacyHeader/);
});

test("remaining coach pages inherit the dashboard control layer", () => {
  for (const testId of [
    "coach-page-dashboard-drills",
    "coach-page-dashboard-strength",
    "coach-page-dashboard-leaderboards",
  ]) {
    assert.match(appSource, new RegExp(testId));
  }
  assert.match(integrationCss, /coachDashboardNoResults/);
  assert.match(integrationCss, /coachDashboardOperationalContent/);
});

test("interactive dashboard phase does not introduce schema, auth, or unsafe network writes", () => {
  for (const source of [primitivesSource, dashboardSource, integrationCss]) {
    assert.doesNotMatch(source, /supabase|auth\.|create table|alter table|fetch\(|XMLHttpRequest/i);
  }
});
