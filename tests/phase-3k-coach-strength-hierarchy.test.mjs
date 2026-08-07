import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3k-coach-strength-hierarchy.mjs', 'utf8');
const phasePanel = readFileSync('src/components/CoachDashboardPhase2.jsx', 'utf8');
const app = readFileSync('src/App.jsx', 'utf8');
const css = readFileSync('public/shotlab-phase3k-coach-strength-hierarchy.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('tests/e2e/phase-3k-coach-strength-screenshots.spec.mjs', 'utf8');

test('Phase 3K enhancer runs after accepted Phase 3J and remains guarded/idempotent', () => {
  assert.match(pkg.scripts.dev, /apply-phase3j-coach-events-hierarchy\.mjs[\s\S]*apply-phase3k-coach-strength-hierarchy\.mjs/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase3j-coach-events-hierarchy\.mjs[\s\S]*apply-phase3k-coach-strength-hierarchy\.mjs/);
  assert.match(enhancer, /expected exactly one Coach S&C insight-grid anchor/);
  assert.match(enhancer, /Phase 3K Coach S&C hierarchy already applied/);
});

test('S&C supporting intelligence becomes one mobile disclosure without deleting compliance data', () => {
  assert.match(enhancer, /data-testid=\"coach-strength-supporting-intelligence\"/);
  assert.match(enhancer, /Compliance insights/);
  assert.match(enhancer, /Readiness & follow-up/);
  assert.match(enhancer, /\{rate\}% completion/);
  assert.match(enhancer, /\{overdue\.length\} overdue/);
  assert.match(enhancer, /testId=\"coach-strength-insight-grid\"/);
  assert.match(enhancer, /Team compliance/);
  assert.match(enhancer, /Overdue work/);
  assert.match(enhancer, /Next session/);
  assert.match(enhancer, /DashboardProgress/);
});

test('desktop preserves expanded S&C intelligence while iPhone defaults it closed', () => {
  assert.match(enhancer, /open=\{typeof window !== \"undefined\" && window\.innerWidth > 760\}/);
  assert.match(css, /@media \(min-width: 761px\)[\s\S]*coachStrengthSupportingSummary[\s\S]*display: none/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(enhancer, /open=\{true\}/);
});

test('mobile compliance disclosure uses native summary hierarchy with accessible touch and focus behavior', () => {
  assert.match(css, /\.coachStrengthSupportingIntelligence/);
  assert.match(css, /\.coachStrengthSupportingSummary/);
  assert.match(css, /min-height: 68px/);
  assert.match(css, /touch-action: manipulation/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /coachStrengthSupportingSummaryCopy > small[\s\S]*opacity: 1 !important/);
});

test('Phase 3K preserves existing S&C management and operational actions', () => {
  for (const marker of [
    'CoachStrengthOperationalPanel',
    'openCoachScSessionForm',
    'toggleCoachScSessionForm',
    'handleAddSC',
    '+ ADD SESSION',
    'addScSession',
    'removeScSession',
  ]) {
    assert.ok(app.includes(marker), `missing preserved S&C capability marker: ${marker}`);
  }
  assert.match(phasePanel, /CoachStrengthOperationalPanel/);
  assert.match(phasePanel, /Show Overdue/);
  assert.match(phasePanel, /Open Session/);
});

test('Phase 3K authority loads after Phase 3J', () => {
  assert.match(html, /shotlab-phase3j-coach-events-hierarchy\.css[\s\S]*shotlab-phase3k-coach-strength-hierarchy\.css/);
});

test('rendered iPhone evidence proves compact and expanded Coach S&C states with session work preserved', () => {
  assert.match(screenshots, /coach-strength-supporting-intelligence/);
  assert.match(screenshots, /coach-strength-insight-grid/);
  assert.match(screenshots, /08c-coach-strength/);
  assert.match(screenshots, /08d-coach-strength-insights-expanded/);
  assert.match(screenshots, /ADD SESSION/);
});

test('App Store workflow carries Phase 3K and its evidence package', () => {
  assert.match(workflow, /tests\/phase-3k-coach-strength-hierarchy\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-3k-coach-strength-hierarchy-evidence/);
});
