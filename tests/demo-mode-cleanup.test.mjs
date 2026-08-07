import test from 'node:test'
import assert from 'node:assert/strict'

import { isDemoAccount, isDemoPlayerSessionShotLog, setDemoMode } from '../src/lib/demoMode.js'

const createStorage = () => {
  const values = new Map()
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
  }
}

const installDemoButtonEnvironment = (label) => {
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const localStorage = createStorage()
  const sessionStorage = createStorage()

  globalThis.window = {
    location: { search: '', href: 'https://shotlab.test/' },
    localStorage,
    sessionStorage,
    history: { replaceState() {} },
  }
  globalThis.document = {
    activeElement: {
      textContent: label,
      getAttribute() { return null },
    },
  }

  return {
    sessionStorage,
    restore() {
      if (previousWindow === undefined) delete globalThis.window
      else globalThis.window = previousWindow
      if (previousDocument === undefined) delete globalThis.document
      else globalThis.document = previousDocument
    },
  }
}

test('demo shot cleanup identifies only local Demo Player session rows', () => {
  const demoSessionShot = { id: 'demo-123', email: 'demo@shotlab.app', teamId: 'demo-team', made: 123, demo: true, syncState: 'local_pending', syncSource: 'local' }
  const registeredShot = { id: 'registered', email: 'player@team.com', teamId: 'team-a', made: 77, syncState: 'remote_saved', syncSource: 'remote' }
  const demoSeedShot = { id: 'seed', email: 'demo@shotlab.app', teamId: 'demo-team', made: 125 }
  const otherTeamDemoShot = { id: 'other-team', email: 'demo@shotlab.app', teamId: 'other-demo-team', made: 50, demo: true, syncState: 'local_pending', syncSource: 'local' }

  assert.equal(isDemoAccount('demo@shotlab.app'), true)
  assert.equal(isDemoPlayerSessionShotLog(demoSessionShot, { teamId: 'demo-team' }), true)
  assert.equal(isDemoPlayerSessionShotLog(registeredShot, { teamId: 'demo-team' }), false)
  assert.equal(isDemoPlayerSessionShotLog(demoSeedShot, { teamId: 'demo-team' }), false)
  assert.equal(isDemoPlayerSessionShotLog(otherTeamDemoShot, { teamId: 'demo-team' }), false)

  const afterLogout = [registeredShot, demoSessionShot, demoSeedShot, otherTeamDemoShot].filter((row) => !isDemoPlayerSessionShotLog(row, { teamId: 'demo-team' }))
  assert.deepEqual(afterLogout, [registeredShot, demoSeedShot, otherTeamDemoShot])
})

test('current Phase 2 demo button labels seed the pending identity bridge', () => {
  for (const [label, expectedEmail] of [
    ['Coach demo', 'coach.demo@shotlab.app'],
    ['Player demo', 'demo@shotlab.app'],
  ]) {
    const environment = installDemoButtonEnvironment(label)
    try {
      setDemoMode(true)
      const pending = JSON.parse(environment.sessionStorage.getItem('sl:pendingDemoSession') || 'null')
      assert.equal(pending?.email, expectedEmail)
      assert.equal(Number.isFinite(Number(pending?.createdAt)), true)
    } finally {
      environment.restore()
    }
  }
})
