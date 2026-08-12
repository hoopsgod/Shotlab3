import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { isDemoAccount, isDemoPersistenceSession, isDemoPlayerSessionShotLog, setDemoMode } from '../src/lib/demoMode.js'

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

test('Phase 1 recognizes only explicit, pending, or durable demo persistence sessions', () => {
  const now = 1_786_500_000_000
  const localStorage = createStorage()
  const sessionStorage = createStorage()

  assert.equal(isDemoPersistenceSession({ localStorage, sessionStorage, location: { search: '' }, now }), false)

  sessionStorage.setItem('sl:pendingDemoSession', JSON.stringify({
    email: 'demo@shotlab.app',
    createdAt: now - 1_000,
  }))
  assert.equal(isDemoPersistenceSession({ localStorage, sessionStorage, location: { search: '' }, now }), true)

  sessionStorage.setItem('sl:pendingDemoSession', JSON.stringify({
    email: 'demo@shotlab.app',
    createdAt: now - 31_000,
  }))
  assert.equal(isDemoPersistenceSession({ localStorage, sessionStorage, location: { search: '' }, now }), false)

  localStorage.setItem('sl:session', JSON.stringify({ email: 'coach.demo@shotlab.app' }))
  assert.equal(isDemoPersistenceSession({ localStorage, sessionStorage, location: { search: '' }, now }), true)

  localStorage.setItem('sl:session', JSON.stringify({ email: 'registered@shotlab.app' }))
  assert.equal(isDemoPersistenceSession({ localStorage, sessionStorage, location: { search: '' }, now }), false)
  assert.equal(isDemoPersistenceSession({ localStorage, sessionStorage, location: { search: '?demo=1' }, now }), true)
})

test('demo sign-in establishes local-only persistence before seeding collections', () => {
  const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const start = appSource.indexOf('const demoSignIn=')
  const end = appSource.indexOf('const cleanupDemoPlayerSessionData=', start)
  const demoSignInSource = appSource.slice(start, end)
  const sessionMarker = demoSignInSource.indexOf('await DB.set("sl:session",{email:acct.email})')
  const firstSeedWrite = demoSignInSource.indexOf('await savePlayers()')

  assert.ok(start >= 0 && end > start)
  assert.ok(sessionMarker >= 0)
  assert.ok(firstSeedWrite > sessionMarker)
  assert.equal((demoSignInSource.match(/DB\.set\("sl:session"/g) || []).length, 1)
  assert.match(demoSignInSource, /shotlab:demo-session-started/)
})

test('Phase 1 keeps demo database writes local and demo leaderboards deterministic', () => {
  const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const databaseSetStart = appSource.indexOf('async set(k, v, options = {})')
  const databaseSetEnd = appSource.indexOf('\n};\n\nconst persistenceService', databaseSetStart)
  const databaseSetSource = appSource.slice(databaseSetStart, databaseSetEnd)
  const demoGuard = databaseSetSource.indexOf('isDemoPersistenceSession()')
  const remoteTableLookup = databaseSetSource.indexOf('const table = TABLE_MAP[k]')

  assert.ok(databaseSetStart >= 0 && databaseSetEnd > databaseSetStart)
  assert.ok(demoGuard >= 0 && demoGuard < remoteTableLookup)

  const leaderboardStart = appSource.indexOf('const fetchHomeShotsLeaderboard=')
  const leaderboardEnd = appSource.indexOf('\n\nconst migrateData=', leaderboardStart)
  const leaderboardSource = appSource.slice(leaderboardStart, leaderboardEnd)
  const demoFallback = leaderboardSource.indexOf('isDemoAccount(user)||isDemoMode()')
  const remoteFetch = leaderboardSource.indexOf('await fetch(url')

  assert.ok(leaderboardStart >= 0 && leaderboardEnd > leaderboardStart)
  assert.ok(demoFallback >= 0 && demoFallback < remoteFetch)
  assert.match(leaderboardSource, /errorCode:"demo_local"/)
})
