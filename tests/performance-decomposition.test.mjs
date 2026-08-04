import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const viteConfig = fs.readFileSync('vite.config.js', 'utf8')
const appSource = fs.readFileSync('src/App.jsx', 'utf8')
const deferredCharts = fs.readFileSync('src/components/DeferredShotLabCharts.jsx', 'utf8')

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
