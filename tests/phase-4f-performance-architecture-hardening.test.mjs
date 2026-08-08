import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const vite = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const optimizer = await readFile(new URL('../scripts/optimize-production-css.mjs', import.meta.url), 'utf8')
const budget = JSON.parse(await readFile(new URL('../performance-budget.json', import.meta.url), 'utf8'))

test('Phase 4F removes the Player analytics circular manual-chunk boundary', () => {
  assert.match(vite, /return 'PlayerAnalyticsWorkspaces'/)
  assert.doesNotMatch(vite, /return 'PremiumLeaderboardsHub'/)
  assert.doesNotMatch(vite, /return 'PlayerProfileWorkspaces'/)
})

test('Phase 4F moves high-weight domain services out of the monolithic App chunk', () => {
  assert.match(vite, /APP_DOMAIN_SERVICE_FRAGMENTS/)
  for (const fragment of [
    'appPersistenceService',
    'homeShotLogging',
    'playerDataManagement',
    'playerDashboardSelectors',
    'coachOperationalIntelligence',
    'playerOperationalWorkspaces',
  ]) {
    assert.match(vite, new RegExp(fragment))
  }
  assert.match(vite, /return 'AppDomainServices'/)
})

test('Phase 4F uses reproducible production-grade minification', () => {
  assert.equal(packageJson.devDependencies.terser, '5.49.2')
  assert.equal(packageJson.devDependencies.lightningcss, '1.33.0')
  assert.match(vite, /minify:\s*'terser'/)
  assert.match(vite, /cssMinify:\s*'lightningcss'/)
  assert.match(vite, /passes:\s*2/)
})

test('Phase 4F strips low-value production logging but preserves warning and error diagnostics', () => {
  assert.match(vite, /pure:\s*\['console\.log', 'console\.debug', 'console\.info'\]/)
  assert.doesNotMatch(vite, /console\.warn'.*pure/)
  assert.doesNotMatch(vite, /console\.error'.*pure/)
})

test('Phase 4F compiles superseded CSS without purging selectors by guesswork', () => {
  assert.match(packageJson.scripts.build, /optimize-production-css\.mjs/)
  assert.match(optimizer, /same selector\/property|superseded declarations/i)
  assert.match(optimizer, /RECURSIVE_AT_RULE/)
  assert.match(optimizer, /previous\.important/)
  assert.doesNotMatch(optimizer, /purgecss|unused selector|querySelectorAll/i)
})

test('Phase 4F does not weaken the established performance budget', () => {
  assert.equal(budget.maxLargestJavaScriptBytes, 585000)
  assert.equal(budget.maxStartupAppJavaScriptBytes, 585000)
  assert.equal(budget.maxStartupAppJavaScriptGzipBytes, 166000)
  assert.equal(budget.maxTotalJavaScriptGzipBytes, 365000)
  assert.equal(budget.maxLargestCssBytes, 128000)
  assert.equal(budget.maxStartupAppCssBytes, 25000)
  assert.equal(budget.maxStartupAppCssGzipBytes, 5500)
  assert.equal(budget.maxTotalCssGzipBytes, 76750)
  assert.equal(budget.maxJavaScriptFileCount, 8)
})
