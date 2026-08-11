import assert from 'node:assert/strict'
import test from 'node:test'
import { pruneOverriddenCoachDeclarations } from '../scripts/prune-overridden-coach-declarations.mjs'

const exclusiveMissionControlClasses = new Set([
  'mcActivationPlan',
  'mcCard',
  'mcShellV3',
])

const scopedOptions = {
  allowMissionControlScope: true,
  exclusiveMissionControlClasses,
}

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

test('removes an unscoped Mission Control declaration replaced by a later shell-scoped declaration', () => {
  const source = '.mcActivationPlan{padding:12px;color:#111}.mcShellV3 .mcActivationPlan{padding:16px}'
  const result = pruneOverriddenCoachDeclarations(source, scopedOptions)
  assert.equal(result.css, '.mcActivationPlan{color:#111}.mcShellV3 .mcActivationPlan{padding:16px}')
  assert.equal(result.scopedDeclarationsRemoved, 1)
})

test('allows the active-body Mission Control scope to replace a shell-scoped declaration', () => {
  const source = '.mcShellV3 .mcCard{padding:12px;color:#111}body.mission-control-active .mcShellV3 .mcCard{padding:18px}'
  const result = pruneOverriddenCoachDeclarations(source, scopedOptions)
  assert.equal(result.css, '.mcShellV3 .mcCard{color:#111}body.mission-control-active .mcShellV3 .mcCard{padding:18px}')
  assert.equal(result.scopedDeclarationsRemoved, 1)
})

test('does not let a later lower-scope selector replace a more specific Mission Control declaration', () => {
  const source = '.mcShellV3 .mcCard{padding:12px}.mcCard{padding:18px}'
  const result = pruneOverriddenCoachDeclarations(source, scopedOptions)
  assert.equal(result.css, source)
  assert.equal(result.scopedDeclarationsRemoved, 0)
})

test('does not cross media contexts when pruning Mission Control scopes', () => {
  const source = '.mcCard{padding:12px}@media(max-width:600px){.mcShellV3 .mcCard{padding:8px}}'
  const result = pruneOverriddenCoachDeclarations(source, scopedOptions)
  assert.equal(result.css, source)
  assert.equal(result.scopedDeclarationsRemoved, 0)
})

test('skips grouped Mission Control selectors for scoped pruning', () => {
  const source = '.mcCard,.mcActivationPlan{padding:12px}.mcShellV3 .mcCard,.mcShellV3 .mcActivationPlan{padding:18px}'
  const result = pruneOverriddenCoachDeclarations(source, scopedOptions)
  assert.equal(result.css, source)
  assert.equal(result.scopedDeclarationsRemoved, 0)
})

test('skips scoped pruning when the Mission Control class is not proven exclusive to the command center', () => {
  const source = '.mcCard{padding:12px}.mcShellV3 .mcCard{padding:18px}'
  const result = pruneOverriddenCoachDeclarations(source, {
    allowMissionControlScope: true,
    exclusiveMissionControlClasses: new Set(['mcShellV3']),
  })
  assert.equal(result.css, source)
  assert.equal(result.scopedDeclarationsRemoved, 0)
})

test('preserves an important unscoped Mission Control declaration against a later normal scoped declaration', () => {
  const source = '.mcCard{color:red!important}.mcShellV3 .mcCard{color:blue}'
  const result = pruneOverriddenCoachDeclarations(source, scopedOptions)
  assert.equal(result.css, source)
  assert.equal(result.scopedDeclarationsRemoved, 0)
})
