import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import {
  RUNTIME_CSS_ENTRIES,
  RUNTIME_CSS_MANIFEST,
  RUNTIME_CSS_OUTPUT,
  buildRuntimeCss,
} from '../scripts/build-runtime-css.mjs'

const rootDir = process.cwd()
const publicDir = path.join(rootDir, 'public')

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

test('runtime CSS consolidates the release cascade into one deterministic authority', async () => {
  const manifest = await buildRuntimeCss()
  const runtimeCss = await readFile(path.join(publicDir, RUNTIME_CSS_OUTPUT), 'utf8')
  const persistedManifest = JSON.parse(await readFile(path.join(publicDir, RUNTIME_CSS_MANIFEST), 'utf8'))
  const indexHtml = await readFile(path.join(rootDir, 'index.html'), 'utf8')

  assert.deepEqual(manifest.entries, RUNTIME_CSS_ENTRIES)
  assert.deepEqual(persistedManifest, manifest)
  assert.match(manifest.digest, /^[a-f0-9]{16}$/)
  assert.equal(new Set(manifest.sources).size, manifest.sources.length)
  assert.ok(manifest.sources.length >= RUNTIME_CSS_ENTRIES.length)

  let previousIndex = -1
  for (const entry of RUNTIME_CSS_ENTRIES) {
    const marker = `/* ===== RUNTIME ENTRY: ${entry} ===== */`
    const markerIndex = runtimeCss.indexOf(marker)
    assert.ok(markerIndex > previousIndex, `${entry} must preserve its release order`)
    previousIndex = markerIndex
  }

  assert.doesNotMatch(runtimeCss, /@import\s+(?:url\()?['"]?\/?shotlab-[^;]+\.css/i)
  assert.match(indexHtml, /id="shotlab-runtime-authority"[^>]+href="\/shotlab-runtime\.css"/)

  for (const legacyId of [
    'shotlab-v3-authority',
    'shotlab-v3-mobile-corrections',
    'shotlab-v4-reference',
    'shotlab-v5-coach-integrity',
    'shotlab-v6-decision-workspaces',
    'shotlab-v7-page-authority',
    'shotlab-v8-demo-parity',
    'shotlab-v9-secondary-polish',
    'shotlab-v11-decision-first',
    'shotlab-v12-auth-demo-entry',
    'shotlab-v13-visual-hierarchy',
    'shotlab-v15-session-integrity',
  ]) {
    assert.doesNotMatch(indexHtml, new RegExp(`id="${escapeRegExp(legacyId)}"`))
  }
})
