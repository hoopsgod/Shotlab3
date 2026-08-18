import test from 'node:test'
import assert from 'node:assert/strict'
import { pruneOverriddenAuthorityBundles } from '../scripts/prune-overridden-authority-bundles.mjs'

test('cross-bundle authority pruning removes only later-winning exact declarations', () => {
  const result = pruneOverriddenAuthorityBundles([
    '.stage{color:red;padding:8px}.keep{color:blue}',
    '.stage{color:white}',
  ])

  assert.equal(result.sources.length, 2)
  assert.doesNotMatch(result.sources[0], /color:red/)
  assert.match(result.sources[0], /padding:8px/)
  assert.match(result.sources[0], /\.keep\{color:blue\}/)
  assert.match(result.sources[1], /color:white/)
  assert.equal(result.removedDeclarations, 1)
  assert.ok(result.rawBytesRemoved > 0)
})

test('cross-bundle authority pruning preserves incompatible cascade contexts', () => {
  const result = pruneOverriddenAuthorityBundles([
    '@media (max-width:760px){.stage{color:red}}',
    '@media (min-width:761px){.stage{color:white}}',
  ])

  assert.match(result.sources[0], /color:red/)
  assert.match(result.sources[1], /color:white/)
  assert.equal(result.removedDeclarations, 0)
})

test('cross-bundle authority pruning respects earlier important declarations', () => {
  const result = pruneOverriddenAuthorityBundles([
    '.stage{color:red!important}',
    '.stage{color:white}',
  ])

  assert.match(result.sources[0], /color:red!important/)
  assert.match(result.sources[1], /color:white/)
  assert.equal(result.removedDeclarations, 0)
})
