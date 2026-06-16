import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  buildProgramDrillLeaderboardRows,
  buildProgramScoreRow,
  isValidProgramScoreInput,
} from '../src/lib/programDrillScoring.js'
import { normalizeScoreRowForDb } from '../src/lib/remotePersistence.js'
import { archivePlayerForTeam, deleteTeamLocalPlayerData, removePlayerFromTeam } from '../src/lib/playerDataManagement.js'

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const coach = { email: 'coach@team.com', role: 'coach', teamId: 'team-a' }
const players = [
  { email: 'one@team.com', name: 'Player One', role: 'player', teamId: 'team-a', id: 'player:team_123', player_id: 'player:team_123' },
  { email: 'two@team.com', name: 'Player Two', role: 'player', teamId: 'team-a', id: 'player:team_456', player_id: 'player:team_456' },
  { email: 'three@team.com', name: 'Player Three', role: 'player', teamId: 'team-a', id: 'player:team_789', player_id: 'player:team_789' },
]
const warmup = { id: 'demo-program-warm-up-shooting-4-minute', name: '4 MINUTE WARM UP SHOOTING', max: 25 }
const calipari = { id: 'demo-program-calipari-shooting', name: 'CALIPARI SHOOTING', max: 10 }

test('player Program Log score input is numeric text for mobile Safari and save disables until valid', () => {
  assert.match(appSource, /inputMode="numeric" pattern="\[0-9\]\*" type="text"/)
  assert.match(appSource, /disabled=\{submitting\|\|!isScoreInputValid\}/)
  assert.equal(isValidProgramScoreInput('', warmup), false)
  assert.equal(isValidProgramScoreInput('abc', warmup), false)
  assert.equal(isValidProgramScoreInput('0', warmup), false)
  assert.equal(isValidProgramScoreInput('0', { ...warmup, allowZeroScore: true }), true)
  assert.equal(isValidProgramScoreInput('7', warmup), true)
})

test('saving a program drill creates a normalized persisted score row with roster player_id', () => {
  const row = buildProgramScoreRow({
    id: 'score-1',
    user: { email: 'one@team.com', name: 'Player One', teamId: 'team-a' },
    players,
    drill: warmup,
    score: '8',
    date: '2026-06-16',
    ts: 12345,
  })

  assert.deepEqual(row, {
    id: 'score-1',
    email: 'one@team.com',
    playerId: 'player:team_123',
    teamId: 'team-a',
    name: 'Player One',
    drillId: 'demo-program-warm-up-shooting-4-minute',
    drillName: '4 MINUTE WARM UP SHOOTING',
    score: 8,
    date: '2026-06-16',
    ts: 12345,
    src: 'program',
  })
  assert.notEqual(row.playerId, row.email)

  assert.deepEqual(normalizeScoreRowForDb(row), {
    id: 'score-1',
    email: 'one@team.com',
    name: 'Player One',
    player_id: 'player:team_123',
    team_id: 'team-a',
    drill_id: 'demo-program-warm-up-shooting-4-minute',
    score: 8,
    date: '2026-06-16',
    ts: 12345,
    src: 'program',
  })
})

test('program drill leaderboard filters by selected drill name/key and recomputes ranks', () => {
  const scores = [
    { id: 'score-1', email: 'one@team.com', playerId: 'player:team_123', teamId: 'team-a', drillId: warmup.id, drillName: warmup.name, score: 8, src: 'program' },
    { id: 'score-2', email: 'two@team.com', playerId: 'player:team_456', teamId: 'team-a', drillId: warmup.id, drillName: warmup.name, score: 11, src: 'program' },
    { id: 'score-3', email: 'three@team.com', playerId: 'player:team_789', teamId: 'team-a', drillId: calipari.id, drillName: calipari.name, score: 99, src: 'program' },
  ]

  const rows = buildProgramDrillLeaderboardRows({ scores, drills: [warmup, calipari], players, teamId: 'team-a', drill: warmup })

  assert.deepEqual(rows.map((row) => [row.rank, row.email, row.total]), [
    [1, 'two@team.com', 11],
    [2, 'one@team.com', 8],
  ])
})

test('removed archived and team-local-deleted players are filtered from program drill leaderboards', () => {
  const scores = [
    { email: 'one@team.com', playerId: 'player:team_123', teamId: 'team-a', drillId: warmup.id, score: 99, src: 'program' },
    { email: 'two@team.com', playerId: 'player:team_456', teamId: 'team-a', drillId: warmup.id, score: 12, src: 'program' },
    { email: 'three@team.com', playerId: 'player:team_789', teamId: 'team-a', drillId: warmup.id, score: 10, src: 'program' },
  ]

  const removed = removePlayerFromTeam({ players, coach, playerEmail: 'player:team_123', now: 1 }).players
  assert.deepEqual(buildProgramDrillLeaderboardRows({ scores, drills: [warmup], players: removed, teamId: 'team-a', drill: warmup }).map((row) => [row.rank, row.email]), [[1, 'two@team.com'], [2, 'three@team.com']])

  const archived = archivePlayerForTeam({ players, coach, playerEmail: 'player:team_123', now: 1 }).players
  assert.deepEqual(buildProgramDrillLeaderboardRows({ scores, drills: [warmup], players: archived, teamId: 'team-a', drill: warmup }).map((row) => row.email), ['two@team.com', 'three@team.com'])

  const deleted = deleteTeamLocalPlayerData({ players, coach, playerEmail: 'player:team_123', confirmationText: 'Player One one@team.com', now: 1 }).players
  assert.deepEqual(buildProgramDrillLeaderboardRows({ scores, drills: [warmup], players: deleted, teamId: 'team-a', drill: warmup }).map((row) => row.rank), [1, 2])
})

test('existing home shot leaderboard path remains wired to the home-shots leaderboard service', () => {
  assert.match(appSource, /fetchHomeShotsLeaderboard\(user\.teamId,view==="player"\?"players":homeShotsLeaderboardScope\)/)
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="player" leaderboardRows=\{homeShotsLeaderboard\?\.rows\|\|\[\]\}/)
})
