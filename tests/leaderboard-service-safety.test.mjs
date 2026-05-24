import test from 'node:test'
import assert from 'node:assert/strict'
import { createLeaderboardService, calculateLeaderboardFromShotLogs } from '../src/lib/leaderboardService.js'

const makeClient = (impl, configured = true) => ({
  isConfigured: configured,
  from: () => ({ select: impl }),
})

test('missing Supabase env vars = demo/local safe', async () => {
  const service = createLeaderboardService({ supabaseClient: makeClient(async () => ({}), false) })
  const result = await service.loadTeamLeaderboard({ teamId: 'team-1' })
  assert.equal(result.ok, true)
  assert.equal(result.mode, 'demo')
  assert.equal(result.reason, 'missing_supabase_env')
})

test('missing team context = no crash', async () => {
  const service = createLeaderboardService({ supabaseClient: makeClient(async () => ({ data: [] })) })
  const result = await service.loadTeamLeaderboard({})
  assert.equal(result.ok, true)
  assert.equal(result.reason, 'missing_team_context')
  assert.deepEqual(result.data, [])
})

test('empty shot logs = clean empty leaderboard', () => {
  const rows = calculateLeaderboardFromShotLogs({ shotLogs: [], teamId: 'team-1' })
  assert.deepEqual(rows, [])
})

test('valid shot logs produce ranked entries', () => {
  const rows = calculateLeaderboardFromShotLogs({ shotLogs: [
    { team_id: 'team-1', player_id: 'b', made: 5 },
    { team_id: 'team-1', player_id: 'a', made: 10, attempted_shots: 15 },
    { team_id: 'team-1', player_id: 'b', made: 7, attempted_shots: 8 },
  ], teamId: 'team-1' })
  assert.equal(rows[0].player_id, 'b')
  assert.equal(rows[0].rank, 1)
  assert.equal(rows[1].player_id, 'a')
  assert.equal(rows[1].rank, 2)
  assert.equal(rows[0].total_makes, 12)
  assert.equal(rows[0].total_home_shots, 12)
})

test('backend unavailable = safe fallback', async () => {
  const service = createLeaderboardService({ supabaseClient: makeClient(async () => { throw new Error('down') }) })
  const result = await service.loadTeamLeaderboard({
    teamId: 'team-1',
    fallbackShotLogs: [{ team_id: 'team-1', player_id: 'p1', made: 3 }],
  })
  assert.equal(result.ok, true)
  assert.equal(result.mode, 'demo')
  assert.equal(result.reason, 'backend_unavailable')
  assert.equal(result.data[0].player_id, 'p1')
})

test('app startup does not depend on leaderboard data (safe defaults)', async () => {
  const service = createLeaderboardService({ supabaseClient: makeClient(async () => ({ error: { message: 'bad' } })) })
  const player = await service.loadPlayerShotLeaderboard({ teamId: 'team-1', playerId: '' })
  assert.equal(player.ok, true)
  assert.equal(player.reason, 'missing_player_context')
})
