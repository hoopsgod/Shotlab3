import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const loadModule = async () => import(`../src/lib/playerIdentityMembershipHydration.js?ts=${Date.now()}-${Math.random()}`)

const makeSupabaseStub = ({ user = null, members = [], teams = [], throwOn = '' } = {}) => ({
  isConfigured: true,
  auth: {
    async getSession() {
      if (throwOn === 'session') throw new Error('offline')
      return { data: { session: user ? { user } : null }, error: null }
    },
  },
  from(table) {
    return {
      async select() {
        if (throwOn === `select:${table}` || throwOn === 'select') throw new Error('offline')
        if (table === 'team_members') return { data: members, error: null }
        if (table === 'teams') return { data: teams, error: null }
        return { data: [], error: null }
      },
    }
  },
})

test('missing Supabase env vars = demo mode safe', async () => {
  const { createPlayerIdentityMembershipHydrationService } = await loadModule()
  const service = createPlayerIdentityMembershipHydrationService({ supabaseClient: null })
  const res = await service.restoreMembershipContext()
  assert.equal(res.ok, true)
  assert.equal(res.mode, 'demo')
})

test('no membership = app does not crash', async () => {
  const { createPlayerIdentityMembershipHydrationService } = await loadModule()
  const service = createPlayerIdentityMembershipHydrationService({
    supabaseClient: makeSupabaseStub({ user: { id: 'u_1', email: 'p@x.com' }, members: [] }),
  })
  const res = await service.hydrate()
  assert.equal(res.ok, true)
  assert.equal(res.data.identity.player_id, 'u_1')
  assert.equal(res.data.membership, null)
})

test('existing membership can be loaded with team context', async () => {
  const { createPlayerIdentityMembershipHydrationService } = await loadModule()
  const service = createPlayerIdentityMembershipHydrationService({
    supabaseClient: makeSupabaseStub({
      user: { id: 'u_1', email: 'p@x.com' },
      members: [{ user_id: 'u_1', team_id: 't_1', role: 'player', status: 'active' }],
      teams: [{ id: 't_1', name: 'Titans' }],
    }),
  })
  const res = await service.hydrate()
  assert.equal(res.ok, true)
  assert.equal(res.data.membership.team_id, 't_1')
  assert.equal(res.data.membership.role, 'player')
  assert.equal(res.data.membership.status, 'active')
  assert.equal(res.data.membership.team_name, 'Titans')
})

test('stale/invalid membership fails safely', async () => {
  const { createPlayerIdentityMembershipHydrationService } = await loadModule()
  const service = createPlayerIdentityMembershipHydrationService({
    supabaseClient: makeSupabaseStub({
      user: { id: 'u_1' },
      members: [{ user_id: 'u_1', team_id: '', role: 'player', status: 'disabled' }],
    }),
  })
  const res = await service.hydrate()
  assert.equal(res.ok, true)
  assert.equal(res.data.membership, null)
})

test('startup does not depend on membership data', async () => {
  const { createPlayerIdentityMembershipHydrationService } = await loadModule()
  const service = createPlayerIdentityMembershipHydrationService({
    supabaseClient: makeSupabaseStub({ user: { id: 'u_1' }, throwOn: 'select:team_members' }),
  })
  const res = await service.restoreMembershipContext()
  assert.equal(res.ok, true)
  assert.equal(res.data.identity.player_id, 'u_1')
  assert.equal(res.data.membership, null)
})

test('Player Dashboard and Coach Dashboard still render', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  assert.match(appSource, /CoachCommandCenter/)
  assert.match(appSource, /CompactLeaderboardPreviewCard/)
  assert.match(appSource, /switchTab\("profile"\)/)
})
