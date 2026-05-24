import test from 'node:test'
import assert from 'node:assert/strict'

const loadModule = async (env = {}) => {
  const prev = {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_ANON_KEY,
  }
  if (env.url == null) delete process.env.VITE_SUPABASE_URL
  else process.env.VITE_SUPABASE_URL = env.url
  if (env.key == null) delete process.env.VITE_SUPABASE_ANON_KEY
  else process.env.VITE_SUPABASE_ANON_KEY = env.key
  const mod = await import(`../src/lib/teamService.js?ts=${Date.now()}-${Math.random()}`)
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

test('missing Supabase env vars keeps demo mode safe', async () => {
  const { createTeamService } = await loadModule({ url: null, key: null })
  const service = createTeamService({ supabaseClient: null })
  const result = await service.loadCoachTeams({ coachUser: { email: 'coach@x.com' } })
  assert.equal(result.ok, true)
  assert.equal(result.mode, 'demo')
  assert.deepEqual(result.data, [])
})

test('no coach session does not crash', async () => {
  const { createTeamService } = await loadModule()
  const service = createTeamService({ supabaseClient: null })
  const result = await service.createTeam({ coachUser: null, name: 'No Coach' })
  assert.equal(result.ok, true)
  assert.equal(result.reason, 'no_coach_session')
})

test('authenticated coach can create and load team via service', async () => {
  const { createTeamService } = await loadModule({ url: 'https://example.supabase.co', key: 'anon' })
  const coach = { id: 'coach_1', email: 'coach@x.com' }
  const selectData = [
    { id: 't1', ownerCoachId: 'coach@x.com', name: 'Team One', joinCode: 'ABC123' },
    { id: 't2', ownerCoachId: 'someone@x.com', name: 'Other', joinCode: 'ZZZ999' },
  ]
  const service = createTeamService({ supabaseClient: makeSupabaseStub({ selectData }) })
  const created = await service.createTeam({ coachUser: coach, name: 'My Team' })
  assert.equal(created.ok, true)
  assert.equal(created.mode, 'supabase')
  const loaded = await service.loadCoachTeams({ coachUser: coach })
  assert.equal(loaded.ok, true)
  assert.equal(loaded.data.length, 1)
  assert.equal(loaded.data[0].id, 't1')
})

test('join code generation is safe', async () => {
  const { createTeamService } = await loadModule({ url: 'https://example.supabase.co', key: 'anon' })
  const service = createTeamService({ supabaseClient: makeSupabaseStub() })
  const result = await service.generateJoinCode({ teamId: 'team_1', existingCodes: ['AAAAAA'] })
  assert.equal(result.ok, true)
  assert.match(result.data.joinCode, /^[A-Z2-9]{6}$/)
})

test('Supabase unavailable returns safe fallback', async () => {
  const { createTeamService } = await loadModule({ url: 'https://example.supabase.co', key: 'anon' })
  const service = createTeamService({ supabaseClient: makeSupabaseStub({ throwOn: 'select' }) })
  const result = await service.readActiveJoinCode({ teamId: 'team_1' })
  assert.equal(result.ok, true)
  assert.equal(result.mode, 'demo')
})

test('team service does not require startup team data', async () => {
  const { createTeamService } = await loadModule()
  const service = createTeamService({})
  const result = await service.readActiveJoinCode({ teamId: null })
  assert.equal(result.ok, true)
  assert.equal(result.data, null)
})
