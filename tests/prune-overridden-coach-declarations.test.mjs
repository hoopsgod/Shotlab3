import assert from 'node:assert/strict'
import test from 'node:test'
import { pruneOverriddenCoachDeclarations } from '../scripts/prune-overridden-coach-declarations.mjs'

test('removes an earlier property when the exact selector later replaces it', () => {
  const source = '.card{padding:12px;color:#111}.other{color:red}.card{padding:16px}'
  const result = pruneOverriddenCoachDeclarations(source)
  assert.equal(result.css, '.card{color:#111}.other{color:red}.card{padding:16px}')
  assert.equal(result.removedDeclarations, 1)
})

test('does not cross media contexts', () => {
  const source = '.card{padding:12px}@media(max-width:600px){.card{padding:8px}}'
  const result = pruneOverriddenCoachDeclarations(source)
  assert.equal(result.css, source)
  assert.equal(result.removedDeclarations, 0)
})

test('prunes repeated selectors inside the same media context', () => {
  const source = '@media(max-width:600px){.card{padding:12px;color:red}.card{padding:8px}}'
  const result = pruneOverriddenCoachDeclarations(source)
  assert.equal(result.css, '@media(max-width:600px){.card{color:red}.card{padding:8px}}')
})

test('preserves an earlier important declaration when the later declaration is not important', () => {
  const source = '.card{color:red!important}.card{color:blue}'
  const result = pruneOverriddenCoachDeclarations(source)
  assert.equal(result.css, source)
})

test('allows a later important declaration to supersede an earlier normal declaration', () => {
  const source = '.card{color:red}.card{color:blue!important}'
  const result = pruneOverriddenCoachDeclarations(source)
  assert.equal(result.css, '.card{}.card{color:blue!important}')
})

test('keeps nested supports and media contexts independent', () => {
  const source = '.card{display:block}@supports(display:grid){.card{display:block}.card{display:grid}}'
  const result = pruneOverriddenCoachDeclarations(source)
  assert.equal(result.css, '.card{display:block}@supports(display:grid){.card{}.card{display:grid}}')
})
