import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MVP_SCHEMA_TABLES,
  SUPABASE_SCHEMA_STATUS,
  verifySupabaseSchema,
} from '../src/lib/supabaseSchemaVerification.js'

test('expected MVP schema table list is defined', () => {
  assert.deepEqual(MVP_SCHEMA_TABLES, [
    'users',
    'teams',
    'team_members',
    'join_codes',
    'drills',
    'coach_priorities',
    'shot_logs',
    'sessions',
    'leaderboard_entries',
  ])
})

test('missing env vars returns demo-safe status', async () => {
  const status = await verifySupabaseSchema({ supabaseClient: { isConfigured: false } })
  assert.equal(status.status, SUPABASE_SCHEMA_STATUS.DEMO_SAFE)
  assert.equal(status.ok, true)
  assert.equal(status.detail, 'missing_supabase_env')
})

test('Supabase unavailable returns safe unavailable status', async () => {
  const status = await verifySupabaseSchema({
    supabaseClient: {
      isConfigured: true,
      from() {
        return { select: async () => ({ data: null, error: { code: 'service_down' } }) }
      },
    },
  })
  assert.equal(status.status, SUPABASE_SCHEMA_STATUS.UNAVAILABLE)
  assert.equal(status.ok, false)
  assert.equal(status.missingTables.length, MVP_SCHEMA_TABLES.length)
})

test('schema verification should not throw during startup path', async () => {
  await assert.doesNotReject(async () => {
    await verifySupabaseSchema({
      supabaseClient: {
        isConfigured: true,
        from() {
          return { select: async () => { throw new Error('network down') } }
        },
      },
    })
  })
})
