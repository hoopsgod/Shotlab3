import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const viteConfig = fs.readFileSync('vite.config.js', 'utf8')
const appSource = fs.readFileSync('src/App.jsx', 'utf8')
const deferredCharts = fs.readFileSync('src/components/DeferredShotLabCharts.jsx', 'utf8')
const deferredLeaderboards = fs.readFileSync('src/components/DeferredPremiumLeaderboardsHub.jsx', 'utf8')
const deferredCoachPhase2 = fs.readFileSync('src/components/DeferredCoachDashboardPhase2.jsx', 'utf8')
const deferredCareerHistory = fs.readFileSync('src/components/DeferredPlayerCareerHistory.jsx', 'utf8')
const verifierSource = fs.readFileSync('scripts/verify-performance-budget.mjs', 'utf8')
const performanceBudget = JSON.parse(fs.readFileSync('performance-budget.json', 'utf8'))

test('progress analytics are redirected through a deferred boundary', () => {
  assert.match(appSource, /import ShotLabCharts from ["']\.\/components\/ShotLabCharts["']/)
  assert.match(viteConfig, /name:\s*["']shotlab-defer-progress-charts["']/)
  assert.match(viteConfig, /source === STATIC_CHART_IMPORT/)
  assert.match(viteConfig, /importerId\.endsWith\(APP_MODULE_SUFFIX\)/)
  assert.match(viteConfig, /DeferredShotLabCharts\.jsx/)
})

test('the deferred charts boundary dynamically imports the implementation', () => {
  assert.match(deferredCharts, /lazy\(\(\) => import\(["']\.\/ShotLabCharts\.jsx["']\)\)/)
  assert.match(deferredCharts, /<Suspense fallback=/)
  assert.match(deferredCharts, /data-testid=["']progress-charts-workspace["']/)
  assert.match(deferredCharts, /data-testid=["']progress-charts-loading["']/)
  assert.doesNotMatch(deferredCharts, /^import ShotLabCharts/m)
})

test('leaderboard analytics are redirected through a deferred boundary', () => {
  assert.match(appSource, /import PremiumLeaderboardsHub from ["']\.\/components\/PremiumLeaderboardsHub["']/)
  assert.match(viteConfig, /name:\s*["']shotlab-defer-leaderboard-analytics["']/)
  assert.match(viteConfig, /source === STATIC_LEADERBOARDS_IMPORT/)
  assert.match(viteConfig, /DeferredPremiumLeaderboardsHub\.jsx/)
})

test('the deferred leaderboards boundary dynamically imports the implementation', () => {
  assert.match(deferredLeaderboards, /lazy\(\(\) => import\(["']\.\/PremiumLeaderboardsHub\.jsx["']\)\)/)
  assert.match(deferredLeaderboards, /<Suspense fallback=/)
  assert.match(deferredLeaderboards, /data-testid=["']deferred-leaderboards-workspace["']/)
  assert.match(deferredLeaderboards, /data-testid=["']leaderboards-loading["']/)
  assert.doesNotMatch(deferredLeaderboards, /^import PremiumLeaderboardsHub/m)
})

test('Coach Phase 2 intelligence is redirected through a deferred boundary', () => {
  assert.match(appSource, /from ["']\.\/components\/CoachDashboardPhase2\.jsx["']/)
  assert.match(viteConfig, /name:\s*["']shotlab-defer-coach-phase2-intelligence["']/)
  assert.match(viteConfig, /source === STATIC_COACH_PHASE2_IMPORT/)
  assert.match(viteConfig, /DeferredCoachDashboardPhase2\.jsx/)
})

test('the deferred Coach boundary preserves every named export through one lazy implementation', () => {
  assert.match(deferredCoachPhase2, /import\(["']\.\/CoachDashboardPhase2\.jsx["']\)/)
  assert.match(deferredCoachPhase2, /lazyNamed/)
  for (const exportName of [
    'CoachActivityIntelligencePanel',
    'CoachDrillsOperationalPanel',
    'CoachEventIntelligenceDrawer',
    'CoachLeaderboardOperationalPanel',
    'CoachPlayerIntelligenceDrawer',
    'CoachSeasonComparisonPanel',
    'CoachStrengthOperationalPanel',
  ]) {
    assert.match(deferredCoachPhase2, new RegExp(`export function ${exportName}`))
    assert.match(deferredCoachPhase2, new RegExp(`lazyNamed\\('${exportName}'\\)`))
  }
  assert.match(deferredCoachPhase2, /data-testid=["']coach-intelligence-loading["']/)
  assert.doesNotMatch(deferredCoachPhase2, /^import .*CoachDashboardPhase2/m)
})

test('Player career history is redirected through a deferred boundary', () => {
  assert.match(appSource, /import PlayerCareerHistory from ["']\.\/components\/PlayerCareerHistory\.jsx["']/)
  assert.match(viteConfig, /name:\s*["']shotlab-defer-player-career-history["']/)
  assert.match(viteConfig, /source === STATIC_CAREER_HISTORY_IMPORT/)
  assert.match(viteConfig, /DeferredPlayerCareerHistory\.jsx/)
})

test('the deferred career history boundary dynamically imports its implementation', () => {
  assert.match(deferredCareerHistory, /lazy\(\(\) => import\(["']\.\/PlayerCareerHistory\.jsx["']\)\)/)
  assert.match(deferredCareerHistory, /<Suspense fallback=/)
  assert.match(deferredCareerHistory, /data-testid=["']player-career-history-loading["']/)
  assert.doesNotMatch(deferredCareerHistory, /^import PlayerCareerHistory/m)
})

test('shared season analytics stay inside the leaderboard chunk without restoring a tiny chart-vendor request', () => {
  assert.match(viteConfig, /moduleId\.includes\(["']\/src\/components\/PremiumLeaderboardsHub\.jsx["']\)/)
  assert.match(viteConfig, /moduleId\.includes\(["']\/src\/lib\/seasonLeaderboardAnalytics\.js["']\)/)
  assert.match(viteConfig, /return ["']PremiumLeaderboardsHub["']/)
  assert.doesNotMatch(viteConfig, /return ["']charts-vendor["']/)
})

test('the performance verifier locks both startup JavaScript and startup CSS', () => {
  assert.match(verifierSource, /const largestCss = css\[0\]/)
  assert.match(verifierSource, /largestCss\.bytes > budget\.maxLargestCssBytes/)
  assert.equal(performanceBudget.maxLargestJavaScriptBytes, 950000)
  assert.equal(performanceBudget.maxLargestCssBytes, 200000)
  assert.equal(performanceBudget.maxJavaScriptFileCount, 8)
})
