import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { createShotLogService } from '../src/lib/shotLogService.js'
import { createLeaderboardService, calculateLeaderboardFromShotLogs } from '../src/lib/leaderboardService.js'
import { emitReleaseDiagnostic, isShotLabDebugMode } from '../src/lib/releaseDiagnostics.js'

function createTableSupabaseClient(seed = {}) {
  const tables = {
    shot_logs: [...(seed.shot_logs || [])],
    players: [...(seed.players || [])],
    player_profiles: [...(seed.player_profiles || [])],
  }
  const calls = []
  return {
    isConfigured: true,
    __tables: tables,
    __calls: calls,
    from(table) {
      return {
        async upsert(payload) {
          calls.push({ op: 'upsert', table, payload })
          tables[table] ||= []
          tables[table].push(payload)
          return { data: [payload], error: null }
        },
        async select() {
          calls.push({ op: 'select', table })
          return { data: [...(tables[table] || [])], error: null }
        },
      }
    },
  }
}

test('release candidate: player shot logging persists remotely and updates player + coach leaderboards', async () => {
  const supabaseClient = createTableSupabaseClient({
    players: [{ id: 'roster-player-1', player_id: 'roster-player-1', user_id: 'auth-user-1', email: 'player@shotlab.test', team_id: 'team-launch', name: 'Launch Player' }],
  })
  const shotService = createShotLogService({ supabaseClient })
  const leaderboardService = createLeaderboardService({ supabaseClient })

  const save = await shotService.createShotLog({
    shotLog: { made: 42, attempted_shots: 50, date: '2026-06-06' },
    player: { id: 'roster-player-1', email: 'player@shotlab.test', name: 'Launch Player' },
    team: { id: 'team-launch' },
  })

  assert.equal(save.mode, 'supabase')
  assert.equal(supabaseClient.__tables.shot_logs.length, 1)
  assert.equal(supabaseClient.__tables.shot_logs[0].player_id, 'roster-player-1')
  assert.equal(supabaseClient.__tables.shot_logs[0].team_id, 'team-launch')

  const totals = await shotService.summarizePlayerShotTotals({ playerId: 'roster-player-1', teamId: 'team-launch' })
  assert.equal(totals.data.made, 42)

  const playerBoard = await leaderboardService.loadPlayerShotLeaderboard({ teamId: 'team-launch', playerId: 'roster-player-1' })
  assert.equal(playerBoard.data.length, 1)
  assert.equal(playerBoard.data[0].total_home_shots, 42)
  assert.equal(playerBoard.data[0].player_display_name, 'Launch Player')

  const coachBoard = await leaderboardService.loadTeamLeaderboard({ teamId: 'team-launch', scope: 'players' })
  assert.equal(coachBoard.data.length, 1)
  assert.equal(coachBoard.data[0].total_home_shots, 42)
  assert.equal(coachBoard.data[0].player_id, 'roster-player-1')
})

test('release candidate: shot_logs rows never produce an empty leaderboard state, including RPC-empty local fallback', async () => {
  const shotLogs = [{ team_id: 'team-launch', player_id: 'player-a', email: 'player-a@shotlab.test', name: 'Player A', made: 27 }]
  const rows = calculateLeaderboardFromShotLogs({ shotLogs, teamId: 'team-launch' })
  assert.notEqual(rows.length, 0, 'shot_logs should aggregate into visible leaderboard rows')
  assert.equal(rows[0].total_home_shots, 27)

  const emptyRpcClient = createTableSupabaseClient({ shot_logs: [] })
  const service = createLeaderboardService({ supabaseClient: emptyRpcClient })
  const fallback = await service.loadTeamLeaderboard({ teamId: 'team-launch', fallbackShotLogs: shotLogs })
  assert.equal(fallback.mode, 'supabase')
  assert.equal(fallback.data.length, 1)
  assert.equal(fallback.data[0].total_home_shots, 27)
})

test('release candidate: legacy email and UUID shot rows aggregate under the roster player', () => {
  const rows = calculateLeaderboardFromShotLogs({
    teamId: 'team-launch',
    playerContext: {
      players: [{ id: 'roster-player-1', player_id: 'roster-player-1', user_id: 'auth-user-1', email: 'player@shotlab.test', team_id: 'team-launch', name: 'Roster Player' }],
    },
    shotLogs: [
      { team_id: 'team-launch', player_id: 'roster-player-1', email: 'player@shotlab.test', made: 10 },
      { team_id: 'team-launch', player_id: 'auth-user-1', email: 'player@shotlab.test', made: 15 },
      { team_id: 'team-launch', player_id: 'player@shotlab.test', email: 'player@shotlab.test', made: 20 },
    ],
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].player_id, 'roster-player-1')
  assert.equal(rows[0].total_home_shots, 45)
  assert.equal(rows[0].player_display_name, 'Roster Player')
})

test('release candidate: diagnostics are console-only and gated by debug mode', () => {
  const messages = []
  const logger = { info: (...args) => messages.push(args) }

  assert.equal(isShotLabDebugMode('?shotLabDebug=1'), true)
  assert.equal(isShotLabDebugMode('?homeShotDebug=true'), true)
  assert.equal(isShotLabDebugMode('?shotLabDebug=0'), false)

  const payload = emitReleaseDiagnostic({
    event: 'leaderboard_fetch_completed',
    shotLogSaveStatus: 'success',
    leaderboardRpcResultCount: 1,
    fallbackLeaderboardResultCount: 0,
    teamId: 'team-launch',
    playerId: 'roster-player-1',
    authenticatedUserEmail: 'PLAYER@SHOTLAB.TEST',
  }, { debug: false, logger })
  assert.equal(messages.length, 0)
  assert.equal(payload.authenticatedUserEmail, 'player@shotlab.test')

  emitReleaseDiagnostic(payload, { debug: true, logger })
  assert.equal(messages.length, 1)
  assert.equal(messages[0][0], '[shotlab-release-diagnostic]')
  assert.equal(messages[0][1].leaderboardRpcResultCount, 1)
})

test('release checklist covers required launch smoke tests and do-not-merge gates', () => {
  const checklist = fs.readFileSync(new URL('../RELEASE_CHECKLIST.md', import.meta.url), 'utf8')
  for (const heading of ['Player smoke test', 'Coach smoke test', 'Demo smoke test', 'Mobile Safari smoke test', 'Known limitations', 'Do-not-merge conditions']) {
    assert.match(checklist, new RegExp(heading, 'i'))
  }
})
