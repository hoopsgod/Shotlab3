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

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'))

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

test('mode selection is explicit and rejects silent fallback', () => {
  assert.strictEqual(routeEnhancersFor('dev'), DEV_ROUTE_ENHANCERS)
  assert.strictEqual(routeEnhancersFor('build'), BUILD_ROUTE_ENHANCERS)
  assert.throws(() => routeEnhancersFor('production'), /Expected "dev" or "build"/)
  assert.throws(() => routeEnhancersFor(undefined), /Expected "dev" or "build"/)
})
