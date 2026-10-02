import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { isSameHomeShotLogEntry } from '../src/lib/homeShotLogging.js'

test('home-shot reconciliation preserves repeated same-count submissions with distinct IDs', () => {
  const base = {
    email: 'demo@shotlab.app',
    teamId: 'team-demo-titans',
    date: '2026-10-02',
    made: 25,
    syncState: 'local_pending',
    syncSource: 'local',
  }

  const first = { ...base, id: 'shotlog-first', ts: 1000 }
  const second = { ...base, id: 'shotlog-second', ts: 2000 }
  const savedFirst = { ...base, id: 'shotlog-first', ts: 1001, syncState: 'remote_saved', syncSource: 'remote' }

  assert.equal(isSameHomeShotLogEntry(first, second), false)
  assert.equal(isSameHomeShotLogEntry(first, savedFirst), true)
  assert.equal(first.made + second.made, 50)
})

test('legacy ID-less reconciliation requires the same timestamp as well as matching content', () => {
  const base = {
    email: 'player@team.com',
    team_id: 'team-a',
    date: '2026-10-02',
    made: 25,
  }

  assert.equal(isSameHomeShotLogEntry({ ...base, ts: 1234 }, { ...base, ts: 1234 }), true)
  assert.equal(isSameHomeShotLogEntry({ ...base, ts: 1234 }, { ...base, ts: 1235 }), false)
  assert.equal(isSameHomeShotLogEntry(base, base), false)
})

test('route enhancer applies stable home-shot identity in dev and production builds', async () => {
  const orchestrator = await readFile(new URL('../scripts/run-route-enhancers.mjs', import.meta.url), 'utf8')
  const enhancer = await readFile(new URL('../scripts/apply-home-shot-entry-identity.mjs', import.meta.url), 'utf8')

  assert.match(orchestrator, /scripts\/apply-home-shot-entry-identity\.mjs/)
  assert.match(enhancer, /isSameHomeShotLogEntry/)
  assert.match(enhancer, /const isSameHomeShotEntry=isSameHomeShotLogEntry;/)
})
