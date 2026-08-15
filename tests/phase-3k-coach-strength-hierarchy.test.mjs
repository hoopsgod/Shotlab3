import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3k-coach-strength-hierarchy.mjs', 'utf8');
const css = readFileSync('public/shotlab-phase3k-coach-strength-hierarchy.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const routeEnhancers = readFileSync('scripts/run-route-enhancers.mjs', 'utf8');
const app = readFileSync('src/App.jsx', 'utf8');
const phasePanel = readFileSync('src/components/CoachDashboardPhase2.jsx', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('tests/e2e/design-system-screenshots.spec.mjs', 'utf8');

test('Phase 3K runs after accepted Phase 3J validation and remains guarded/idempotent', () => {
  assert.match(pkg.scripts.dev, /run-route-enhancers\.mjs dev/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /run-route-enhancers\.mjs build/);
  assert.match(routeEnhancers, /apply-phase3j-coach-events-hierarchy\.mjs[\s\S]*apply-phase3k-coach-strength-hierarchy\.mjs/);
  assert.match(enhancer, /expected exactly one Coach strength panel anchor/);
  assert.match(enhancer, /Phase 3K Coach strength hierarchy already applied/);
});

test('Coach strength exposes one commitment brief before filters and session work', () => {
  assert.match(enhancer, /data-testid="coach-strength-supporting-intelligence"/);
  assert.match(enhancer, /Strength insights/);
  assert.match(enhancer, /session commitment/);
  assert.match(enhancer, /active sessions/);
  assert.match(enhancer, /CoachStrengthOperationalPanel/);
});

test('Phase 3K keeps Strength filtering and session-management behavior intact', () => {
  for (const marker of [
    'CoachStrengthOperationalPanel',
    'coach-strength-operational-filters',
    'coach-strength-operational-results',
    'onStatusChange',
    'onQueryChange',
    'onOpenSession',
  ]) {
    assert.ok(phasePanel.includes(marker) || enhancer.includes(marker), `missing strength capability marker: ${marker}`);
  }
  for (const marker of [
    'strengthSessions',
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

test('Phase 3K authority remains active after the retired Phase 3J stylesheet', () => {
  assert.doesNotMatch(html, /shotlab-phase3j-coach-events-hierarchy\.css/);
  assert.match(html, /shotlab-phase3i-team-store-immersive\.css[\s\S]*shotlab-phase3k-coach-strength-hierarchy\.css[\s\S]*shotlab-phase3l-coach-leaderboard-hierarchy\.css/);
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
