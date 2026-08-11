import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  BUILD_ROUTE_ENHANCERS,
  DEV_ROUTE_ENHANCERS,
  routeEnhancersFor,
} from '../scripts/run-route-enhancers.mjs'
import {
  findBuildRegressions,
  inheritedBudgetDebt,
} from '../scripts/verify-phase5a-build-equivalence.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'))
const phase5aEnhancer = await readFile(path.join(rootDir, 'scripts/apply-phase5a-coach-daily-intelligence.mjs'), 'utf8')

const buildPrefix = [
  'scripts/run-finish-v9-compatible.mjs',
  'scripts/align-v9-player-boundary-contract.mjs',
]
const finalTouchSafety = [
  'scripts/apply-phase4e9-player-profile-data-request.mjs',
  'scripts/apply-phase4e10-player-profile-account-touch-safety.mjs',
  'scripts/apply-phase4e11-coach-residual-touch-safety.mjs',
]

function assertUnique(label, entries) {
  assert.equal(new Set(entries).size, entries.length, `${label} must not contain duplicate enhancers`)
}

function performanceFixture() {
  return {
    budget: {
      maxLargestCssBytes: 128000,
      maxTotalCssGzipBytes: 88000,
    },
    totals: {
      javaScriptFiles: 8,
      javaScriptBytes: 1320000,
      javaScriptGzipBytes: 347000,
      cssFiles: 12,
      cssBytes: 534000,
      cssGzipBytes: 90900,
    },
    startupAppJavaScript: { bytes: 471000, gzipBytes: 119000 },
    startupAppCss: { bytes: 0, gzipBytes: 0 },
    largestJavaScript: { bytes: 471000, gzipBytes: 119000 },
    largestCss: { bytes: 153000, gzipBytes: 24900 },
  }
}

test('route enhancer manifests preserve the certified dev/build ordering contract', () => {
  assert.equal(DEV_ROUTE_ENHANCERS.length, 36)
  assert.equal(BUILD_ROUTE_ENHANCERS.length, 39)
  assertUnique('dev route enhancer manifest', DEV_ROUTE_ENHANCERS)
  assertUnique('build route enhancer manifest', BUILD_ROUTE_ENHANCERS)

  assert.deepEqual(BUILD_ROUTE_ENHANCERS.slice(0, 2), buildPrefix)
  assert.deepEqual(DEV_ROUTE_ENHANCERS.slice(-3), finalTouchSafety)
  assert.deepEqual(BUILD_ROUTE_ENHANCERS.slice(-3), finalTouchSafety)

  const devMinifyIndex = DEV_ROUTE_ENHANCERS.indexOf('scripts/minify-visual-authority-css.mjs')
  const buildMinifyIndex = BUILD_ROUTE_ENHANCERS.indexOf('scripts/minify-visual-authority-css.mjs')
  const buildAlignmentIndex = BUILD_ROUTE_ENHANCERS.indexOf('scripts/align-phase4f-browser-contracts.mjs')
  const buildPhase5Index = BUILD_ROUTE_ENHANCERS.indexOf('scripts/apply-phase5a-coach-daily-intelligence.mjs')

  assert.equal(devMinifyIndex, 22)
  assert.equal(buildMinifyIndex, 24)
  assert.equal(buildAlignmentIndex, buildMinifyIndex + 1)
  assert.equal(buildPhase5Index, buildAlignmentIndex + 1)

  const expectedBuildFromDev = [
    ...buildPrefix,
    ...DEV_ROUTE_ENHANCERS.slice(0, devMinifyIndex + 1),
    'scripts/align-phase4f-browser-contracts.mjs',
    ...DEV_ROUTE_ENHANCERS.slice(devMinifyIndex + 1),
  ]
  assert.deepEqual(BUILD_ROUTE_ENHANCERS, expectedBuildFromDev)
})

test('every orchestrated route enhancer resolves to a repository file', async () => {
  const scripts = new Set([...DEV_ROUTE_ENHANCERS, ...BUILD_ROUTE_ENHANCERS])
  await Promise.all([...scripts].map((script) => access(path.join(rootDir, script))))
})

test('package scripts delegate orchestration instead of duplicating the enhancer chain', () => {
  assert.equal(
    packageJson.scripts.dev,
    'node scripts/run-route-enhancers.mjs dev && vite --host 0.0.0.0 --port 4173',
  )
  assert.equal(
    packageJson.scripts['prepare:route-enhancers'],
    'node scripts/run-route-enhancers.mjs build',
  )
  assert.doesNotMatch(packageJson.scripts.dev, /apply-phase/)
  assert.doesNotMatch(packageJson.scripts['prepare:route-enhancers'], /apply-phase/)
})

test('Phase 5A prepared source includes both home and program scores in season comparisons', () => {
  assert.match(phase5aEnhancer, /currentScores:\[\.\.\.safeScores,\.\.\.safeProgramScores\]/)
  assert.match(phase5aEnhancer, /\[coachRosterPlayers,safeScores,safeProgramScores,safeShotLogs/)
  assert.match(phase5aEnhancer, /season comparison must include both home and program score collections/)
})

test('mode selection is explicit and rejects silent fallback', () => {
  assert.strictEqual(routeEnhancersFor('dev'), DEV_ROUTE_ENHANCERS)
  assert.strictEqual(routeEnhancersFor('build'), BUILD_ROUTE_ENHANCERS)
  assert.throws(() => routeEnhancersFor('production'), /Expected "dev" or "build"/)
  assert.throws(() => routeEnhancersFor(undefined), /Expected "dev" or "build"/)
})

test('build equivalence gate rejects candidate bundle regressions', () => {
  const base = performanceFixture()
  const equal = structuredClone(base)
  assert.deepEqual(findBuildRegressions(base, equal), [])

  const improved = structuredClone(base)
  improved.totals.javaScriptGzipBytes -= 100
  improved.totals.cssGzipBytes -= 100
  assert.deepEqual(findBuildRegressions(base, improved), [])

  const regressed = structuredClone(base)
  regressed.totals.cssGzipBytes += 1
  regressed.largestCss.bytes += 25
  const failures = findBuildRegressions(base, regressed)
  assert.equal(failures.length, 2)
  assert.match(failures.join('\n'), /total CSS gzip bytes regressed/)
  assert.match(failures.join('\n'), /largest CSS raw bytes regressed/)
})

test('build equivalence reports inherited CSS budget debt without erasing it', () => {
  const metrics = performanceFixture()
  const debt = inheritedBudgetDebt(metrics)
  assert.equal(debt.length, 2)
  assert.match(debt[0], /largest CSS raw bytes/)
  assert.match(debt[1], /total CSS gzip bytes/)
})
