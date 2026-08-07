import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3l-coach-leaderboard-hierarchy.mjs', 'utf8');
const css = readFileSync('public/shotlab-phase3l-coach-leaderboard-hierarchy.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const app = readFileSync('src/App.jsx', 'utf8');
const panel = readFileSync('src/components/CoachDashboardPhase2.jsx', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('tests/e2e/phase-3l-coach-leaderboard-screenshots.spec.mjs', 'utf8');

test('Phase 3L runs after accepted Phase 3K and remains guarded/idempotent', () => {
  assert.match(pkg.scripts.dev, /apply-phase3k-coach-strength-hierarchy\.mjs[\s\S]*apply-phase3l-coach-leaderboard-hierarchy\.mjs/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase3k-coach-strength-hierarchy\.mjs[\s\S]*apply-phase3l-coach-leaderboard-hierarchy\.mjs/);
  assert.match(enhancer, /expected exactly one Coach leaderboard panel anchor/);
  assert.match(enhancer, /Phase 3L Coach leaderboard hierarchy already applied/);
});

test('Coach leaderboard exposes one competitive pulse before filters and ranked work', () => {
  assert.match(enhancer, /data-testid="coach-leaderboard-pulse"/);
  assert.match(enhancer, /Competitive pulse/);
  assert.match(enhancer, /Weekly leader/);
  assert.match(enhancer, /Risers/);
  assert.match(enhancer, /active this week/);
  assert.match(enhancer, /coachLeaderboardRank/);
  assert.match(enhancer, /coachLeaderboardWeek/);
  assert.match(enhancer, /data-rank=\{row\.rank\}/);
  assert.match(enhancer, /data-trend=/);
});

test('Phase 3L keeps leaderboard filtering and player drill-down behavior intact', () => {
  for (const marker of [
    'CoachLeaderboardOperationalPanel',
    'coach-leaderboard-operational-filters',
    'coach-leaderboard-operational-results',
    'onScopeChange',
    'onQueryChange',
    'onOpenPlayer',
    'formatDelta',
  ]) {
    assert.ok(panel.includes(marker) || enhancer.includes(marker), `missing leaderboard capability marker: ${marker}`);
  }
  assert.match(app, /buildLeaderboardIntelligenceRows/);
  assert.match(app, /filterLeaderboardIntelligenceRows/);
});

test('Leaderboard authority uses light native surfaces, accessible focus, and restrained motion', () => {
  assert.match(css, /coachLeaderboardPulse/);
  assert.match(css, /rgba\(255, 255, 255, \.95\)/);
  assert.match(css, /color: #171a18/);
  assert.match(css, /coachLeaderboardRow:focus-visible/);
  assert.match(css, /outline: 3px solid/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('rank and weekly pace receive dedicated mobile hierarchy without horizontal overflow debt', () => {
  assert.match(css, /grid-template-columns: 38px minmax\(0, 1fr\) auto/);
  assert.match(css, /coachLeaderboardRank/);
  assert.match(css, /coachLeaderboardWeek/);
  assert.match(css, /text-overflow: ellipsis/);
  assert.doesNotMatch(css, /min-width:\s*[4-9][0-9]{2}px/);
});

test('Phase 3L authority loads after Phase 3K', () => {
  assert.match(html, /shotlab-phase3k-coach-strength-hierarchy\.css[\s\S]*shotlab-phase3l-coach-leaderboard-hierarchy\.css/);
});

test('rendered iPhone evidence covers Coach Leaderboards and player drill-down', () => {
  assert.match(screenshots, /data-nav-key="leaderboards"/);
  assert.match(screenshots, /coach-leaderboard-pulse/);
  assert.match(screenshots, /coach-leaderboard-operational-results/);
  assert.match(screenshots, /10-coach-leaderboards/);
  assert.match(screenshots, /coach-player-intelligence-drawer/);
});

test('App Store workflow carries Phase 3L and its evidence package', () => {
  assert.match(workflow, /tests\/phase-3l-coach-leaderboard-hierarchy\.test\.mjs/);
  assert.match(workflow, /phase-3l-coach-leaderboard-screenshots\.spec\.mjs/);
  assert.match(workflow, /shotlab-phase-3l-coach-leaderboard-hierarchy-evidence/);
});
