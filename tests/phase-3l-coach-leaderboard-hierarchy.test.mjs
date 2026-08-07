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

test('Phase 3L moves the intentional follow-up workflow into the drawer scroll body', () => {
  assert.match(enhancer, /coachFollowUpEnhancer\.js/);
  assert.match(enhancer, /expected exactly one Coach follow-up drawer placement anchor/);
  assert.match(enhancer, /const drawerBody = dialog\.querySelector\('\[class\*=\"drawerBody\"\]'\) \|\| dialog/);
  assert.match(enhancer, /drawerBody\.appendChild\(host\)/);
  assert.doesNotMatch(enhancer, /newPlacement = `[\s\S]*dialog\.appendChild\(host\)/);
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

test('mobile Leaderboards removes duplicated generic briefing and the legacy full-viewport shell debt', () => {
  assert.match(css, /coach-page-dashboard-leaderboards-decision-brief/);
  assert.match(css, /coach-page-dashboard-leaderboards-evidence/);
  assert.match(css, /display: none !important/);
  assert.match(css, /html body #root \[data-testid="coach-page-dashboard-leaderboards"\][\s\S]*min-height: 0 !important/);
  assert.match(css, /coach-page-dashboard-leaderboards[\s\S]*padding: 8px 14px 12px !important/);
  assert.match(css, /coach-page-dashboard-leaderboards[\s\S]*gap: 8px !important/);
});

test('mobile Leaderboards compacts only duplicated command chrome while preserving all four metric controls', () => {
  assert.match(css, /coach-page-dashboard-leaderboards[\s\S]*secondaryPageIntro__summary[\s\S]*display: none !important/);
  assert.match(css, /coach-page-dashboard-leaderboards[\s\S]*secondaryPageIntro__status[\s\S]*display: none !important/);
  assert.match(css, /coach-page-dashboard-leaderboards-metric-strip[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) !important/);
  assert.match(css, /coach-page-dashboard-leaderboards-metric-strip[\s\S]*min-height: 72px !important/);
  assert.match(css, /coach-page-dashboard-leaderboards-metric-strip[\s\S]*font-size: 24px !important/);
});

test('Player Intelligence establishes a local dark token boundary when opened from light Leaderboards', () => {
  assert.match(css, /coach-player-intelligence-drawer/);
  assert.match(css, /--text-1: #f4f7f2 !important/);
  assert.match(css, /--text-2: #aab4ad !important/);
  assert.match(css, /--text-3: #7f8a84 !important/);
  assert.match(css, /drawerHeader[\s\S]*h2[\s\S]*color: #f4f7f2 !important/);
  assert.match(css, /drawerMetric[\s\S]*strong[\s\S]*-webkit-text-fill-color: #f4f7f2 !important/);
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

test('rendered iPhone evidence covers first-viewport Leaderboards and high-contrast player drill-down', () => {
  assert.match(screenshots, /data-nav-key="leaderboards"/);
  assert.match(screenshots, /coach-leaderboard-pulse/);
  assert.match(screenshots, /coach-page-dashboard-leaderboards-decision-brief/);
  assert.match(screenshots, /coach-page-dashboard-leaderboards-evidence/);
  assert.match(screenshots, /window\.innerHeight/);
  assert.match(screenshots, /coach-leaderboard-operational-results/);
  assert.match(screenshots, /10-coach-leaderboards/);
  assert.match(screenshots, /coach-player-intelligence-drawer/);
  assert.match(screenshots, /rgb\(244, 247, 242\)/);
  assert.match(screenshots, /drawerMetric/);
  assert.match(screenshots, /coach-follow-up-ledger-host/);
  assert.match(screenshots, /toContain\("drawerBody"\)/);
});

test('App Store workflow carries Phase 3L and its evidence package', () => {
  assert.match(workflow, /tests\/phase-3l-coach-leaderboard-hierarchy\.test\.mjs/);
  assert.match(workflow, /phase-3l-coach-leaderboard-screenshots\.spec\.mjs/);
  assert.match(workflow, /shotlab-phase-3l-coach-leaderboard-hierarchy-evidence/);
});
