import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3j-coach-events-hierarchy.mjs', 'utf8');
const dashboards = readFileSync('src/components/CoachInteractiveDashboards.jsx', 'utf8');
const disclosure = readFileSync('src/components/SecondaryPageDisclosure.jsx', 'utf8');
const disclosureCss = readFileSync('src/components/SecondaryPageDisclosure.module.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const routeEnhancers = readFileSync('scripts/run-route-enhancers.mjs', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('tests/e2e/design-system-screenshots.spec.mjs', 'utf8');

test('Phase 3J build hook remains present but no longer mutates presentation source', () => {
  assert.match(pkg.scripts.dev, /run-route-enhancers\.mjs dev/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /run-route-enhancers\.mjs build/);
  assert.match(routeEnhancers, /apply-phase3i-team-store-immersive\.mjs[\s\S]*apply-phase3j-coach-events-hierarchy\.mjs/);
  assert.match(enhancer, /legacy mutation retired/);
  assert.match(enhancer, /SecondaryPageDisclosure/);
  assert.doesNotMatch(enhancer, /writeFileSync|source\.replace/);
});

test('supporting RSVP intelligence is source-owned without deleting insight data', () => {
  assert.match(dashboards, /<SecondaryPageDisclosure/);
  assert.match(dashboards, /title="Schedule insights"/);
  assert.match(dashboards, /summary=\{`\$\{briefing\.responseRate\}% response · \$\{briefing\.missing\} missing`\}/);
  assert.match(dashboards, /testId="coach-events-supporting-intelligence"/);
  assert.match(dashboards, /testId="coach-events-insight-grid"/);
  assert.match(dashboards, /briefing\.insights\.map/);
  assert.match(dashboards, /DashboardProgress/);
});

test('desktop preserves expanded intelligence while iPhone defaults it closed', () => {
  assert.match(dashboards, /defaultOpen=\{typeof window !== "undefined" && window\.innerWidth > 760\}/);
  assert.match(disclosureCss, /@media \(min-width: 761px\)/);
  assert.match(disclosureCss, /\.summary \{ display: none; \}/);
  assert.doesNotMatch(dashboards, /defaultOpen=\{true\}/);
});

test('mobile Schedule insights is a readable two-line touch-safe disclosure', () => {
  assert.match(disclosure, /data-visual-role="progressive-disclosure"/);
  assert.match(disclosure, /data-visual-role="disclosure-title"/);
  assert.match(disclosure, /data-visual-role="disclosure-meta"/);
  const minHeight = Number(disclosureCss.match(/\.summary \{[\s\S]*?min-height:\s*(\d+)px/)?.[1]);
  assert.ok(minHeight >= 44, `Schedule insights summary must remain touch-safe; got ${minHeight}px`);
  assert.match(disclosureCss, /\.copy \{[\s\S]*?display:\s*grid;[\s\S]*?gap:\s*4px/);
  assert.match(disclosureCss, /touch-action:\s*manipulation/);
  assert.match(disclosureCss, /:focus-visible/);
  assert.match(disclosureCss, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(disclosureCss, /!important/);
});

test('Phase 3J preserves existing event action wiring and insight actions', () => {
  for (const marker of ['onCreateEvent','onOpenEvent','onStatusChange','resolveEventAction','Create Event']) {
    assert.ok(dashboards.includes(marker), `missing preserved event capability marker: ${marker}`);
  }
  assert.match(dashboards, /buildCoachEventActionBriefing/);
  assert.match(dashboards, /resolveEventAction\(insight\.action/);
});

test('obsolete Phase 3J stylesheet is no longer an active visual authority', () => {
  assert.doesNotMatch(html, /shotlab-phase3j-coach-events-hierarchy\.css/);
});

test('rendered iPhone evidence covers the approved compact Coach Events state', () => {
  assert.match(screenshots, /coach-events-supporting-intelligence/);
  assert.match(screenshots, /coach-events-insight-grid/);
  assert.match(screenshots, /07-coach-events/);
  assert.match(screenshots, /expect\(eventInsights\)\.toHaveCount\(1\)/);
  assert.match(screenshots, /expect\(eventInsights\)\.toBeHidden\(\)/);
  assert.doesNotMatch(screenshots, /07b-coach-events-insights-expanded/);
  assert.match(screenshots, /getByRole\(\"button\", \{ name: \/MANAGE\//);
});

test('App Store workflow carries the Phase 3J semantic contract and evidence package', () => {
  assert.match(workflow, /tests\/phase-3j-coach-events-hierarchy\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-3j-coach-events-hierarchy-evidence/);
});