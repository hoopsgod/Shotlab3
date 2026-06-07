import test from 'node:test'
import assert from 'node:assert/strict'

import { isDemoAccount, isDemoPlayerSessionShotLog } from '../src/lib/demoMode.js'

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
