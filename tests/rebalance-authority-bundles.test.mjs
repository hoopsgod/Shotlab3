import test from 'node:test'
import assert from 'node:assert/strict'
import { rebalanceAuthorityBundles } from '../scripts/rebalance-authority-bundles.mjs'

test('authority rebalance preserves the exact ordered cascade and never worsens gzip', () => {
  const first = [
    '.a{font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#fff}',
    '.b{font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#eee}',
  ].join('')
  const second = [
    '.c{font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#ddd}',
    '.d{font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#ccc}',
  ].join('')

  const result = rebalanceAuthorityBundles([first, second], { maxBytes: 320 })

  assert.equal(result.sources.join(''), `${first}${second}`)
  assert.ok(result.optimizedGzipBytes <= result.originalGzipBytes)
  assert.ok(result.sources.every((source) => Buffer.byteLength(source) <= 320))
})

test('authority rebalance splits only at safe top-level rule boundaries', () => {
  const first = '@media (max-width:760px){.stage{background:url("data:image/svg+xml,%7Bsafe%7D");color:white}}.next{padding:8px}'
  const second = '.later{padding:10px}.end{margin:0}'
  const result = rebalanceAuthorityBundles([first, second], { maxBytes: 150 })

  assert.equal(result.sources.join(''), `${first}${second}`)
  assert.ok(result.sources[0].endsWith('}') || result.sources[0].endsWith(';'))
  assert.ok(result.sources.every((source) => Buffer.byteLength(source) <= 150))
})

test('authority rebalance is inert unless the build produced exactly two authority bundles', () => {
  const single = '.only{color:red}'
  const result = rebalanceAuthorityBundles([single])

  assert.deepEqual(result.sources, [single])
  assert.equal(result.changed, false)
  assert.equal(result.optimizedGzipBytes, result.originalGzipBytes)
})
