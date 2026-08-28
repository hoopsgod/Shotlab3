import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const viteConfig = fs.readFileSync('vite.config.js', 'utf8')
const phase5bViteConfig = fs.readFileSync('vite.phase5b.config.js', 'utf8')
const legacyRuntimeCssExtraction = fs.readFileSync('scripts/legacy-runtime-css-extraction-plugin.mjs', 'utf8')
const appSource = fs.readFileSync('src/App.jsx', 'utf8')
const deferredCharts = fs.readFileSync('src/components/DeferredShotLabCharts.jsx', 'utf8')
const deferredLeaderboards = fs.readFileSync('src/components/DeferredPremiumLeaderboardsHub.jsx', 'utf8')
const deferredCoachCommandCenter = fs.readFileSync('src/components/DeferredCoachCommandCenter.jsx', 'utf8')
const deferredCoachPhase2 = fs.readFileSync('src/components/DeferredCoachDashboardPhase2.jsx', 'utf8')
const deferredCoachInteractive = fs.readFileSync('src/components/DeferredCoachInteractiveDashboards.jsx', 'utf8')
const deferredCareerHistory = fs.readFileSync('src/components/DeferredPlayerCareerHistory.jsx', 'utf8')
const verifierSource = fs.readFileSync('scripts/verify-performance-budget.mjs', 'utf8')
const performanceBudget = JSON.parse(fs.readFileSync('performance-budget.json', 'utf8'))

