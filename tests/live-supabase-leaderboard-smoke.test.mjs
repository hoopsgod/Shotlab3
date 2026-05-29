import test from 'node:test'
import assert from 'node:assert/strict'
import { createShotLogService } from '../src/lib/shotLogService.js'
import { createLeaderboardService } from '../src/lib/leaderboardService.js'

const SHOT_LOGS_TABLE = 'shot_logs'
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim()
const SUPABASE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim()
const TEST_TEAM_ID = String(process.env.TEST_TEAM_ID || '').trim()
const TEST_PLAYER_A_ID = String(process.env.TEST_PLAYER_A_ID || process.env.TEST_PLAYER_ID || '').trim()
const TEST_PLAYER_B_ID = String(process.env.TEST_PLAYER_B_ID || '').trim()

const hasLiveEnv = Boolean(SUPABASE_URL && SUPABASE_KEY)

function normalizeDiagnostic(value) {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack }
  }
  if (Array.isArray(value)) return value.map(normalizeDiagnostic)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, normalizeDiagnostic(nested)]))
  }
  return value
}

function safeJson(value) {
  try { return JSON.stringify(normalizeDiagnostic(value)) } catch { return String(value) }
}

function createSupabaseRestClient({ url, key }) {
  const base = `${url.replace(/\/$/, '')}/rest/v1`
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  const parseBody = async (res) => {
    const text = await res.text()
    if (!text) return null
    try { return JSON.parse(text) } catch { return { raw: text } }
  }

  const request = async ({ operation, table, method, query = '', body, prefer }) => {
    const res = await fetch(`${base}/${table}${query}`, {
      method,
      headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const responseBody = await parseBody(res)
    if (!res.ok) {
      throw new Error([
        'Live Supabase REST preflight failed',
        `operation: ${operation}`,
        `table: ${table}`,
        `http_status: ${res.status}`,
        `response_body: ${safeJson(responseBody)}`,
      ].join('\n'))
    }
    return responseBody
  }

  return { request }
}

async function runShotLogsRestPreflight({ sessionId, teamId, playerId }) {
  assert.ok(SUPABASE_URL, 'SUPABASE_URL is required for live Supabase smoke verification')
  assert.ok(SUPABASE_KEY, 'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required for live Supabase smoke verification')

  const rest = createSupabaseRestClient({ url: SUPABASE_URL, key: SUPABASE_KEY })
  const payload = {
    player_id: playerId,
    team_id: teamId,
    session_id: sessionId,
    made: 1,
    attempted_shots: 1,
    date: '2026-05-27',
    created_at: new Date().toISOString(),
    email: `${playerId}@test.local`,
    name: 'Smoke Preflight Player',
  }

  let originalError
  try {
    await rest.request({
      operation: 'insert',
      table: SHOT_LOGS_TABLE,
      method: 'POST',
      body: [payload],
      prefer: 'return=representation',
    })

    await rest.request({
      operation: 'select',
      table: SHOT_LOGS_TABLE,
      method: 'GET',
      query: `?select=*&session_id=eq.${encodeURIComponent(sessionId)}`,
    })
  } catch (error) {
    originalError = error
  }

  try {
    await rest.request({
      operation: 'delete',
      table: SHOT_LOGS_TABLE,
      method: 'DELETE',
      query: `?session_id=eq.${encodeURIComponent(sessionId)}`,
      prefer: 'return=minimal',
    })
  } catch (cleanupError) {
    if (originalError) throw originalError
    throw cleanupError
  }

  if (originalError) throw originalError
}

function formatServiceResultForFailure(result) {
  return safeJson({
    ok: result?.ok,
    mode: result?.mode,
    reason: result?.reason,
    skipped: result?.skipped,
    backendError: result?.backendError,
  })
}

function assertSupabaseMode(result, label) {
  assert.equal(
    result?.mode,
    'supabase',
    `${label} unexpectedly fell back to ${safeJson(result?.mode)}. Service result: ${formatServiceResultForFailure(result)}`,
  )
}

function createLiveSupabaseClient({ url, key }) {
  const rest = createSupabaseRestClient({ url, key })

  return {
    isConfigured: true,
    from(table) {
      return {
        async upsert(payload) {
          try {
            const body = await rest.request({
              operation: 'upsert',
              table,
              method: 'POST',
              body: [payload],
              prefer: 'return=representation,resolution=merge-duplicates',
            })
            return { data: Array.isArray(body) ? body : [], error: null }
          } catch (error) {
            return { error, data: null }
          }
        },
        async select() {
          try {
            const body = await rest.request({ operation: 'select', table, method: 'GET', query: '?select=*' })
            return { data: Array.isArray(body) ? body : [], error: null }
          } catch (error) {
            return { error, data: null }
          }
        },
      }
    },
    async deleteShotLogsBySession(sessionId) {
      try {
        await rest.request({
          operation: 'delete',
          table: SHOT_LOGS_TABLE,
          method: 'DELETE',
          query: `?session_id=eq.${encodeURIComponent(sessionId)}`,
          prefer: 'return=minimal',
        })
        return true
      } catch (error) {
        return { error }
      }
    },
  }
}

test('live supabase smoke: persisted shot logs drive leaderboard rank and totals', { skip: !hasLiveEnv }, async () => {
  const sessionId = `live-smoke-${Date.now()}`
  const preflightSessionId = `${sessionId}-preflight`
  const resolvedTeamId = TEST_TEAM_ID || `test-team-${sessionId}`
  const resolvedPlayerAId = TEST_PLAYER_A_ID || `test-player-a-${sessionId}`
  const resolvedPlayerBId = TEST_PLAYER_B_ID || `test-player-b-${sessionId}`
  const isolatedPlayers = !TEST_PLAYER_A_ID && !TEST_PLAYER_B_ID

  await runShotLogsRestPreflight({
    sessionId: preflightSessionId,
    teamId: resolvedTeamId,
    playerId: `${resolvedPlayerAId}-preflight`,
  })

  const supabaseClient = createLiveSupabaseClient({ url: SUPABASE_URL, key: SUPABASE_KEY })
  const shotLogService = createShotLogService({ supabaseClient })
  const leaderboardService = createLeaderboardService({ supabaseClient })

  const playerA = { id: resolvedPlayerAId, email: `${resolvedPlayerAId}@test.local`, name: 'Smoke Player A' }
  const playerB = { id: resolvedPlayerBId, email: `${resolvedPlayerBId}@test.local`, name: 'Smoke Player B' }
  const team = { id: resolvedTeamId }

  try {
    const saveA = await shotLogService.createShotLog({ shotLog: { made: 11, attempted_shots: 20, session_id: sessionId, date: '2026-05-27' }, player: playerA, team })
    const saveB = await shotLogService.createShotLog({ shotLog: { made: 29, attempted_shots: 40, session_id: sessionId, date: '2026-05-27' }, player: playerB, team })
    assert.equal(saveA.ok, true)
    assert.equal(saveB.ok, true)
    assertSupabaseMode(saveA, 'Saving player A shot log')
    assertSupabaseMode(saveB, 'Saving player B shot log')

    const allRows = await shotLogService.loadTeamShotLogs({ teamId: resolvedTeamId })
    assert.equal(allRows.ok, true)
    assertSupabaseMode(allRows, 'Loading team shot logs')

    const sessionRows = (allRows.data || []).filter((r) => String(r.session_id || '') === sessionId)
    const totalA = sessionRows.filter((r) => String(r.player_id) === resolvedPlayerAId).reduce((acc, r) => acc + Number(r.made || 0), 0)
    const totalB = sessionRows.filter((r) => String(r.player_id) === resolvedPlayerBId).reduce((acc, r) => acc + Number(r.made || 0), 0)

    assert.equal(totalA, 11)
    assert.equal(totalB, 29)

    const leaderboard = await leaderboardService.loadTeamLeaderboard({ teamId: resolvedTeamId })
    assert.equal(leaderboard.ok, true)
    assertSupabaseMode(leaderboard, 'Loading team leaderboard')

    const rowA = (leaderboard.data || []).find((r) => String(r.player_id) === resolvedPlayerAId)
    const rowB = (leaderboard.data || []).find((r) => String(r.player_id) === resolvedPlayerBId)

    assert.ok(rowA)
    assert.ok(rowB)
    assert.equal(rowA.total_home_shots >= totalA, true)
    assert.equal(rowB.total_home_shots >= totalB, true)

    if (isolatedPlayers) {
      const sorted = [...leaderboard.data].sort((a, b) => (b.total_home_shots - a.total_home_shots))
      const rankA = sorted.findIndex((r) => String(r.player_id) === resolvedPlayerAId)
      const rankB = sorted.findIndex((r) => String(r.player_id) === resolvedPlayerBId)
      assert.equal(rankB < rankA, true)
    }
  } finally {
    await supabaseClient.deleteShotLogsBySession(sessionId)
  }
})
