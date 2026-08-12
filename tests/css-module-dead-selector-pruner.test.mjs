import assert from 'node:assert/strict'
import test from 'node:test'
import { collectBindingUsage, pruneUnusedCssModuleCss } from '../scripts/css-module-dead-selector-pruner.mjs'

test('collects dot and literal bracket CSS module usages without treating them as dynamic', () => {
  const source = `
    import styles from './Example.module.css'
    export function Example() {
      return <div className={styles.shell}><span className={styles['label']}>Hi</span></div>
    }
  `
  const importText = "import styles from './Example.module.css'"
  const start = source.indexOf(importText)
  const result = collectBindingUsage(source, 'styles', start, start + importText.length)
  assert.deepEqual([...result.used].sort(), ['label', 'shell'])
  assert.equal(result.dynamic, false)
})

test('marks a CSS module binding as dynamic when the whole styles object escapes', () => {
  const source = `
    import styles from './Example.module.css'
    export const mapping = styles
  `
  const importText = "import styles from './Example.module.css'"
  const start = source.indexOf(importText)
  const result = collectBindingUsage(source, 'styles', start, start + importText.length)
  assert.equal(result.dynamic, true)
})

test('removes only selector arms whose local classes are provably unused', () => {
  const css = `
    .shell { display: grid; }
    .shell .label, .unused { color: white; }
    .unused:hover { color: red; }
    :global(body) .unused { margin: 0; }
    @media (max-width: 600px) { .shell { gap: 8px; } .unused { gap: 4px; } }
  `
  const result = pruneUnusedCssModuleCss(css, new Set(['shell', 'label']))
  assert.match(result.css, /\.shell\s*\{\s*display:\s*grid;/)
  assert.match(result.css, /\.shell \.label\{\s*color:\s*white;/)
  assert.doesNotMatch(result.css, /\.unused:hover/)
  assert.match(result.css, /:global\(body\) \.unused/)
  assert.match(result.css, /@media \(max-width: 600px\)/)
  assert.match(result.css, /\.shell\s*\{\s*gap:\s*8px;/)
  assert.doesNotMatch(result.css, /\.unused\s*\{\s*gap:\s*4px;/)
  assert.ok(result.removedArms >= 3)
})

test('skips modules using CSS Modules composition syntax', () => {
  const css = `.base { color: white; } .button { composes: base; background: black; }`
  const result = pruneUnusedCssModuleCss(css, new Set(['button']))
  assert.equal(result.css, css)
  assert.equal(result.skipped, 'composition-or-explicit-local')
})
