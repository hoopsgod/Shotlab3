import assert from 'node:assert/strict'
import test from 'node:test'
import {
  collectKeyframeDefinitions,
  findUnreferencedKeyframeNames,
  pruneUnreferencedKeyframes,
} from '../scripts/prune-unreferenced-keyframes.mjs'

test('collects standard and webkit keyframe blocks with nested braces', () => {
  const css = '@keyframes pulse{0%{opacity:0}100%{opacity:1}}@-webkit-keyframes spin{to{transform:rotate(1turn)}}'
  const definitions = collectKeyframeDefinitions(css)
  assert.deepEqual(definitions.map(({ name }) => name), ['pulse', 'spin'])
  assert.equal(css.slice(definitions[0].start, definitions[0].end), '@keyframes pulse{0%{opacity:0}100%{opacity:1}}')
})

test('treats a keyframe used by animation shorthand as referenced', () => {
  const css = '@keyframes pulse{to{opacity:1}}.card{animation:pulse 1s ease}'
  const result = findUnreferencedKeyframeNames(css)
  assert.deepEqual([...result.unreferencedNames], [])
})

test('treats a keyframe referenced from another built asset as live', () => {
  const css = '@keyframes pulse{to{opacity:1}}'
  const result = findUnreferencedKeyframeNames(css, 'const animationName = "pulse";')
  assert.deepEqual([...result.unreferencedNames], [])
})

test('removes only keyframes with no reference outside definitions', () => {
  const css = '@keyframes dead{to{opacity:1}}@keyframes live{to{opacity:1}}.card{animation-name:live}'
  const result = pruneUnreferencedKeyframes(css)
  assert.deepEqual(result.removedNames, ['dead'])
  assert.equal(result.removedBlocks, 1)
  assert.equal(result.css, '@keyframes live{to{opacity:1}}.card{animation-name:live}')
})

test('removes standard and prefixed definitions together only when the shared name is unused', () => {
  const css = '@-webkit-keyframes dead{to{opacity:1}}@keyframes dead{to{opacity:1}}.card{color:red}'
  const result = pruneUnreferencedKeyframes(css)
  assert.deepEqual(result.removedNames, ['dead'])
  assert.equal(result.removedBlocks, 2)
  assert.equal(result.css, '.card{color:red}')
})

test('does not mistake a longer identifier for a keyframe reference', () => {
  const css = '@keyframes pulse{to{opacity:1}}.card{--pulse-fast:1}'
  const result = pruneUnreferencedKeyframes(css)
  assert.deepEqual(result.removedNames, ['pulse'])
})
