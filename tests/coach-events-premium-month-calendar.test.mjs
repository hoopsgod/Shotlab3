import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboard = readFileSync(new URL("../src/components/CoachInteractiveDashboards.jsx", import.meta.url), "utf8");
const calendar = readFileSync(new URL("../src/components/CoachEventsMonthCalendar.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/components/CoachEventsPremiumV2.css", import.meta.url), "utf8");

test("Coach Events places a real month calendar before the next-event decision stage", () => {
  const calendarIndex = dashboard.indexOf("<CoachEventsMonthCalendar");
  const decisionIndex = dashboard.indexOf("<CoachRoutePerformanceStage", calendarIndex);
  assert.ok(calendarIndex > 0);
  assert.ok(decisionIndex > calendarIndex);
  assert.match(dashboard, /rows=\{rows\}/);
  assert.match(dashboard, /activeType=\{type\}/);
  assert.match(dashboard, /onOpenEvent=\{onOpenEvent\}/);
  assert.match(dashboard, /summary="Plan practices, games and team moments\."/);
});

test("month calendar owns stable six-week geometry and real event-day signals", () => {
  assert.match(calendar, /Array\.from\(\{ length: 42 \}/);
  assert.match(calendar, /data-testid="coach-events-month-calendar"/);
  assert.match(calendar, /data-testid="coach-events-calendar-month"/);
  assert.match(calendar, /byDate\.get\(key\)/);
  assert.match(calendar, /events\.slice\(0, 3\)/);
  assert.match(calendar, /events\.length > 3/);
});

test("month calendar supports navigation, filtering, event drill-down, and current-month return", () => {
  assert.match(calendar, /aria-label="Previous month"/);
  assert.match(calendar, /aria-label="Next month"/);
  assert.match(calendar, /activeType === "all"/);
  assert.match(calendar, /onOpenEvent\?\.\(/);
  assert.match(calendar, />Today<\/button>/);
  assert.match(calendar, /No events scheduled this month/);
});

test("premium Events v2 uses restrained editorial geometry instead of another stack of cards", () => {
  assert.match(css, /\.coachEventsCalendar\s*\{[\s\S]*border-radius:\s*24px[\s\S]*linear-gradient/s);
  assert.match(css, /\.coachEventsCalendar__grid\s*\{[\s\S]*repeat\(7,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.coachEventsCalendar__day\s*\{[\s\S]*min-height:\s*47px/s);
  assert.match(css, /coach-events-mobile-page[^}]*article[\s\S]*border-radius:\s*0\s*!important[\s\S]*background:\s*transparent\s*!important/s);
  assert.match(css, /coach-events-command-bar[\s\S]*secondaryPageAction[\s\S]*background:\s*var\(--accent,\s*#c8ff1a\)\s*!important/s);
});
