import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { BACKEND_HEALTH, checkBackendHealth, getBackendHealthSnapshot } from '../src/lib/backendHealth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

test('backend health snapshot reports demo mode when Supabase env vars are absent', () => {
  const snapshot = getBackendHealthSnapshot()
  assert.equal(snapshot.status, BACKEND_HEALTH.DEMO_MODE_ACTIVE)
  assert.equal(snapshot.ok, true)
  assert.equal(snapshot.detail, 'missing_supabase_env')
})

test('backend health check resolves demo mode safely without throwing', async () => {
  const result = await checkBackendHealth()
  assert.equal(result.status, BACKEND_HEALTH.DEMO_MODE_ACTIVE)
  assert.equal(result.ok, true)
  assert.match(String(result.message || ''), /demo mode fallback/i)
})

test('startup boot path remains demo-safe and non-blocking', () => {
  const mainSource = fs.readFileSync(path.join(repoRoot, 'src/main.jsx'), 'utf8')
  assert.match(mainSource, /demoBootstrap\(\)/)
  assert.match(mainSource, /checkBackendHealth\(\)\.then\(/)
  assert.match(mainSource, /ReactDOM\.createRoot\(rootEl\)\.render/)
  assert.doesNotMatch(mainSource, /throw\s+new\s+Error\([^)]*supabase/i)
})

test('player and coach dashboard surfaces remain mounted from App shell', () => {
  const appSource = fs.readFileSync(path.join(repoRoot, 'src/App.jsx'), 'utf8')
  assert.match(appSource, /import PlayersScreen from "\.\/screens\/PlayersScreen";/)
  assert.match(appSource, /import CoachCommandCenter from "\.\/components\/CoachCommandCenter";/)
})

test('no user-facing raw Supabase startup error string is introduced in app shell', () => {
  const appSource = fs.readFileSync(path.join(repoRoot, 'src/App.jsx'), 'utf8').toLowerCase()
  assert.doesNotMatch(appSource, /supabase returned an invalid/)
  assert.doesNotMatch(appSource, /set vite_supabase_url and vite_supabase_anon_key/i)
})
