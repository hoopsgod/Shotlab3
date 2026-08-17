import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboard = readFileSync(new URL("../src/components/CoachInteractiveDashboards.jsx", import.meta.url), "utf8");
const primitives = readFileSync(new URL("../src/components/EventsMobilePrimitives.jsx", import.meta.url), "utf8");
const sharedCss = readFileSync(new URL("../src/components/EventsMobileSystem.css", import.meta.url), "utf8");
const coachCss = readFileSync(new URL("../src/components/CoachEventsPremiumV2.css", import.meta.url), "utf8");

test("Coach Events is week-first and keeps month view secondary", () => {
  const titleIndex = dashboard.indexOf("<EventsTitleStage");
  const nextIndex = dashboard.indexOf('data-testid="coach-events-next-team-moment"');
  const weekIndex = dashboard.indexOf("<EventsWeekRail");
  const monthIndex = dashboard.indexOf("<EventsMonthPanel");

  assert.ok(titleIndex >= 0);
  assert.ok(nextIndex > titleIndex);
  assert.ok(weekIndex > nextIndex);
  assert.ok(monthIndex > weekIndex);
  assert.doesNotMatch(dashboard, /CoachEventsMonthCalendar/);
});

test("shared mobile Events primitives own title, week rail, type language and secondary month calendar", () => {
  assert.match(primitives, /export function EventsTitleStage/);
  assert.match(primitives, /export function EventsWeekRail/);
  assert.match(primitives, /export function EventTypeBadge/);
  assert.match(primitives, /export function EventTimeLocation/);
  assert.match(primitives, /export function EventsMonthPanel/);
  assert.match(primitives, /<details className="eventsMonthPanel"/);
  assert.match(primitives, /Array\.from\(\{ length: 42 \}/);
  assert.match(primitives, /data-testid="events-week-rail"/);
  assert.match(primitives, /data-testid="events-month-panel"/);
});

test("Coach Events prioritizes one operational response signal and compact management action", () => {
  assert.match(dashboard, /RSVP GAP/);
  assert.match(dashboard, /TEAM RESPONSE COMPLETE/);
  assert.match(dashboard, /Manage event/);
  assert.match(dashboard, /onCreate=\{onCreateEvent\}/);
  assert.doesNotMatch(dashboard, /1 confirmed\s*3 missing\s*25% response/);
});

test("premium Events system uses editorial rows, controlled lime and mobile safe-area clearance", () => {
  assert.match(sharedCss, /\.eventsWeekRail__days\s*\{[\s\S]*repeat\(7,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(sharedCss, /\.eventsMonthPanel\s*\{[\s\S]*border-top:[\s\S]*background:\s*transparent/s);
  assert.match(coachCss, /coach-events-mobile-page[\s\S]*article[\s\S]*border-radius:\s*0\s*!important[\s\S]*background:\s*transparent\s*!important/s);
  assert.match(coachCss, /safe-area-inset-bottom/);
  assert.match(coachCss, /\.coachEventsNext__command strong[\s\S]*var\(--coach-events-lime\)/s);
});
