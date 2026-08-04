import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const appSource = fs.readFileSync('src/App.jsx', 'utf8')
const viteConfig = fs.readFileSync('vite.config.js', 'utf8')
const fallbackSource = fs.readFileSync('src/components/PlayerInterfaceFallback.jsx', 'utf8')
const dailySource = fs.readFileSync('src/components/PlayerDailyCommandCenter.jsx', 'utf8')
const dailyPrimitives = fs.readFileSync('src/components/PlayerDailyPrimitives.jsx', 'utf8')
const performanceBudget = JSON.parse(fs.readFileSync('performance-budget.json', 'utf8'))

const boundaries = [
  {
    appImport: /import PlayerDashboardHeader from ["']\.\/components\/PlayerDashboardHeader["']/,
    redirectSource: "'./components/PlayerDashboardHeader'",
    wrapperPath: 'src/components/DeferredPlayerDashboardHeader.jsx',
    implementationImport: /import\(["']\.\/PlayerDashboardHeader\.jsx["']\)/,
    implementationPath: '/src/components/PlayerDashboardHeader.jsx',
    testId: 'player-dashboard-header-loading',
  },
  {
    appImport: /import PlayerDailyCommandCenter from ["']\.\/components\/PlayerDailyCommandCenter\.jsx["']/,
    redirectSource: "'./components/PlayerDailyCommandCenter.jsx'",
    wrapperPath: 'src/components/DeferredPlayerDailyCommandCenter.jsx',
    implementationImport: /import\(["']\.\/PlayerDailyCommandCenter\.jsx["']\)/,
    implementationPath: '/src/components/PlayerDailyCommandCenter.jsx',
    testId: 'player-daily-command-center-loading',
  },
  {
    appImport: /from ["']\.\/components\/PlayerOperationalWorkspace\.jsx["']/,
    redirectSource: "'./components/PlayerOperationalWorkspace.jsx'",
    wrapperPath: 'src/components/DeferredPlayerOperationalWorkspace.jsx',
    implementationImport: /import\(["']\.\/PlayerOperationalWorkspace\.jsx["']\)/,
    implementationPath: '/src/components/PlayerOperationalWorkspace.jsx',
    testId: 'player-workspace-command-loading',
  },
]

test('Player interface imports are redirected only from App', () => {
  assert.match(viteConfig, /name:\s*["']shotlab-defer-player-interface["']/)
  assert.match(viteConfig, /PLAYER_INTERFACE_REDIRECTS\.get\(source\)/)
  assert.match(viteConfig, /!importerId\.endsWith\(APP_MODULE_SUFFIX\)/)

  for (const boundary of boundaries) {
    assert.match(appSource, boundary.appImport)
    assert.ok(viteConfig.includes(boundary.redirectSource))
    assert.ok(viteConfig.includes(boundary.wrapperPath.split('/').at(-1)))
  }
})

test('Player interface wrappers preserve default and named component contracts', () => {
  for (const boundary of boundaries) {
    const wrapperSource = fs.readFileSync(boundary.wrapperPath, 'utf8')
    assert.match(wrapperSource, boundary.implementationImport)
    assert.match(wrapperSource, /<Suspense fallback=/)
    assert.ok(wrapperSource.includes(boundary.testId))
  }

  const headerWrapper = fs.readFileSync('src/components/DeferredPlayerDashboardHeader.jsx', 'utf8')
  const dailyWrapper = fs.readFileSync('src/components/DeferredPlayerDailyCommandCenter.jsx', 'utf8')
  const workspaceWrapper = fs.readFileSync('src/components/DeferredPlayerOperationalWorkspace.jsx', 'utf8')
  assert.match(headerWrapper, /<LazyPlayerDashboardHeader \{\.\.\.props\} \/>/)
  assert.match(dailyWrapper, /<LazyPlayerDailyCommandCenter \{\.\.\.props\} \/>/)
  assert.match(workspaceWrapper, /lazyNamed/)
  for (const exportName of ['PlayerWorkspaceCommandBar', 'PlayerWorkspaceEmptyState', 'PlayerWorkspaceFilterRail']) {
    assert.match(workspaceWrapper, new RegExp(`export function ${exportName}`))
    assert.match(workspaceWrapper, new RegExp(`lazyNamed\\("${exportName}"\\)`))
  }
})

test('Player interface uses one accessible polished loading system', () => {
  assert.match(fallbackSource, /role=["']status["']/)
  assert.match(fallbackSource, /aria-live=["']polite["']/)
  assert.match(fallbackSource, /Preparing \{label\}/)
  assert.match(fallbackSource, /data-loading-variant=\{variant\}/)
})

test('Daily Command Center uses Player-isolated primitives rather than Coach operational primitives', () => {
  assert.match(dailySource, /from ["']\.\/ExperiencePrimitives\.jsx["']/)
  assert.match(viteConfig, /name:\s*["']shotlab-isolate-player-daily-primitives["']/)
  assert.match(viteConfig, /source === STATIC_PLAYER_DAILY_PRIMITIVES_IMPORT/)
  assert.match(viteConfig, /importerId\.endsWith\(PLAYER_DAILY_MODULE_SUFFIX\)/)
  assert.match(viteConfig, /PlayerDailyPrimitives\.jsx/)
  for (const exportName of ['ExperiencePill', 'ExperienceProgressRing', 'ExperienceSignal']) {
    assert.match(dailyPrimitives, new RegExp(`export function ${exportName}`))
  }
  assert.doesNotMatch(dailyPrimitives, /ExperiencePrimitives\.jsx/)
})

test('Player interface and assignment card share one route-aligned request slot', () => {
  for (const boundary of boundaries) {
    assert.ok(viteConfig.includes(boundary.implementationPath))
  }
  assert.ok(viteConfig.includes('/src/components/PlayerDailyPrimitives.jsx'))
  assert.ok(viteConfig.includes('/src/components/PlayerCoachAssignmentCard.jsx'))
  assert.match(viteConfig, /return ["']PlayerInterfaceWorkspaces["']/)
  assert.equal(performanceBudget.maxJavaScriptFileCount, 8)
})