test('progress analytics are redirected through a deferred boundary', () => {
  assert.match(appSource, /import ShotLabCharts from ["']\.\/components\/ShotLabCharts["']/)
  assert.match(viteConfig, /redirectAppImport\(["']shotlab-defer-progress-charts["'],\s*STATIC_CHART_IMPORT,\s*DEFERRED_CHART_MODULE\)/)
  assert.match(viteConfig, /source === sourceMatch && importerId\.endsWith\(APP_MODULE_SUFFIX\)/)
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
  assert.match(viteConfig, /redirectAppImport\(["']shotlab-defer-leaderboard-analytics["'],\s*STATIC_LEADERBOARDS_IMPORT,\s*DEFERRED_LEADERBOARDS_MODULE\)/)
  assert.match(viteConfig, /DeferredPremiumLeaderboardsHub\.jsx/)
})

test('the deferred leaderboards boundary dynamically imports the implementation', () => {
  assert.match(deferredLeaderboards, /lazy\(\(\) => import\(["']\.\/PremiumLeaderboardsHub\.jsx["']\)\)/)
  assert.match(deferredLeaderboards, /<Suspense fallback=/)
  assert.match(deferredLeaderboards, /data-testid=["']deferred-leaderboards-workspace["']/)
  assert.match(deferredLeaderboards, /data-testid=["']leaderboards-loading["']/)
  assert.doesNotMatch(deferredLeaderboards, /^import PremiumLeaderboardsHub/m)
})

test('Coach Mission Control is redirected through a deferred boundary', () => {
  assert.match(appSource, /import CoachCommandCenter from ["']\.\/components\/CoachCommandCenter["']/)
  assert.match(viteConfig, /redirectAppImport\(["']shotlab-defer-coach-command-center["'],\s*STATIC_COACH_COMMAND_CENTER_IMPORT,\s*DEFERRED_COACH_COMMAND_CENTER_MODULE\)/)
  assert.match(viteConfig, /DeferredCoachCommandCenter\.jsx/)
})

test('the deferred Coach Mission Control boundary preserves the default component contract', () => {
  assert.match(deferredCoachCommandCenter, /lazy\(\(\) => import\(["']\.\/CoachCommandCenter\.jsx["']\)\)/)
  assert.match(deferredCoachCommandCenter, /<Suspense fallback=/)
  assert.match(deferredCoachCommandCenter, /data-testid=["']coach-command-center-loading["']/)
  assert.match(deferredCoachCommandCenter, /<LazyCoachCommandCenter \{\.\.\.props\} \/>/)
  assert.doesNotMatch(deferredCoachCommandCenter, /^import CoachCommandCenter/m)
})

test('Coach Phase 2 intelligence is redirected through a deferred boundary', () => {
  assert.match(appSource, /from ["']\.\/components\/CoachDashboardPhase2\.jsx["']/)
  assert.match(viteConfig, /redirectAppImport\(["']shotlab-defer-coach-phase2-intelligence["'],\s*STATIC_COACH_PHASE2_IMPORT,\s*DEFERRED_COACH_PHASE2_MODULE\)/)
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

test('Coach interactive dashboards are redirected through a deferred boundary', () => {
  assert.match(appSource, /from ["']\.\/components\/CoachInteractiveDashboards\.jsx["']/)
  assert.match(viteConfig, /redirectAppImport\(["']shotlab-defer-coach-interactive-dashboards["'],\s*STATIC_COACH_INTERACTIVE_IMPORT,\s*DEFERRED_COACH_INTERACTIVE_MODULE\)/)
  assert.match(viteConfig, /DeferredCoachInteractiveDashboards\.jsx/)
})

test('the deferred Coach interactive boundary preserves all public exports', () => {
  assert.match(deferredCoachInteractive, /import\(["']\.\/CoachInteractiveDashboards\.jsx["']\)/)
  assert.match(deferredCoachInteractive, /lazyNamed/)
  for (const exportName of [
    'CoachEventsInteractiveDashboard',
    'CoachPageDashboardHeader',
    'CoachPlayersInteractiveDashboard',
  ]) {
    assert.match(deferredCoachInteractive, new RegExp(`export function ${exportName}`))
    assert.match(deferredCoachInteractive, new RegExp(`lazyNamed\\('${exportName}'\\)`))
  }
  assert.match(deferredCoachInteractive, /data-testid=["']coach-interactive-dashboard-loading["']/)
  assert.doesNotMatch(deferredCoachInteractive, /^import .*CoachInteractiveDashboards/m)
})

test('Coach operational implementations share the role workspace chunk', () => {
  assert.match(viteConfig, /COACH_WORKSPACE_FRAGMENTS/)
  assert.match(viteConfig, /['"]\/src\/components\/Coach['"]/)
  assert.match(viteConfig, /['"]\/src\/components\/ExperiencePrimitives['"]/)
  assert.match(viteConfig, /['"]\/src\/components\/SecondaryPageSystem['"]/)
  assert.match(viteConfig, /return ["']CoachWorkspaces["']/)
  assert.doesNotMatch(viteConfig, /return ["']CoachOperationalWorkspaces["']/)
  assert.equal(performanceBudget.maxJavaScriptFileCount, 8)
})

test('Player career history is redirected through a deferred boundary', () => {
  assert.match(appSource, /import PlayerCareerHistory from ["']\.\/components\/PlayerCareerHistory\.jsx["']/)
  assert.match(viteConfig, /redirectAppImport\(["']shotlab-defer-player-career-history["'],\s*STATIC_CAREER_HISTORY_IMPORT,\s*DEFERRED_CAREER_HISTORY_MODULE\)/)
  assert.match(viteConfig, /DeferredPlayerCareerHistory\.jsx/)
})

test('the deferred career history boundary dynamically imports the implementation', () => {
  assert.match(deferredCareerHistory, /lazy\(\(\) => import\(["']\.\/PlayerCareerHistory\.jsx["']\)\)/)
  assert.match(deferredCareerHistory, /<Suspense fallback=/)
  assert.match(deferredCareerHistory, /data-testid=["']player-career-history-loading["']/)
  assert.doesNotMatch(deferredCareerHistory, /^import PlayerCareerHistory/m)
})

test('shared season analytics use domain services while leaderboard UI stays in Player workspaces', () => {
  assert.match(viteConfig, /APP_DOMAIN_SERVICE_FRAGMENTS/)
  assert.match(viteConfig, /['"]\/src\/lib\/seasonLeaderboardAnalytics['"]/)
  assert.match(viteConfig, /return ["']AppDomainServices["']/)
  assert.match(viteConfig, /PLAYER_WORKSPACE_FRAGMENTS/)
  assert.match(viteConfig, /['"]\/src\/components\/PremiumLeaderboardsHub\.jsx["']/)
  assert.match(viteConfig, /return ["']PlayerWorkspaces["']/)
  assert.doesNotMatch(viteConfig, /return ["']charts-vendor["']/)
})

test('production externalizes legacy runtime CSS without changing the development App source path', () => {
  assert.match(phase5bViteConfig, /createLegacyRuntimeCssExtractionPlugin/)
  assert.match(phase5bViteConfig, /createLegacyRuntimeCssExtractionPlugin\(\)/)
  assert.match(legacyRuntimeCssExtraction, /const LEGACY_STYLE_ASSET = ['"]assets\/legacy-runtime\.css['"]/)
  assert.match(legacyRuntimeCssExtraction, /const LEGACY_STYLE_EXPORTS = \[['"]_STYLES_CSS['"], ['"]_PLAYER_COMPACT_DASHBOARD_CSS['"], ['"]_PAGE_SIGNATURE_CSS['"], ['"]_DESKTOP_SHELL_CSS['"]\]/)
  assert.match(legacyRuntimeCssExtraction, /LEGACY_STYLE_IMPORT/)
  assert.match(legacyRuntimeCssExtraction, /LEGACY_STYLE_COMPONENT/)
  assert.match(legacyRuntimeCssExtraction, /data-shotlab-legacy-runtime=\\"1\\"/)
  assert.match(appSource, /from ["']\.\/styles\/appLegacyStyles\.js["']/)
  assert.match(appSource, /const Styles=\(\)=>/)
})

test('the performance verifier locks startup App assets and total request budgets', () => {
  assert.match(verifierSource, /const startupAppJavaScript = findStartupAsset\(javaScript, ["']js["']\)/)
  assert.match(verifierSource, /const startupAppCss = findStartupAsset\(css, ["']css["'], \{ zeroWhenMissing: true \}\)/)
  assert.match(verifierSource, /startupAppJavaScript\.bytes > budget\.maxStartupAppJavaScriptBytes/)
  assert.match(verifierSource, /startupAppCss\.bytes > budget\.maxStartupAppCssBytes/)
  assert.equal(performanceBudget.maxLargestJavaScriptBytes, 585000)
  assert.equal(performanceBudget.maxStartupAppJavaScriptBytes, 585000)
  assert.equal(performanceBudget.maxStartupAppJavaScriptGzipBytes, 166000)
  assert.equal(performanceBudget.maxTotalJavaScriptGzipBytes, 365000)
  assert.equal(performanceBudget.maxLargestCssBytes, 128000)
  assert.equal(performanceBudget.maxStartupAppCssBytes, 25000)
  assert.equal(performanceBudget.maxStartupAppCssGzipBytes, 5500)
  assert.equal(performanceBudget.maxTotalCssGzipBytes, 88000)
  assert.equal(performanceBudget.maxJavaScriptFileCount, 8)
})
