import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3j-coach-events-hierarchy.mjs', 'utf8');
const dashboards = readFileSync('src/components/CoachInteractiveDashboards.jsx', 'utf8');
const primitives = readFileSync('src/components/EventsMobilePrimitives.jsx', 'utf8');
const sharedCss = readFileSync('src/components/EventsMobileSystem.css', 'utf8');
const coachCss = readFileSync('src/components/CoachEventsPremiumV2.css', 'utf8');
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
  assert.doesNotMatch(enhancer, /writeFileSync|source\.replace/);
});

test('Coach Events schedule intelligence is now week-first and source-owned', () => {
  const titleIndex = eventsDashboard.indexOf('<EventsTitleStage');
  const nextIndex = eventsDashboard.indexOf('coach-events-next-team-moment');
  const weekIndex = eventsDashboard.indexOf('<EventsWeekRail');
  const monthIndex = eventsDashboard.indexOf('<EventsMonthPanel');
  assert.ok(eventsStart >= 0 && eventsEnd > eventsStart);
  assert.ok(titleIndex >= 0 && nextIndex > titleIndex && weekIndex > nextIndex && monthIndex > weekIndex);
  assert.match(eventsDashboard, /rows=\{rows/);
  assert.match(primitives, /data-testid="events-week-rail"/);
  assert.match(primitives, /data-testid="events-month-panel"/);
  assert.match(primitives, /Array\.from\(\{ length: 42 \}/);
  assert.doesNotMatch(eventsDashboard, /CoachEventsMonthCalendar/);
});

test('shared calendar primitives keep readable event marks, quiet disclosure ownership, and compact mobile containment', () => {
  assert.match(sharedCss, /\.eventsWeekRail__day\s*\{[\s\S]*min-height:\s*58px/);
  assert.match(sharedCss, /#root \.eventsMonth__day\s*\{[\s\S]*min-height:\s*44px/);
  assert.match(sharedCss, /\.eventsWeekRail__days\s*\{[\s\S]*grid-template-columns:\s*repeat\(7,minmax\(0,1fr\)\)/);
  assert.match(sharedCss, /#root \.eventsMonth__weekdays,#root \.eventsMonth__grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(7,minmax\(0,1fr\)\)/);
  assert.match(primitives, /className="eventsMonthPanel"[^>]*data-layout-role="quiet-secondary"/);
  assert.doesNotMatch(primitives, /eventsMonthPanel__/);
  assert.match(sharedCss, /#root \.eventsMonth__body,#root \.eventsMonth__control,#root \.eventsMonth__day\{[\s\S]*border:\s*0!important[\s\S]*background:\s*transparent!important[\s\S]*box-shadow:\s*none!important/);
  assert.match(sharedCss, /:focus-visible/);
  assert.ok(
    /prefers-reduced-motion: reduce/.test(sharedCss) || !/(?:animation|transition)\s*:/.test(sharedCss),
    'Events must either honor reduced motion or avoid animated/transitional motion entirely',
  );
});

test('Coach Events preserves event creation, drill-down, response briefing, and status actions', () => {
  for (const marker of ['onCreateEvent','onOpenEvent','onStatusChange','buildCoachEventActionBriefing']) {
    assert.ok(eventsDashboard.includes(marker), `missing preserved event capability marker: ${marker}`);
  }
  assert.match(eventsDashboard, /RSVP GAP/);
  assert.match(eventsDashboard, /TEAM RESPONSE COMPLETE/);
  assert.match(eventsDashboard, /Manage event/);
  assert.match(eventsDashboard, /onCreate=\{onCreateEvent\}/);
});

test('Coach Events presentation removes the card-first mobile list and keeps safe-area clearance', () => {
  assert.match(coachCss, /coach-events-mobile-page[\s\S]*article[\s\S]*border-radius:\s*0\s*!important[\s\S]*background:\s*transparent\s*!important/s);
  assert.match(coachCss, /safe-area-inset-bottom/);
  assert.doesNotMatch(html, /shotlab-phase3j-coach-events-hierarchy\.css/);
});

test('rendered iPhone evidence continues to capture Coach Events', () => {
  assert.match(screenshots, /07-coach-events/);
});

test('App Store workflow carries the Phase 3J semantic contract and evidence package', () => {
  assert.match(workflow, /tests\/phase-3j-coach-events-hierarchy\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-3j-coach-events-hierarchy-evidence/);
});
