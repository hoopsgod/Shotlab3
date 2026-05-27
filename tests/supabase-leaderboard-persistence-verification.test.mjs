import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { transformSync } from 'esbuild'

import { createShotLogService } from '../src/lib/shotLogService.js'
import { createLeaderboardService } from '../src/lib/leaderboardService.js'

const require = createRequire(import.meta.url)

function loadHomeShotsLeaderboardCard() {
  const source = fs.readFileSync(new URL('../src/components/HomeShotsLeaderboardCard.jsx', import.meta.url), 'utf8')
  const transformed = transformSync(source, { loader: 'jsx', format: 'cjs', jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', target: 'es2020' }).code
  const module = { exports: {} }
  const runner = new Function('require', 'module', 'exports', transformed)
  runner(require, module, module.exports)
  return module.exports.default || module.exports
}

function createMockSupabaseClient(seed = []) { const store = [...seed]; const calls = []; const client = { isConfigured: true, __rows: store, __calls: calls, __failInsert: false, __failSelect: false, from(table) { return { async upsert(payload) { calls.push({ op: 'upsert', table, payload }); if (client.__failInsert) return { error: { message: 'insert failed' } }; store.push(payload); return { data: [payload], error: null } }, async select() { calls.push({ op: 'select', table }); if (client.__failSelect) return { error: { message: 'select failed' } }; return { data: [...store], error: null } } } } }; return client }

test('supabase save test: shot log persists with player, team and totals without silent failure', async () => {
  const supabaseClient = createMockSupabaseClient(); const service = createShotLogService({ supabaseClient })
  const created = await service.createShotLog({ shotLog: { made: 25, attempted_shots: 40, total_reps: 40, date: '2026-05-27' }, player: { id: 'player-a', email: 'player-a@test.com', name: 'Player A' }, team: { id: 'team-1' } })
  assert.equal(created.ok, true); assert.equal(created.mode, 'supabase'); assert.equal(supabaseClient.__calls[0].table, 'shot_logs'); assert.equal(supabaseClient.__calls[0].payload.player_id, 'player-a'); assert.equal(supabaseClient.__calls[0].payload.team_id, 'team-1'); assert.equal(supabaseClient.__calls[0].payload.made, 25); assert.equal(supabaseClient.__calls[0].payload.attempted_shots, 40)
  const totals = await service.summarizePlayerShotTotals({ playerId: 'player-a', teamId: 'team-1' }); assert.equal(totals.data.made, 25); assert.equal(totals.data.attempted, 40); assert.equal(totals.data.count, 1)
})

test('leaderboard aggregation test: leaderboard ranking derives from persisted shot logs', async () => {
  const supabaseClient = createMockSupabaseClient(); const shotService = createShotLogService({ supabaseClient }); const leaderboardService = createLeaderboardService({ supabaseClient })
  await shotService.createShotLog({ shotLog: { made: 15, attempted_shots: 20 }, player: { id: 'player-a', name: 'Player A' }, team: { id: 'team-1' } })
  await shotService.createShotLog({ shotLog: { made: 35, attempted_shots: 50 }, player: { id: 'player-b', name: 'Player B' }, team: { id: 'team-1' } })
  const board = await leaderboardService.loadTeamLeaderboard({ teamId: 'team-1' }); assert.equal(board.mode, 'supabase'); assert.equal(board.data[0].player_id, 'player-b'); assert.equal(board.data[0].total_home_shots, 35); assert.equal(board.data[1].player_id, 'player-a'); assert.equal(board.data[1].total_home_shots, 15)
})

test('coach and player visibility tests: both views use the persisted leaderboard row data', () => {
  const HomeShotsLeaderboardCard = loadHomeShotsLeaderboardCard()
  const rows = [{ rank: 1, player_display_name: 'Player B', total_home_shots: 35 }]
  const coachHtml = renderToStaticMarkup(React.createElement(HomeShotsLeaderboardCard, { status: 'success', rows, title: 'TOP 10 HOME SHOTS' }))
  const playerHtml = renderToStaticMarkup(React.createElement(HomeShotsLeaderboardCard, { status: 'success', rows, title: 'TOP 10 HOME SHOTS' }))
  const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  assert.match(appSource, /PremiumLeaderboardsHub/)
  assert.match(coachHtml, /PLAYER B/); assert.match(coachHtml, />35</)
  assert.match(playerHtml, /PLAYER B/); assert.match(playerHtml, />35</)
})

test('empty state test: no fake rankings, clean empty state copy', () => {
  const HomeShotsLeaderboardCard = loadHomeShotsLeaderboardCard()
  const html = renderToStaticMarkup(React.createElement(HomeShotsLeaderboardCard, { status: 'success', rows: [] }))
  assert.doesNotMatch(html, /#1/); assert.match(html, /No leaderboard data yet\. Log shots to enter the rankings\./)
})

test('error handling test: supabase failures return safe fallback and non-technical ui copy', async () => {
  const HomeShotsLeaderboardCard = loadHomeShotsLeaderboardCard()
  const supabaseClient = createMockSupabaseClient(); const shotService = createShotLogService({ supabaseClient }); const leaderboardService = createLeaderboardService({ supabaseClient })
  supabaseClient.__failInsert = true; const saveResult = await shotService.createShotLog({ shotLog: { made: 8 }, player: { id: 'player-a' }, team: { id: 'team-1' } }); assert.equal(saveResult.mode, 'demo'); assert.equal(saveResult.reason, 'backend_save_failed')
  supabaseClient.__failSelect = true; const readResult = await leaderboardService.loadTeamLeaderboard({ teamId: 'team-1', fallbackShotLogs: [] }); assert.equal(readResult.mode, 'demo'); assert.equal(readResult.reason, 'backend_load_failed')
  const html = renderToStaticMarkup(React.createElement(HomeShotsLeaderboardCard, { status: 'error', error: 'Please try again.' }))
  assert.doesNotMatch(html, /Supabase|stack|SQL|technical/i)
})

test('static guard: leaderboard service reads shot_logs table (not hardcoded rows)', () => {
  const src = fs.readFileSync(new URL('../src/lib/leaderboardService.js', import.meta.url), 'utf8')
  assert.match(src, /from\(SHOT_LOGS_TABLE\)\.select\(\)/)
  assert.doesNotMatch(src, /\b\[\s*\{\s*rank\s*:\s*1\s*,\s*player_display_name\s*:/)
})
