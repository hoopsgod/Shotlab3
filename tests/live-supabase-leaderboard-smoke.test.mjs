import test from 'node:test'
import assert from 'node:assert/strict'
import { createShotLogService } from '../src/lib/shotLogService.js'
import { createLeaderboardService } from '../src/lib/leaderboardService.js'

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim()
const SUPABASE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim()
const TEST_TEAM_ID = String(process.env.TEST_TEAM_ID || '').trim()
const TEST_PLAYER_A_ID = String(process.env.TEST_PLAYER_A_ID || process.env.TEST_PLAYER_ID || '').trim()
const TEST_PLAYER_B_ID = String(process.env.TEST_PLAYER_B_ID || '').trim()

const hasLiveEnv = Boolean(SUPABASE_URL && SUPABASE_KEY && TEST_TEAM_ID && TEST_PLAYER_A_ID && TEST_PLAYER_B_ID)

function createLiveSupabaseClient({ url, key }) {
  const base = `${url.replace(/\/$/, '')}/rest/v1`

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  const parseJson = async (res) => {
    const text = await res.text()
    if (!text) return null
    try { return JSON.parse(text) } catch { return { raw: text } }
  }

  return {
    isConfigured: true,
    from(table) {
      return {
        async upsert(payload) {
          const res = await fetch(`${base}/${table}`, {
            method: 'POST',
            headers: { ...headers, Prefer: 'return=representation,resolution=merge-duplicates' },
            body: JSON.stringify([payload]),
          })
          const body = await parseJson(res)
          if (!res.ok) return { error: { status: res.status, body }, data: null }
          return { data: Array.isArray(body) ? body : [], error: null }
        },
        async select() {
          const res = await fetch(`${base}/${table}?select=*`, {
            method: 'GET',
            headers,
          })
          const body = await parseJson(res)
          if (!res.ok) return { error: { status: res.status, body }, data: null }
          return { data: Array.isArray(body) ? body : [], error: null }
        },
      }
    },
    async deleteShotLogsBySession(sessionId) {
      const url = `${base}/shot_logs?session_id=eq.${encodeURIComponent(sessionId)}`
      const res = await fetch(url, { method: 'DELETE', headers: { ...headers, Prefer: 'return=minimal' } })
      return res.ok
    },
  }
}

test('live supabase smoke: persisted shot logs drive leaderboard rank and totals', { skip: !hasLiveEnv }, async () => {
  const supabaseClient = createLiveSupabaseClient({ url: SUPABASE_URL, key: SUPABASE_KEY })
  const shotLogService = createShotLogService({ supabaseClient })
  const leaderboardService = createLeaderboardService({ supabaseClient })

  const sessionId = `live-smoke-${Date.now()}`
  const playerA = { id: TEST_PLAYER_A_ID, email: `${TEST_PLAYER_A_ID}@test.local`, name: 'Smoke Player A' }
  const playerB = { id: TEST_PLAYER_B_ID, email: `${TEST_PLAYER_B_ID}@test.local`, name: 'Smoke Player B' }
  const team = { id: TEST_TEAM_ID }

  try {
    const saveA = await shotLogService.createShotLog({ shotLog: { made: 11, attempted_shots: 20, session_id: sessionId, date: '2026-05-27' }, player: playerA, team })
    const saveB = await shotLogService.createShotLog({ shotLog: { made: 29, attempted_shots: 40, session_id: sessionId, date: '2026-05-27' }, player: playerB, team })
    assert.equal(saveA.ok, true)
    assert.equal(saveB.ok, true)
    assert.equal(saveA.mode, 'supabase')
    assert.equal(saveB.mode, 'supabase')

    const allRows = await shotLogService.loadTeamShotLogs({ teamId: TEST_TEAM_ID })
    assert.equal(allRows.ok, true)

    const sessionRows = (allRows.data || []).filter((r) => String(r.session_id || '') === sessionId)
    const totalA = sessionRows.filter((r) => String(r.player_id) === TEST_PLAYER_A_ID).reduce((acc, r) => acc + Number(r.made || 0), 0)
    const totalB = sessionRows.filter((r) => String(r.player_id) === TEST_PLAYER_B_ID).reduce((acc, r) => acc + Number(r.made || 0), 0)

    assert.equal(totalA, 11)
    assert.equal(totalB, 29)

    const leaderboard = await leaderboardService.loadTeamLeaderboard({ teamId: TEST_TEAM_ID })
    assert.equal(leaderboard.ok, true)
    assert.equal(leaderboard.mode, 'supabase')

    const rowA = (leaderboard.data || []).find((r) => String(r.player_id) === TEST_PLAYER_A_ID)
    const rowB = (leaderboard.data || []).find((r) => String(r.player_id) === TEST_PLAYER_B_ID)

    assert.ok(rowA)
    assert.ok(rowB)
    assert.equal(rowA.total_home_shots >= totalA, true)
    assert.equal(rowB.total_home_shots >= totalB, true)

    const sorted = [...leaderboard.data].sort((a, b) => (b.total_home_shots - a.total_home_shots))
    const rankA = sorted.findIndex((r) => String(r.player_id) === TEST_PLAYER_A_ID)
    const rankB = sorted.findIndex((r) => String(r.player_id) === TEST_PLAYER_B_ID)
    assert.equal(rankB < rankA, true)
  } finally {
    await supabaseClient.deleteShotLogsBySession(sessionId)
  }
})
