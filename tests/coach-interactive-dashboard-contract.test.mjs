import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync("src/App.jsx", "utf8");
const primitivesSource = fs.readFileSync("src/components/CoachDashboardPrimitives.jsx", "utf8");
const dashboardSource = fs.readFileSync("src/components/CoachInteractiveDashboards.jsx", "utf8");
const pageSystemSource = fs.readFileSync("src/components/SecondaryPageSystem.jsx", "utf8");
const pageSystemCss = fs.readFileSync("src/components/SecondaryPageSystem.css", "utf8");
const dashboardCss = fs.readFileSync("src/components/CoachDashboardPrimitives.module.css", "utf8");
const integrationCss = fs.readFileSync("src/styles/CoachInteractiveDashboard.css", "utf8");

const section = (start, end) => {
  const from = appSource.indexOf(start);
  const to = appSource.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `Missing section start: ${start}`);
  assert.notEqual(to, -1, `Missing section end: ${end}`);
  return appSource.slice(from, to);
};

test("reusable dashboard components preserve operational interaction patterns", () => {
  for (const component of ["DashboardCommandBar", "InteractiveMetricStrip", "DashboardFilterRail", "DashboardInsightCard", "DashboardSection", "DashboardProgress", "DashboardDetailDrawer"]) {
    assert.match(primitivesSource, new RegExp(`export function ${component}`));
  }
  assert.match(dashboardCss, /\.commandBar/);
  assert.match(dashboardCss, /\.metricStrip/);
  assert.match(dashboardCss, /\.filterRail/);
  assert.match(dashboardCss, /\.drawerLayer/);
});

test("canonical secondary page system defines one page, toolbar, decision, and evidence grammar", () => {
  for (const component of ["SecondaryPageShell", "SecondaryPageIntro", "SecondaryPageToolbar", "SecondaryPageDecision", "SecondaryPageEvidence"]) {
    assert.match(pageSystemSource, new RegExp(`export function ${component}`));
  }
  assert.match(pageSystemCss, /\.secondaryPageIntro/);
  assert.match(pageSystemCss, /\.secondaryPageToolbar/);
  assert.match(pageSystemCss, /\.secondaryPageDecision/);
  assert.match(pageSystemCss, /\.secondaryPageEvidence/);
  assert.match(pageSystemCss, /min-height:46px/);
  assert.match(pageSystemCss, /@media\(max-width:760px\)/);
  assert.match(pageSystemCss, /@media\(prefers-reduced-motion:reduce\)/);
});

test("players and events share the canonical page composition without losing selectors", () => {
  assert.match(dashboardSource, /export function CoachPlayersInteractiveDashboard/);
  assert.match(dashboardSource, /SecondaryPageShell testId="coach-players-interactive-dashboard"/);
  assert.match(dashboardSource, /coach-players-command-bar/);
  assert.match(dashboardSource, /coach-players-toolbar/);
  assert.match(dashboardSource, /coach-players-decision-brief/);
  assert.match(dashboardSource, /coach-players-insight-grid/);
  assert.match(dashboardSource, /export function CoachEventsInteractiveDashboard/);
  assert.match(dashboardSource, /SecondaryPageShell testId="coach-events-interactive-dashboard"/);
  assert.match(dashboardSource, /coach-events-command-bar/);
  assert.match(dashboardSource, /coach-events-toolbar/);
  assert.match(dashboardSource, /coach-events-decision-brief/);
  assert.match(dashboardSource, /coach-events-insight-grid/);
});

test("App wires dashboard selectors and compositions into live coach routes", () => {
  assert.match(appSource, /CoachPlayersInteractiveDashboard/);
  assert.match(appSource, /CoachEventsInteractiveDashboard/);
  assert.match(appSource, /CoachPageDashboardHeader/);
  assert.match(appSource, /buildCoachPlayerDashboardRows/);
  assert.match(appSource, /buildCoachEventDashboardRows/);
  assert.match(appSource, /filterCoachPlayerDashboardRows/);
  assert.match(appSource, /filterCoachEventDashboardRows/);

  const players = section('{tab==="players"&&!selP', '{tab==="players"&&selP');
  assert.match(players, /coach-players-interactive-dashboard|CoachPlayersInteractiveDashboard/);
  assert.match(players, /filteredCoachRosterPlayers/);
  assert.match(players, /filteredCoachPlayerDashboardRows/);

  const events = section('{tab==="events"', '{tab==="leaderboards"');
  assert.match(events, /CoachEventsInteractiveDashboard/);
  assert.match(events, /filteredEvents/);
});

test("remaining coach pages retain the current control layer for incremental migration", () => {
  for (const testId of ["coach-page-dashboard-drills", "coach-page-dashboard-strength", "coach-page-dashboard-leaderboards"]) assert.match(appSource, new RegExp(testId));
  assert.match(integrationCss, /coachDashboardNoResults/);
  assert.match(integrationCss, /coachDashboardOperationalContent/);
});

test("cohesion pass introduces no schema, auth, persistence, or network writes", () => {
  for (const source of [pageSystemSource, pageSystemCss, dashboardSource, integrationCss]) {
    assert.doesNotMatch(source, /supabase|auth\.|create table|alter table|fetch\(|XMLHttpRequest|localStorage|sessionStorage/i);
  }
});
