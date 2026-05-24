import test from 'node:test'
import assert from 'node:assert/strict'

const loadModule = async (env = {}) => {
  const prev = { url: process.env.VITE_SUPABASE_URL, key: process.env.VITE_SUPABASE_ANON_KEY }
  if (env.url == null) delete process.env.VITE_SUPABASE_URL
  else process.env.VITE_SUPABASE_URL = env.url
  if (env.key == null) delete process.env.VITE_SUPABASE_ANON_KEY
  else process.env.VITE_SUPABASE_ANON_KEY = env.key
  const mod = await import(`../src/lib/playerJoinCodeService.js?ts=${Date.now()}-${Math.random()}`)
  if (prev.url == null) delete process.env.VITE_SUPABASE_URL
  else process.env.VITE_SUPABASE_URL = prev.url
  if (prev.key == null) delete process.env.VITE_SUPABASE_ANON_KEY
  else process.env.VITE_SUPABASE_ANON_KEY = prev.key
  return mod
}

const makeSupabaseStub = ({ teams = [], members = [], throwOn = '' } = {}) => ({
  isConfigured: true,
  from(table) {
    return {
      async select() {
        if (throwOn === `select:${table}` || throwOn === 'select') throw new Error('offline')
        return { data: table === 'teams' ? teams : members, error: null }
      },
      async upsert(row) {
        if (throwOn === `upsert:${table}` || throwOn === 'upsert') throw new Error('offline')
        return { data: [row], error: null }
      },
    }
  },
})

test('missing Supabase env vars = demo mode safe', async () => {
  const { createPlayerJoinCodeService } = await loadModule({ url: null, key: null })
  const service = createPlayerJoinCodeService({ supabaseClient: null })
  const res = await service.loadPlayerMembership({ playerUser: null })
  assert.equal(res.ok, true)
  assert.equal(res.mode, 'demo')
})

test('invalid join code = safe user-facing failure', async () => {
  const { createPlayerJoinCodeService } = await loadModule({ url: 'https://example.supabase.co', key: 'anon' })
  const service = createPlayerJoinCodeService({ supabaseClient: makeSupabaseStub({ teams: [] }) })
  const res = await service.validateJoinCode({ joinCode: 'NOPE00' })
  assert.equal(res.ok, false)
  assert.equal(res.error.code, 'invalid_join_code')
  assert.match(res.error.message, /invalid/i)
})

test('valid join code can resolve a team', async () => {
  const { createPlayerJoinCodeService } = await loadModule({ url: 'https://example.supabase.co', key: 'anon' })
  const service = createPlayerJoinCodeService({ supabaseClient: makeSupabaseStub({ teams: [{ id: 't_1', joinCode: 'ABC123', name: 'Titans' }] }) })
  const res = await service.findTeamByJoinCode({ joinCode: 'abc123' })
  assert.equal(res.ok, true)
  assert.equal(res.data.id, 't_1')
})

test('player membership creation is safe', async () => {
  const { createPlayerJoinCodeService } = await loadModule({ url: 'https://example.supabase.co', key: 'anon' })
  const service = createPlayerJoinCodeService({ supabaseClient: makeSupabaseStub() })
  const res = await service.createTeamMembership({ teamId: 't_1', playerUser: { id: 'u_1' } })
  assert.equal(res.ok, true)
  assert.equal(res.data.team_id, 't_1')
  assert.equal(res.data.user_id, 'u_1')
})

test('Supabase unavailable = safe fallback', async () => {
  const { createPlayerJoinCodeService } = await loadModule({ url: 'https://example.supabase.co', key: 'anon' })
  const service = createPlayerJoinCodeService({ supabaseClient: makeSupabaseStub({ throwOn: 'select:teams' }) })
  const res = await service.findTeamByJoinCode({ joinCode: 'ABC123' })
  assert.equal(res.ok, true)
  assert.equal(res.mode, 'demo')
})

test('app startup does not depend on membership data', async () => {
  const { createPlayerJoinCodeService } = await loadModule({ url: 'https://example.supabase.co', key: 'anon' })
  const service = createPlayerJoinCodeService({ supabaseClient: makeSupabaseStub({ throwOn: 'select:team_members' }) })
  const res = await service.loadPlayerMembership({ playerUser: { id: 'u_1' } })
  assert.equal(res.ok, true)
  assert.equal(res.mode, 'demo')
  assert.equal(res.data, null)
})
