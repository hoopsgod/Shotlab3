import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { setDemoMode } from '../src/lib/demoMode.js'
import {
  clearStaleDemoSession,
  isDemoRuntimeEnabled,
  restoreSameTabDemoSession,
} from '../src/lib/runtimeReleaseReadiness.js'

const createStorage = () => {
  const values = new Map()
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
  }
}

const createRuntimeStorage = (localStorage) => ({
  async get(key) { return { value: localStorage.getItem(key) } },
  async set(key, value) { localStorage.setItem(key, value); return { value } },
})

test('same-tab demo marker survives the transient handoff and restores the app session', async () => {
  const localStorage = createStorage()
  const sessionStorage = createStorage()
  const storage = createRuntimeStorage(localStorage)
  sessionStorage.setItem('sl:demoSession', JSON.stringify({ email: 'coach.demo@shotlab.app' }))

  assert.equal(isDemoRuntimeEnabled({
    env: { DEV: false },
    location: { hostname: 'shotlab.test', search: '' },
    sessionStorage,
  }), true)

  assert.equal(await restoreSameTabDemoSession({ localStorage, sessionStorage, storage }), true)
  assert.deepEqual(JSON.parse(localStorage.getItem('sl:session')), { email: 'coach.demo@shotlab.app' })
})

test('fresh tab cannot inherit a shared local demo identity', async () => {
  const localStorage = createStorage()
  const sessionStorage = createStorage()
  const storage = createRuntimeStorage(localStorage)
  localStorage.setItem('sl:session', JSON.stringify({ email: 'coach.demo@shotlab.app' }))

  assert.equal(isDemoRuntimeEnabled({
    env: { DEV: false },
    location: { hostname: 'shotlab.test', search: '' },
    sessionStorage,
  }), false)

  assert.equal(await clearStaleDemoSession({
    env: { DEV: false },
    location: { hostname: 'shotlab.test', search: '' },
    localStorage,
    sessionStorage,
    storage,
  }), true)
  assert.equal(localStorage.getItem('sl:session'), 'null')
})

test('registered session is not cleared by production demo cleanup', async () => {
  const localStorage = createStorage()
  const sessionStorage = createStorage()
  const storage = createRuntimeStorage(localStorage)
  localStorage.setItem('sl:session', JSON.stringify({ email: 'registered@shotlab.test' }))

  assert.equal(await clearStaleDemoSession({
    env: { DEV: false },
    location: { hostname: 'shotlab.test', search: '' },
    localStorage,
    sessionStorage,
    storage,
  }), false)
  assert.deepEqual(JSON.parse(localStorage.getItem('sl:session')), { email: 'registered@shotlab.test' })
})

test('demo logout clears the same-tab restoration marker and persisted demo session', () => {
  const previousWindow = globalThis.window
  const localStorage = createStorage()
  const sessionStorage = createStorage()
  localStorage.setItem('sl:session', JSON.stringify({ email: 'demo@shotlab.app' }))
  sessionStorage.setItem('sl:demoSession', JSON.stringify({ email: 'demo@shotlab.app' }))
  sessionStorage.setItem('sl:pendingDemoSession', JSON.stringify({ email: 'demo@shotlab.app', createdAt: Date.now() }))
  globalThis.window = {
    location: { href: 'https://shotlab.test/events', search: '' },
    localStorage,
    sessionStorage,
    history: { replaceState() {} },
  }

  try {
    setDemoMode(false)
    assert.equal(sessionStorage.getItem('sl:demoSession'), null)
    assert.equal(sessionStorage.getItem('sl:pendingDemoSession'), null)
    assert.equal(localStorage.getItem('sl:session'), null)
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})

test('startup installs the active-demo bridge and restores before importing App', () => {
  const source = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8')
  const bridge = source.indexOf("shotlab:demo-session-started")
  const marker = source.indexOf("sl:demoSession", bridge)
  const restore = source.indexOf('await restoreSameTabDemoSession()')
  const appImport = source.indexOf("await import('./App.jsx')")

  assert.ok(bridge >= 0)
  assert.ok(marker > bridge)
  assert.ok(restore >= 0)
  assert.ok(appImport > restore)
})

test('Coach editorial title stages own a production-safe compact crest token', () => {
  const source = fs.readFileSync(new URL('../src/components/TeamIdentityTitleStage.jsx', import.meta.url), 'utf8')
  assert.match(source, /isCoachStage && titleFamily === "editorial"/)
  assert.match(source, /"--identity-crest": "clamp\(64px, 17vw, 74px\)"/)
  assert.match(source, /style=\{coachEditorialCrestStyle\}/)
})
