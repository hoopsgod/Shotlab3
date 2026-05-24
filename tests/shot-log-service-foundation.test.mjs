import test from 'node:test'
import assert from 'node:assert/strict'

const loadModule = async (env = {}) => {
  const prev = { url: process.env.VITE_SUPABASE_URL, key: process.env.VITE_SUPABASE_ANON_KEY }
  if (env.url == null) delete process.env.VITE_SUPABASE_URL
  else process.env.VITE_SUPABASE_URL = env.url
  if (env.key == null) delete process.env.VITE_SUPABASE_ANON_KEY
  else process.env.VITE_SUPABASE_ANON_KEY = env.key
  const mod = await import(`../src/lib/shotLogService.js?ts=${Date.now()}-${Math.random()}`)
  if (prev.url == null) delete process.env.VITE_SUPABASE_URL
  else process.env.VITE_SUPABASE_URL = prev.url
  if (prev.key == null) delete process.env.VITE_SUPABASE_ANON_KEY
  else process.env.VITE_SUPABASE_ANON_KEY = prev.key
  return mod
}

const makeSupabaseStub = ({ selectData = [], upsertData = null, throwOn = '' } = {}) => ({
  isConfigured: true,
  from() {
    return {
      async select() {
        if (throwOn === 'select') throw new Error('offline')
        return { data: selectData, error: null }
      },
      async upsert(row) {
        if (throwOn === 'upsert') throw new Error('offline')
        return { data: upsertData || [row], error: null }
      },
    }
  },
})

test('missing Supabase env vars = demo/local mode safe', async () => {
  const { createShotLogService } = await loadModule({ url: null, key: null })
  const service = createShotLogService({ supabaseClient: null })
  const result = await service.loadTeamShotLogs({ teamId: 'team-1' })
  assert.equal(result.ok, true)
  assert.equal(result.mode, 'demo')
  assert.deepEqual(result.data, [])
})

test('missing player/team context = no crash', async () => {
  const { createShotLogService } = await loadModule()
  const service = createShotLogService({ supabaseClient: null })
  const created = await service.createShotLog({ shotLog: { made: 20 }, player: null, team: null })
  assert.equal(created.ok, true)
  assert.equal(created.reason, 'missing_player_or_team_context')
})

test('valid player/team context can create shot log', async () => {
  const { createShotLogService } = await loadModule({ url: 'https://example.supabase.co', key: 'anon' })
  const service = createShotLogService({ supabaseClient: makeSupabaseStub() })
  const created = await service.createShotLog({
    shotLog: { made: 15, attempted_shots: 30, drill_id: 'd1' },
    player: { id: 'player-1', email: 'p1@test.com', name: 'P1' },
    team: { id: 'team-1' },
  })
  assert.equal(created.ok, true)
  assert.equal(created.mode, 'supabase')
  assert.equal(created.data.player_id, 'player-1')
})

test('backend unavailable = safe fallback', async () => {
  const { createShotLogService } = await loadModule({ url: 'https://example.supabase.co', key: 'anon' })
  const service = createShotLogService({ supabaseClient: makeSupabaseStub({ throwOn: 'upsert' }) })
  const created = await service.createShotLog({ shotLog: { made: 10 }, player: { id: 'p1' }, team: { id: 'team-1' } })
  assert.equal(created.ok, true)
  assert.equal(created.mode, 'demo')
})

test('shot summary handles empty logs', async () => {
  const { createShotLogService } = await loadModule({ url: 'https://example.supabase.co', key: 'anon' })
  const service = createShotLogService({ supabaseClient: makeSupabaseStub({ selectData: [] }) })
  const summary = await service.summarizePlayerShotTotals({ playerId: 'p1', teamId: 'team-1' })
  assert.deepEqual(summary.data, { made: 0, attempted: 0, count: 0 })
})

test('app startup does not depend on shot logs', async () => {
  const { createShotLogService } = await loadModule()
  const service = createShotLogService({})
  const summary = await service.summarizeTeamShotTotals({ teamId: null })
  assert.equal(summary.ok, true)
  assert.deepEqual(summary.data, { made: 0, attempted: 0, count: 0 })
})
