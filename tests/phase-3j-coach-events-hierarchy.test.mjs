import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3j-coach-events-hierarchy.mjs', 'utf8');
const dashboards = readFileSync('src/components/CoachInteractiveDashboards.jsx', 'utf8');
const calendar = readFileSync('src/components/CoachEventsMonthCalendar.jsx', 'utf8');
const calendarCss = readFileSync('src/components/CoachEventsPremiumV2.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const routeEnhancers = readFileSync('scripts/run-route-enhancers.mjs', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('tests/e2e/design-system-screenshots.spec.mjs', 'utf8');
const eventsStart = dashboards.indexOf('export function CoachEventsInteractiveDashboard');
const eventsEnd = dashboards.indexOf('\nconst operationalPageConfig', eventsStart);
const eventsDashboard = dashboards.slice(eventsStart, eventsEnd);

test('Phase 3J build hook remains present but no longer mutates presentation source', () => {
  assert.match(pkg.scripts.dev, /run-route-enhancers\.mjs dev/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /run-route-enhancers\.mjs build/);
  assert.match(routeEnhancers, /apply-phase3i-team-store-immersive\.mjs[\s\S]*apply-phase3j-coach-events-hierarchy\.mjs/);
  assert.match(enhancer, /legacy mutation retired/);
  assert.match(enhancer, /CoachEventsMonthCalendar/);
  assert.doesNotMatch(enhancer, /writeFileSync|source\.replace/);
});

test('Coach Events schedule intelligence is calendar-first and source-owned', () => {
  const calendarIndex = eventsDashboard.indexOf('<CoachEventsMonthCalendar');
  const decisionIndex = eventsDashboard.indexOf('<CoachRoutePerformanceStage', calendarIndex);
  assert.ok(eventsStart >= 0 && eventsEnd > eventsStart);
  assert.ok(calendarIndex > 0 && decisionIndex > calendarIndex);
  assert.match(eventsDashboard, /rows=\{rows\}/);
  assert.match(calendar, /data-testid="coach-events-month-calendar"/);
  assert.match(calendar, /Array\.from\(\{ length: 42 \}/);
  assert.doesNotMatch(eventsDashboard, /briefing\.insights\.map/);
});

test('calendar keeps month navigation, readable event marks, and mobile touch geometry', () => {
  assert.match(calendar, /aria-label="Previous month"/);
  assert.match(calendar, /aria-label="Next month"/);
  assert.match(calendar, /coachEventsCalendar__eventMarks/);
  assert.match(calendarCss, /\.coachEventsCalendar__day\s*\{[\s\S]*min-height:\s*47px/);
  assert.match(calendarCss, /@media \(max-width: 390px\)[\s\S]*\.coachEventsCalendar__day \{ min-height: 44px; height: 44px;/);
  assert.match(calendarCss, /:focus-visible/);
  assert.match(calendarCss, /prefers-reduced-motion:\s*reduce/);
});

test('Phase 3J preserves event creation, drill-down, RSVP briefing, and status actions', () => {
  for (const marker of ['onCreateEvent','onOpenEvent','onStatusChange','Create Event','buildCoachEventActionBriefing']) {
    assert.ok(eventsDashboard.includes(marker), `missing preserved event capability marker: ${marker}`);
  }
  assert.match(calendar, /onOpenEvent\?\.\(/);
  assert.match(eventsDashboard, /briefing\.responseRate/);
  assert.match(eventsDashboard, /briefing\.missing/);
});

test('obsolete Phase 3J stylesheet is no longer an active visual authority', () => {
  assert.doesNotMatch(html, /shotlab-phase3j-coach-events-hierarchy\.css/);
});

test('rendered iPhone evidence continues to capture Coach Events', () => {
  assert.match(screenshots, /07-coach-events/);
  assert.match(screenshots, /getByRole\(\"button\", \{ name: \/MANAGE\//);
});

test('App Store workflow carries the Phase 3J semantic contract and evidence package', () => {
  assert.match(workflow, /tests\/phase-3j-coach-events-hierarchy\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-3j-coach-events-hierarchy-evidence/);
});
