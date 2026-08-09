import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(path, 'utf8')

test('Phase 5A.1 keeps the production JavaScript ceiling unchanged', async () => {
  const budget = JSON.parse(await read('performance-budget.json'))
  assert.equal(budget.maxTotalJavaScriptGzipBytes, 365000)
})

test('Phase 5A.1 records source weight without changing product behavior', async () => {
  const script = await read('scripts/report-phase5a1-source-weight.mjs')
  assert.match(script, /bundle-ownership\.json/)
  assert.match(script, /source-weight\.json/)
  assert.doesNotMatch(script, /performance-budget\.json/)
})

test('Phase 5A.1 externalizes the exact embedded ShotLab PNG instead of re-encoding it', async () => {
  const script = await read('scripts/externalize-shotlab-brand-logo.mjs')
  const phase5a = await read('scripts/apply-phase5a-coach-daily-intelligence.mjs')

  assert.match(script, /Buffer\.from\(match\[1\], 'base64'\)/)
  assert.match(script, /public\/shotlab-brand-logo\.png/)
  assert.match(script, /\.\/shotlab-brand-logo\.png/)
  assert.doesNotMatch(script, /sharp|resvg|compression|quality/i)
  assert.match(phase5a, /externalize-shotlab-brand-logo\.mjs/)
})

test('Phase 5A.1 keeps Program first-use states inside the shared mobile gutter token', async () => {
  const css = await read('public/shotlab-phase4e-final-polish.css')
  assert.match(css, /--phase4e-mobile-gutter:\s*clamp\(16px,\s*4\.65vw,\s*20px\)/)
  assert.match(css, /width:\s*calc\(100% - \(2 \* var\(--phase4e-mobile-gutter\)\)\)\s*!important/)
  assert.match(css, /max-width:\s*calc\(100% - \(2 \* var\(--phase4e-mobile-gutter\)\)\)\s*!important/)
  assert.doesNotMatch(css, /player-workspace-empty-state[^}]*(100vw|100% - 18px)/s)
})