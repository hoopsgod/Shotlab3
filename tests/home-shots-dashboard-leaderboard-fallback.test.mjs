import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { transformSync } from 'esbuild'
import { calculateLeaderboardFromShotLogs } from '../src/lib/leaderboardService.js'

const require = createRequire(import.meta.url)
const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const compactCardFileUrl = new URL('../src/components/CompactLeaderboardPreviewCard.jsx', import.meta.url)

function loadCompactCardComponent() {
  const source = fs.readFileSync(compactCardFileUrl, 'utf8')
  const transformed = transformSync(source, {
    loader: 'jsx',
    format: 'cjs',
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    target: 'es2020',
  }).code
  const module = { exports: {} }
  const runner = new Function('require', 'module', 'exports', transformed)
  runner(require, module, module.exports)
  return module.exports.default || module.exports
}

const players = [{
  id: 'player:team_aahna',
  player_id: 'player:team_aahna',
  user_id: 'uuid-aahna',
  userId: 'legacy-uuid-aahna',
  teamId: 'team-a',
  email: 'aahna@gmail.com',
  name: 'Aahna',
  role: 'player',
}]

const shotLogs = [
  { id: 's-roster', teamId: 'team-a', playerId: 'player:team_aahna', email: 'aahna@gmail.com', made: 447, syncState: 'remote_saved', syncSource: 'remote' },
  { id: 's-email', teamId: 'team-a', playerId: 'aahna@gmail.com', email: 'aahna@gmail.com', made: 480, syncState: 'remote_saved', syncSource: 'remote' },
]

test('dashboard fallback aggregates the same saved shot logs that drive player totals', () => {
  const savedShotTotal = shotLogs.filter((row) => row.email === 'aahna@gmail.com' && row.teamId === 'team-a').reduce((sum, row) => sum + Number(row.made || 0), 0)
  assert.equal(savedShotTotal, 927)

  const rows = calculateLeaderboardFromShotLogs({ shotLogs, teamId: 'team-a', playerContext: { players } })
  assert.equal(rows.length, 1)
  assert.equal(rows[0].player_id, 'player:team_aahna')
  assert.equal(rows[0].email, 'aahna@gmail.com')
  assert.equal(rows[0].player_display_name, 'Aahna')
  assert.equal(rows[0].total_home_shots, 927)
})

test('player and coach compact home-shots cards show Aahna instead of empty after fallback rows exist', () => {
  const CompactLeaderboardPreviewCard = loadCompactCardComponent()
  const rows = calculateLeaderboardFromShotLogs({ shotLogs, teamId: 'team-a', playerContext: { players } })

  const playerHtml = renderToStaticMarkup(React.createElement(CompactLeaderboardPreviewCard, {
    status: 'success',
    mode: 'player',
    userEmail: 'aahna@gmail.com',
    rows,
    title: 'Team Leaders',
    categoryLabel: 'Home Shots',
  }))
  const coachHtml = renderToStaticMarkup(React.createElement(CompactLeaderboardPreviewCard, {
    status: 'success',
    mode: 'coach',
    rows,
    title: 'Home Shot Leaders',
    categoryLabel: 'Home Shots',
  }))

  assert.match(playerHtml, /Aahna/)
  assert.match(playerHtml, /927/)
  assert.match(playerHtml, /Your rank #1/)
  assert.doesNotMatch(playerHtml, /No leaderboard data yet\. Log shots to enter the rankings\./)
  assert.match(coachHtml, /Aahna/)
  assert.match(coachHtml, /927/)
  assert.doesNotMatch(coachHtml, /No team leaderboard data yet\. Players will appear here after they log shots\./)
})

test('App home-shots leaderboard fetch falls back to local shotLogs when RPC is empty or unavailable', () => {
  assert.match(appSource, /calculateLeaderboardFromShotLogs\(\{shotLogs,teamId,playerContext:\{players,profiles:playerProfiles,scope\}\}\)\.slice\(0,HOME_SHOTS_LEADERBOARD_LIMIT\)/)
  assert.match(appSource, /const fallbackRows=rpcRows\.length\?\[\]:localLeaderboardRows\(\);/)
  assert.match(appSource, /const leaderboardRows=rpcRows\.length\?rpcRows:fallbackRows;/)
  assert.match(appSource, /applyLeaderboardRows\(fallbackRows,\{httpStatus:null,errorCode:"network_error"/)
})
