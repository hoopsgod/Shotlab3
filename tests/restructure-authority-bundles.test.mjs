import test from 'node:test'
import assert from 'node:assert/strict'
import { restructureAuthorityBundles } from '../scripts/restructure-authority-bundles.mjs'

test('authority restructure is monotonic and preserves later cascade winners', () => {
  const result = restructureAuthorityBundles([
    '.stage{color:red;margin:0}.shared{padding:8px;color:#fff}',
    '.stage{color:blue}.shared{padding:8px;background:#000}',
  ], { maxBytes: 200 })
  const css = result.sources.join('')

  assert.ok(result.optimizedGzipBytes <= result.originalGzipBytes)
  assert.ok(result.sources.every((source) => Buffer.byteLength(source) <= 200))
  assert.match(css, /color:(?:blue|#00f)/)
  assert.match(css, /background:#000/)
  assert.match(css, /margin:0/)
})

test('authority restructure preserves important cascade semantics', () => {
  const result = restructureAuthorityBundles([
    '.stage{color:red!important;padding:8px}',
    '.stage{color:blue;padding:10px}',
  ], { maxBytes: 160 })
  const css = result.sources.join('')

  assert.match(css, /color:red!important/)
  assert.match(css, /padding:10px/)
})

test('authority restructure refuses stylesheet-scoped directives', () => {
  const first = '@namespace svg url(http://www.w3.org/2000/svg);svg|a{color:red}'
  const second = '.stage{color:blue}'
  const result = restructureAuthorityBundles([first, second], { maxBytes: 160 })

  assert.equal(result.changed, false)
  assert.equal(result.skipped, 'stylesheet-scoped-directive')
  assert.deepEqual(result.sources, [first, second])
})

test('authority restructure is inert when the expected two-bundle contract is absent', () => {
  const result = restructureAuthorityBundles(['.only{color:red}'])
  assert.equal(result.changed, false)
  assert.equal(result.skipped, 'bundle-count')
})
