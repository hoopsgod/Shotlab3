import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3j-coach-events-hierarchy.mjs', 'utf8');
const dashboards = readFileSync('src/components/CoachInteractiveDashboards.jsx', 'utf8');
const css = readFileSync('public/shotlab-phase3j-coach-events-hierarchy.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('tests/e2e/design-system-screenshots.spec.mjs', 'utf8');

test('Phase 3J enhancer runs after accepted Phase 3I and remains guarded/idempotent', () => {
  assert.match(pkg.scripts.dev, /apply-phase3i-team-store-immersive\.mjs[\s\S]*apply-phase3j-coach-events-hierarchy\.mjs/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase3i-team-store-immersive\.mjs[\s\S]*apply-phase3j-coach-events-hierarchy\.mjs/);
  assert.match(enhancer, /expected exactly one Coach Events insight-grid anchor/);
  assert.match(enhancer, /Phase 3J Coach Events hierarchy already applied/);
});

test('supporting RSVP and calendar intelligence becomes one mobile disclosure without deleting insight data', () => {
  assert.match(enhancer, /data-testid=\"coach-events-supporting-intelligence\"/);
  assert.match(enhancer, /Schedule insights/);
  assert.match(enhancer, /RSVP & calendar context/);
  assert.match(enhancer, /briefing\.missing/);
  assert.match(enhancer, /briefing\.responseRate/);
  assert.match(enhancer, /testId=\"coach-events-insight-grid\"/);
  assert.match(enhancer, /briefing\.insights\.map/);
  assert.match(enhancer, /DashboardProgress/);
});

test('supporting disclosure preserves the established decision-first grid order', () => {
  assert.match(css, /\.coachEventsSupportingIntelligence[\s\S]*order: 4 !important/);
});

test('desktop preserves expanded supporting intelligence while iPhone defaults it closed', () => {
  assert.match(enhancer, /open=\{typeof window !== \"undefined\" && window\.innerWidth > 760\}/);
  assert.match(css, /@media \(min-width: 761px\)[\s\S]*coachEventsSupportingSummary[\s\S]*display: none/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(enhancer, /open=\{true\}/);
});

test('Coach Events removes shared mobile bottom-padding debt so the agenda follows the decision system', () => {
  assert.match(css, /coach-events-mobile-surface \[data-testid=\"coach-events-interactive-dashboard\"\][\s\S]*padding-bottom: 8px !important/);
});

test('mobile Schedule insights uses native summary hierarchy with accessible touch and focus behavior', () => {
  assert.match(css, /\.coachEventsSupportingIntelligence/);
  assert.match(css, /\.coachEventsSupportingSummary/);
  assert.match(css, /min-height: 68px/);
  assert.match(css, /touch-action: manipulation/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /coachEventsSupportingSummaryCopy > small[\s\S]*opacity: 1 !important/);
  assert.match(css, /coachEventsSupportingSummaryCopy > small[\s\S]*box-shadow: none !important/);
});

test('Phase 3J preserves existing event action wiring and event insight actions', () => {
  for (const marker of [
    'onCreateEvent',
    'onOpenEvent',
    'onStatusChange',
    'resolveEventAction',
    'Create Event',
  ]) {
    assert.ok(dashboards.includes(marker), `missing preserved event capability marker: ${marker}`);
  }
  assert.match(dashboards, /buildCoachEventActionBriefing/);
  assert.match(dashboards, /briefing\.insights\.map/);
  assert.match(enhancer, /resolveEventAction\(insight\.action/);
});

test('Phase 3J authority loads after Phase 3I', () => {
  assert.match(html, /shotlab-phase3i-team-store-immersive\.css[\s\S]*shotlab-phase3j-coach-events-hierarchy\.css/);
});

test('rendered iPhone evidence proves compact and expanded Coach Events states with agenda preserved', () => {
  assert.match(screenshots, /coach-events-supporting-intelligence/);
  assert.match(screenshots, /coach-events-insight-grid/);
  assert.match(screenshots, /07-coach-events/);
  assert.match(screenshots, /07b-coach-events-insights-expanded/);
  assert.match(screenshots, /getByRole\(\"button\", \{ name: \/MANAGE\//);
});

test('App Store workflow carries Phase 3J and its evidence package', () => {
  assert.match(workflow, /tests\/phase-3j-coach-events-hierarchy\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-3j-coach-events-hierarchy-evidence/);
});
