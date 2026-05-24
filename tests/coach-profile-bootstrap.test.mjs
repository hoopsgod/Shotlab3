import test from 'node:test'
import assert from 'node:assert/strict'

import { bootstrapCoachProfile } from '../src/lib/coachProfileBootstrap.js'

test('missing supabase config keeps demo-safe bootstrap no-op', async () => {
  const result = await bootstrapCoachProfile({ supabaseClient: { isConfigured: false } })
  assert.equal(result.ok, false)
  assert.equal(result.skipped, 'config_missing')
})

test('active coach session can bootstrap profile without crash', async () => {
  let captured = null
  const supabaseClient = {
    isConfigured: true,
    profiles: {
      upsertCoach: async (row) => {
        captured = row
        return { data: [row], error: null }
      },
    },
  }

  const result = await bootstrapCoachProfile({
    supabaseClient,
    authUser: { id: 'u-1', email: 'Coach@Test.com' },
    displayName: 'Coach One',
  })

  assert.equal(result.ok, true)
  assert.equal(captured.auth_user_id, 'u-1')
  assert.equal(captured.email, 'coach@test.com')
  assert.equal(captured.role, 'coach')
})

test('bootstrap handles storage/unavailable errors safely', async () => {
  const supabaseClient = {
    isConfigured: true,
    profiles: {
      upsertCoach: async () => {
        throw new Error('network down')
      },
    },
  }

  const result = await bootstrapCoachProfile({
    supabaseClient,
    authUser: { id: 'u-2', email: 'coach2@test.com' },
  })

  assert.equal(result.ok, false)
  assert.equal(result.errorCode, 'profile_upsert_failed')
})
