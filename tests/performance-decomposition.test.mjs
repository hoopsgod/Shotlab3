import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const read = (path) => fs.readFileSync(path, 'utf8')
const vite = read('vite.config.js')
const app = read('src/App.jsx')
const verifier = read('scripts/verify-performance-budget.mjs')
const budget = JSON.parse(read('performance-budget.json'))

const deferred = {
  charts: read('src/components/DeferredShotLabCharts.jsx'),
  leaderboards: read('src/components/DeferredPremiumLeaderboardsHub.jsx'),
  command: read('src/components/DeferredCoachCommandCenter.jsx'),
  phase2: read('src/components/DeferredCoachDashboardPhase2.jsx'),
  interactive: read('src/components/DeferredCoachInteractiveDashboards.jsx'),
  career: read('src/components/DeferredPlayerCareerHistory.jsx'),
}

const assertDeferredBoundary = ({ source, staticImport, pluginName, wrapper, loadingTestId }) => {
  assert.match(app, new RegExp(`import .* from ["']${staticImport.replaceAll('.', '\\.')}["']`))
  assert.match(vite, new RegExp(`name:\\s*["']${pluginName}["']`))
  assert.match(vite, new RegExp(wrapper.replaceAll('.', '\\.')))
  assert.match(source, /<Suspense fallback=/)
  assert.match(source, new RegExp(`data-testid=["']${loadingTestId}["']`))
}

test('progress and leaderboard analytics remain deferred', () => {
  assertDeferredBoundary({
    source: deferred.charts,
    staticImport: './components/ShotLabCharts',
    pluginName: 'shotlab-defer-progress-charts',
    wrapper: 'DeferredShotLabCharts.jsx',
    loadingTestId: 'progress-charts-loading',
  })
  assert.match(deferred.charts, /lazy\(\(\) => import\(["']\.\/ShotLabCharts\.jsx["']\)\)/)
  assert.doesNotMatch(deferred.charts, /^import ShotLabCharts/m)

  assertDeferredBoundary({
    source: deferred.leaderboards,
    staticImport: './components/PremiumLeaderboardsHub',
    pluginName: 'shotlab-defer-leaderboard-analytics',
    wrapper: 'DeferredPremiumLeaderboardsHub.jsx',
    loadingTestId: 'leaderboards-loading',
  })
  assert.match(deferred.leaderboards, /lazy\(\(\) => import\(["']\.\/PremiumLeaderboardsHub\.jsx["']\)\)/)
  assert.doesNotMatch(deferred.leaderboards, /^import PremiumLeaderboardsHub/m)
})

test('Coach operational surfaces remain inside deferred boundaries', () => {
  assertDeferredBoundary({
    source: deferred.command,
    staticImport: './components/CoachCommandCenter',
    pluginName: 'shotlab-defer-coach-command-center',
    wrapper: 'DeferredCoachCommandCenter.jsx',
    loadingTestId: 'coach-command-center-loading',
  })
  assert.match(deferred.command, /<LazyCoachCommandCenter \{\.\.\.props\} \/>/)

  for (const exportName of [
    'CoachActivityIntelligencePanel',
    'CoachDrillsOperationalPanel',
    'CoachEventIntelligenceDrawer',
    'CoachLeaderboardOperationalPanel',
    'CoachPlayerIntelligenceDrawer',
    'CoachSeasonComparisonPanel',
    'CoachStrengthOperationalPanel',
  ]) {
    assert.match(deferred.phase2, new RegExp(`export function ${exportName}`))
    assert.match(deferred.phase2, new RegExp(`lazyNamed\\('${exportName}'\\)`))
  }

  for (const exportName of ['CoachEventsInteractiveDashboard', 'CoachPageDashboardHeader', 'CoachPlayersInteractiveDashboard']) {
    assert.match(deferred.interactive, new RegExp(`export function ${exportName}`))
    assert.match(deferred.interactive, new RegExp(`lazyNamed\\('${exportName}'\\)`))
  }

  for (const modulePath of [
    '/src/components/CoachCommandCenter.jsx',
    '/src/components/CoachDashboardPhase2.jsx',
    '/src/components/CoachInteractiveDashboards.jsx',
    '/src/components/SecondaryPageSystem.jsx',
    '/src/components/ExperiencePrimitives.jsx',
  ]) assert.match(vite, new RegExp(`moduleId\\.includes\\(["']${modulePath.replaceAll('/', '\\/')}["']\\)`))
  assert.match(vite, /return ["']CoachOperationalWorkspaces["']/)
})

test('Player career history and season analytics preserve their deferred chunk contracts', () => {
  assertDeferredBoundary({
    source: deferred.career,
    staticImport: './components/PlayerCareerHistory.jsx',
    pluginName: 'shotlab-defer-player-career-history',
    wrapper: 'DeferredPlayerCareerHistory.jsx',
    loadingTestId: 'player-career-history-loading',
  })
  assert.match(deferred.career, /lazy\(\(\) => import\(["']\.\/PlayerCareerHistory\.jsx["']\)\)/)
  assert.doesNotMatch(deferred.career, /^import PlayerCareerHistory/m)
  assert.match(vite, /moduleId\.includes\(["']\/src\/components\/PremiumLeaderboardsHub\.jsx["']\)/)
  assert.match(vite, /moduleId\.includes\(["']\/src\/lib\/seasonLeaderboardAnalytics\.js["']\)/)
  assert.match(vite, /return ["']PremiumLeaderboardsHub["']/)
  assert.doesNotMatch(vite, /return ["']charts-vendor["']/)
})

test('the verifier locks the Auth startup boundary and measured Phase 2 request budgets', () => {
  assert.match(app, /import Auth from ["']\.\/components\/AuthWorkspace\.jsx["']/)
  assert.match(app, /AUTH_WORKSPACE_RUNTIME=Object\.freeze/)
  assert.match(verifier, /const startupAppJavaScript = findStartupAsset\(javaScript, ["']js["']\)/)
  assert.match(verifier, /const startupAppCss = findStartupAsset\(css, ["']css["']\)/)
  assert.match(verifier, /startupAppJavaScript\.bytes > budget\.maxStartupAppJavaScriptBytes/)
  assert.match(verifier, /startupAppCss\.bytes > budget\.maxStartupAppCssBytes/)
  assert.deepEqual(budget, {
    maxLargestJavaScriptBytes: 585000,
    maxStartupAppJavaScriptBytes: 585000,
    maxStartupAppJavaScriptGzipBytes: 166000,
    maxTotalJavaScriptGzipBytes: 366000,
    maxLargestCssBytes: 128000,
    maxStartupAppCssBytes: 27000,
    maxStartupAppCssGzipBytes: 6100,
    maxTotalCssGzipBytes: 78500,
    maxJavaScriptFileCount: 8,
  })
})
