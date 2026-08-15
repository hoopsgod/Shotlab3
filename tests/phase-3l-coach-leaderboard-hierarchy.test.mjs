import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3l-coach-leaderboard-hierarchy.mjs', 'utf8');
const css = readFileSync('public/shotlab-phase3l-coach-leaderboard-hierarchy.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const routeEnhancers = readFileSync('scripts/run-route-enhancers.mjs', 'utf8');
const app = readFileSync('src/App.jsx', 'utf8');
const panel = readFileSync('src/components/CoachDashboardPhase2.jsx', 'utf8');
const routeStage = readFileSync('src/components/CoachRoutePerformanceStage.jsx', 'utf8');
const routeStageCss = readFileSync('src/components/CoachRoutePerformanceStage.module.css', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('tests/e2e/phase-3l-coach-leaderboard-screenshots.spec.mjs', 'utf8');
const secondaryCss = readFileSync('src/components/SecondaryPageSystem.css', 'utf8');

test('Phase 3L runs after accepted Phase 3K and remains guarded/idempotent', () => {
  assert.match(pkg.scripts.dev, /run-route-enhancers\.mjs dev/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /run-route-enhancers\.mjs build/);
  assert.match(routeEnhancers, /apply-phase3k-coach-strength-hierarchy\.mjs[\s\S]*apply-phase3l-coach-leaderboard-hierarchy\.mjs/);
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
  assert.match(css, /rgba\(255,\s*255,\s*255,\s*\.95\)/);
  assert.match(css, /color:\s*#171a18/);
  assert.match(css, /coachLeaderboardRow:focus-visible/);
  assert.match(css, /outline:\s*3px solid/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('mobile Leaderboards preserves the decision and performance-evidence hierarchy', () => {
  assert.doesNotMatch(css, /coach-page-dashboard-leaderboards-decision-brief/);
  assert.doesNotMatch(css, /coach-page-dashboard-leaderboards-evidence/);
  assert.match(routeStage, /data-visual-role="primary-decision"/);
  assert.match(routeStage, /data-visual-role="performance-evidence"/);
  assert.match(routeStage, /data-route-kind=\{routeKind\}/);
  assert.match(secondaryCss, /\.secondaryPageDecision\s*\{[\s\S]*?linear-gradient\(145deg, #171b18, #0c0f0d 72%\)/);
});

test('mobile Leaderboards readability is owned by the premium route stage rather than legacy route CSS', () => {
  assert.match(routeStage, /aria-label="Current performance signals"/);
  assert.match(routeStage, /aria-pressed=\{active\}/);
  assert.match(routeStageCss, /--stage-accent:\s*#c8ff1a/);
  assert.match(routeStageCss, /\.title\s*\{[\s\S]*color:\s*#f6f7ef/);
  assert.match(routeStageCss, /\.metricValue,[\s\S]*color:\s*#f7f8f0/);
  assert.match(routeStageCss, /min-height:\s*var\(--touch-target, 44px\)/);
});

test('Player Intelligence establishes a complete dark-native surface boundary when opened from light Leaderboards', () => {
  assert.match(css, /coach-player-intelligence-drawer/);
  assert.match(css, /--text-1:\s*#f4f7f2\s*!important/);
  assert.match(css, /--text-2:\s*#aab4ad\s*!important/);
  assert.match(css, /--text-3:\s*#7f8a84\s*!important/);
  assert.match(css, /drawerHeader[\s\S]*h2[\s\S]*color:\s*#f4f7f2\s*!important/);
  assert.match(css, /drawerMetric[\s\S]*strong[\s\S]*-webkit-text-fill-color:\s*#f4f7f2\s*!important/);
  assert.match(css, /sectionCompact[\s\S]*background:\s*#101315\s*!important/);
  assert.match(css, /sectionCompact[\s\S]*sectionHeader[\s\S]*sectionBody[\s\S]*background:\s*transparent\s*!important/);
  assert.match(css, /sectionEyebrow[\s\S]*sectionTitle[\s\S]*sectionSummary[\s\S]*background:\s*transparent\s*!important/);
  assert.match(css, /sectionEyebrow[\s\S]*::before[\s\S]*sectionSummary[\s\S]*::after[\s\S]*content:\s*none\s*!important/);
  assert.match(css, /compactMetric[\s\S]*background:\s*#0c1012\s*!important/);
});

test('rank and weekly pace receive dedicated mobile hierarchy without horizontal overflow debt', () => {
  assert.match(css, /grid-template-columns:\s*38px\s+minmax\(0,\s*1fr\)\s+auto/);
  assert.match(css, /coachLeaderboardRank/);
  assert.match(css, /coachLeaderboardWeek/);
  assert.match(css, /text-overflow:\s*ellipsis/);
  assert.doesNotMatch(css, /min-width:\s*[4-9][0-9]{2}px/);
});

test('Phase 3L authority loads after Phase 3K', () => {
  assert.match(html, /shotlab-phase3k-coach-strength-hierarchy\.css[\s\S]*shotlab-phase3l-coach-leaderboard-hierarchy\.css/);
});

test('rendered iPhone evidence covers first-viewport Leaderboards and high-contrast player drill-down', () => {
  assert.match(screenshots, /data-nav-key="leaderboards"/);
  assert.match(screenshots, /coach-leaderboard-pulse/);
  assert.match(screenshots, /coach-page-dashboard-leaderboards-decision-brief/);
  assert.match(screenshots, /data-visual-role=\"performance-evidence\"/);
  assert.match(screenshots, /Current Leader:/);
  assert.match(screenshots, /Archived Seasons:/);
  assert.match(screenshots, /window\.innerHeight/);
  assert.match(screenshots, /coach-leaderboard-operational-results/);
  assert.match(screenshots, /10-coach-leaderboards/);
  assert.match(screenshots, /coach-player-intelligence-drawer/);
  assert.match(screenshots, /parseCssColor/);
  assert.match(screenshots, /rgb\(244, 247, 242\)/);
  assert.match(screenshots, /toBeLessThanOrEqual\(24\)/);
  assert.match(screenshots, /toBeGreaterThanOrEqual\(0\.9\)/);
  assert.match(screenshots, /rgba\(0, 0, 0, 0\)/);
  assert.match(screenshots, /Weekly makes/);
  assert.match(screenshots, /Development pulse/);
  assert.match(screenshots, /A decision-ready summary of volume, attendance, and training compliance\./);
  assert.match(screenshots, /coach-follow-up-ledger-host/);
  assert.match(screenshots, /closest\('\[role="dialog"\]'\)/);
});

test('App Store workflow carries Phase 3L and its evidence package', () => {
  assert.match(workflow, /tests\/phase-3l-coach-leaderboard-hierarchy\.test\.mjs/);
  assert.match(workflow, /phase-3l-coach-leaderboard-screenshots\.spec\.mjs/);
  assert.match(workflow, /shotlab-phase-3l-coach-leaderboard-hierarchy-evidence/);
});
