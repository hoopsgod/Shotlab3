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
  assert.match(enhancer, /\$\{'\$\{rate\}'\}/);
  assert.match(enhancer, /\$\{'\$\{completions\}'\}/);
  assert.match(enhancer, /\$\{'\$\{commitments\}'\}/);
});

test('S&C supporting intelligence becomes one mobile disclosure without deleting compliance data', () => {
  assert.match(enhancer, /data-testid=\"coach-strength-supporting-intelligence\"/);
  assert.match(enhancer, /Compliance insights/);
  assert.match(enhancer, /Readiness & follow-up/);
  assert.match(enhancer, /\{rate\}% completion/);
  assert.match(enhancer, /\{overdue\.length\} overdue/);
  assert.match(enhancer, /data-testid=\"coach-strength-insight-grid\"/);
  assert.match(enhancer, /Team compliance/);
  assert.match(enhancer, /Overdue work/);
  assert.match(enhancer, /Next session/);
  assert.match(enhancer, /DashboardProgress/);
});

test('S&C route joins the accepted light native secondary canvas', () => {
  assert.match(css, /body:has\(\[data-testid=\"coach-page-dashboard-strength\"\]\)/);
  assert.match(css, /#root:has\(\[data-testid=\"coach-page-dashboard-strength\"\]\)[\s\S]*background:var\(--p3-canvas,#f4f5f1\)!important/);
  assert.match(css, /body:has\(\[data-testid=\"coach-page-dashboard-strength\"\]\) #root \.performance-shell/);
  assert.match(css, /body:has\(\[data-testid=\"coach-page-dashboard-strength\"\]\) \.performance-workspace::before[\s\S]*display:none!important/);
});

test('S&C keeps one header decision layer instead of repeating metric evidence', () => {
  assert.match(css, /\[data-testid=\"coach-page-dashboard-strength\"\][\s\S]*padding-bottom:8px!important/);
  assert.match(css, /\[data-testid=\"coach-page-dashboard-strength-evidence\"\][\s\S]*display:none!important/);
  assert.match(css, /\[data-testid=\"coach-page-dashboard-strength-metric-strip\"\]/);
  assert.match(css, /\[data-testid=\"coach-page-dashboard-strength-metric-strip\"\] > button[\s\S]*background:var\(--p3-surface,#fff\)!important/);
  assert.match(css, /\[data-testid=\"coach-page-dashboard-strength-metric-strip\"\] \[class\*=\"metricValue\"\][\s\S]*color:var\(--p3-ink,#151a16\)!important/);
});

test('S&C operational filters use the light native utility rail', () => {
  assert.match(css, /\[data-testid=\"coach-strength-operational-filters\"\][\s\S]*background:var\(--p3-surface,#fff\)!important/);
  assert.match(css, /\[data-testid=\"coach-strength-operational-filters\"\] label[\s\S]*background:var\(--p3-surface-soft,#f8f8f4\)!important/);
  assert.match(css, /\[data-testid=\"coach-strength-operational-filters\"\] button\[aria-pressed=\"true\"\]/);
});

test('desktop preserves expanded S&C intelligence while iPhone defaults it closed', () => {
  assert.match(enhancer, /open=\{typeof window !== \"undefined\" && window\.innerWidth > 760\}/);
  assert.match(css, /@media \(min-width: 761px\)[\s\S]*coachStrengthSupportingSummary[\s\S]*display: none/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(enhancer, /open=\{true\}/);
});

test('mobile compliance disclosure uses route-scoped native summary authority', () => {
  assert.match(css, /\.coachStrengthSupportingIntelligence/);
  assert.match(css, /\.coachStrengthSupportingSummary/);
  assert.match(css, /min-height:68px/);
  assert.match(css, /touch-action:manipulation/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /html body #root \.pageShell\[data-accent=\"sc\"\] \[data-testid=\"coach-strength-operational-panel\"\] \.coachStrengthSupportingSummary > \.coachStrengthSupportingSummaryCopy/);
  assert.match(css, /all:unset!important/);
  assert.match(css, /coachStrengthSupportingSummaryCopy::before[\s\S]*coachStrengthSupportingSummaryCopy::after[\s\S]*content:none!important/);
  assert.match(css, /coachStrengthSupportingSummaryCopy > small[\s\S]*box-shadow:none!important[\s\S]*transform:none!important/);
});

test('expanded S&C insight cards preserve light-surface contrast and readable controls', () => {
  assert.match(css, /\[data-testid=\"coach-strength-insight-grid\"\] article[\s\S]*--text-1:#171a18[\s\S]*--text-2:#5d665f/);
  assert.match(css, /\[data-testid=\"coach-strength-insight-grid\"\] article[\s\S]*background:linear-gradient\(180deg,#ffffff 0%,#f5f6f3 100%\)!important/);
  assert.match(css, /\[data-testid=\"coach-strength-insight-grid\"\] article h2[\s\S]*color:#171a18!important/);
  assert.match(css, /\[data-testid=\"coach-strength-insight-grid\"\] article p[\s\S]*color:#5d665f!important/);
  assert.match(css, /\[data-testid=\"coach-strength-insight-grid\"\] article button[\s\S]*color:#25321c!important/);
  assert.match(css, /\[data-testid=\"coach-strength-insight-grid\"\] article \[role=\"progressbar\"\][\s\S]*background:rgba\(23,26,24,\.10\)!important/);
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
