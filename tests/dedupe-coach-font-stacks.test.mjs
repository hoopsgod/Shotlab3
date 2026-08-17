import assert from 'node:assert/strict'
import test from 'node:test'
import { dedupeCoachFontStacks } from '../scripts/dedupe-coach-font-stacks.mjs'
import { dedupeAuthenticatedFontStacks } from '../scripts/dedupe-authenticated-font-stacks.mjs'

const SYSTEM = 'system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Noto Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif'
const TEXT = '-apple-system,BlinkMacSystemFont,SF Pro Text,Segoe UI,sans-serif'
const TEXT_QUOTED = '-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif'
const DISPLAY = '-apple-system,BlinkMacSystemFont,SF Pro Display,Segoe UI,sans-serif'

test('replaces repeated Coach font stacks with a single custom-property definition', () => {
  const source = `.a{font:700 14px ${SYSTEM}}.b{font-family:${SYSTEM}}`
  const result = dedupeCoachFontStacks(source)
  assert.equal(result.replacements, 2)
  assert.match(result.css, /^:root\{--sl5c-sys:/)
  assert.equal((result.css.match(/var\(--sl5c-sys\)/g) || []).length, 2)
  assert.ok(result.rawBytesSaved > 0)
})

test('normalizes quoted and unquoted SF Text stacks through one variable', () => {
  const source = `.a{font-family:${TEXT}}.b{font:600 13px ${TEXT_QUOTED}}`
  const result = dedupeCoachFontStacks(source)
  assert.equal(result.replacements, 2)
  assert.match(result.css, /--sl5c-text:/)
  assert.equal((result.css.match(/var\(--sl5c-text\)/g) || []).length, 2)
})

test('does not add a variable for a one-off stack', () => {
  const source = `.a{font-family:${SYSTEM}}`
  const result = dedupeCoachFontStacks(source)
  assert.equal(result.css, source)
  assert.equal(result.replacements, 0)
  assert.equal(result.rawBytesSaved, 0)
})

test('fails instead of overwriting an existing Phase 5C variable contract', () => {
  assert.throws(
    () => dedupeCoachFontStacks(':root{--sl5c-sys:serif}.a{font-family:serif}'),
    /font variable collision/,
  )
})

test('authenticated CSS reuses visual-authority font tokens without changing font families', () => {
  const source = `.a{font-family:${SYSTEM}}.b{font:600 13px ${TEXT_QUOTED}}.c{font-family:${DISPLAY}}`
  const result = dedupeAuthenticatedFontStacks(source)
  assert.equal(result.replacements, 3)
  assert.match(result.css, /font-family:var\(--sl-font-system\)/)
  assert.match(result.css, /font:600 13px var\(--sl-font-text\)/)
  assert.match(result.css, /font-family:var\(--sl-font-display\)/)
  assert.ok(result.rawBytesSaved > 0)
})

test('authenticated font dedupe leaves unrelated declarations untouched', () => {
  const source = '.a{font-family:Georgia,serif;color:#171a18}'
  const result = dedupeAuthenticatedFontStacks(source)
  assert.equal(result.css, source)
  assert.equal(result.replacements, 0)
  assert.equal(result.rawBytesSaved, 0)
})
