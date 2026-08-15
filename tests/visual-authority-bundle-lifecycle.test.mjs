import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const config = fs.readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8')

test('visual authority bundling runs only after Vite writes production output', () => {
  const start = config.indexOf('function bundleVisualAuthorityCss()')
  const end = config.indexOf('\nfunction reportBundleOwnership()', start)
  assert.ok(start >= 0 && end > start, 'visual authority bundler plugin must exist')

  const plugin = config.slice(start, end)
  assert.match(plugin, /async writeBundle\(\)/)
  assert.doesNotMatch(plugin, /async closeBundle\(\)/)
  assert.match(plugin, /path\.join\(distDir, 'index\.html'\)/)
  assert.match(plugin, /data-shotlab-authority-bundle/)
})
