import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  archivePlayerForTeam,
  deleteTeamLocalPlayerData,
  isActiveRosterPlayer,
  isPlayerHiddenFromActiveLeaderboards,
  removePlayerFromTeam,
} from '../src/lib/playerDataManagement.js'

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

const coach = { email: 'coach@team.com', role: 'coach', teamId: 'team-a' }
const basePlayers = [
  { email: 'one@team.com', name: 'Player One', role: 'player', teamId: 'team-a' },
  { email: 'two@team.com', name: 'Player Two', role: 'player', teamId: 'team-a' },
  { email: 'other@team.com', name: 'Other Team', role: 'player', teamId: 'team-b' },
  { email: 'coach@team.com', name: 'Coach', role: 'coach', teamId: 'team-a' },
]

test('coach can archive one player and hide them from active roster/leaderboards', () => {
  const result = archivePlayerForTeam({ players: basePlayers, coach, playerEmail: 'one@team.com', now: 1000 })

  assert.equal(result.ok, true)
  const archived = result.players.find((player) => player.email === 'one@team.com')
  assert.equal(archived.archived, true)
  assert.equal(archived.rosterStatus, 'archived')
  assert.equal(archived.hideFromLeaderboards, true)
  assert.equal(isActiveRosterPlayer(archived, 'team-a'), false)
  assert.equal(isPlayerHiddenFromActiveLeaderboards(archived), true)
  assert.equal(isActiveRosterPlayer(result.players.find((player) => player.email === 'two@team.com'), 'team-a'), true)
})

test('coach can remove one player from team without deleting account row or touching other players', () => {
  const result = removePlayerFromTeam({ players: basePlayers, coach, playerEmail: 'one@team.com', now: 1000 })

  assert.equal(result.ok, true)
  const removed = result.players.find((player) => player.email === 'one@team.com')
  assert.equal(removed.teamId, null)
  assert.equal(removed.rosterStatus, 'removed')
  assert.equal(removed.removedFromTeamId, 'team-a')
  assert.equal(removed.hideFromLeaderboards, true)
  assert.equal(result.players.some((player) => player.email === 'one@team.com'), true, 'registered player account row is preserved')
  assert.deepEqual(result.players.find((player) => player.email === 'two@team.com'), basePlayers[1])
  assert.deepEqual(result.players.find((player) => player.email === 'coach@team.com'), basePlayers[3])
})

test('Delete Team-Local Player Data requires confirmation with player name/email', () => {
  const result = deleteTeamLocalPlayerData({ players: basePlayers, coach, playerEmail: 'one@team.com', confirmationText: 'Player One' })

  assert.equal(result.ok, false)
  assert.match(result.err, /Confirmation must include the player name\/email/)
})

test('Delete Team-Local Player Data filters only selected player team data and preserves team, coach, other players, drills/events, unrelated accounts', () => {
  const state = {
    players: basePlayers,
    playerProfiles: [
      { id: 'profile-selected', teamId: 'team-a', userId: 'one@team.com' },
      { id: 'profile-other-player', teamId: 'team-a', userId: 'two@team.com' },
      { id: 'profile-other-team', teamId: 'team-b', userId: 'one@team.com' },
    ],
    scores: [
      { id: 'score-selected', teamId: 'team-a', email: 'one@team.com' },
      { id: 'score-other-player', teamId: 'team-a', email: 'two@team.com' },
      { id: 'score-other-team', teamId: 'team-b', email: 'one@team.com' },
    ],
    shotLogs: [
      { id: 'shot-selected', teamId: 'team-a', email: 'one@team.com' },
      { id: 'shot-other-player', teamId: 'team-a', email: 'two@team.com' },
      { id: 'shot-other-team', teamId: 'team-b', email: 'one@team.com' },
    ],
    rsvps: [
      { id: 'rsvp-selected', teamId: 'team-a', email: 'one@team.com' },
      { id: 'rsvp-other-player', teamId: 'team-a', email: 'two@team.com' },
    ],
    scRsvps: [
      { id: 'sc-rsvp-selected', teamId: 'team-a', email: 'one@team.com' },
      { id: 'sc-rsvp-other-player', teamId: 'team-a', email: 'two@team.com' },
    ],
    scLogs: [
      { id: 'sc-log-selected', teamId: 'team-a', email: 'one@team.com' },
      { id: 'sc-log-other-player', teamId: 'team-a', email: 'two@team.com' },
    ],
    challenges: [
      { id: 'challenge-selected', teamId: 'team-a', from: 'one@team.com', to: 'two@team.com' },
      { id: 'challenge-other-player', teamId: 'team-a', from: 'two@team.com', to: 'third@team.com' },
      { id: 'challenge-other-team', teamId: 'team-b', from: 'one@team.com', to: 'other@team.com' },
    ],
  }

  const result = deleteTeamLocalPlayerData({ ...state, coach, playerEmail: 'one@team.com', confirmationText: 'Player One one@team.com', now: 1000 })

  assert.equal(result.ok, true)
  assert.equal(result.players.find((player) => player.email === 'one@team.com').teamId, null)
  assert.equal(result.players.find((player) => player.email === 'one@team.com').rosterStatus, 'team_local_data_deleted')
  assert.equal(result.players.find((player) => player.email === 'two@team.com').teamId, 'team-a')
  assert.equal(result.players.find((player) => player.email === 'coach@team.com').teamId, 'team-a')
  assert.deepEqual(result.scores.map((row) => row.id), ['score-other-player', 'score-other-team'])
  assert.deepEqual(result.shotLogs.map((row) => row.id), ['shot-other-player', 'shot-other-team'])
  assert.deepEqual(result.rsvps.map((row) => row.id), ['rsvp-other-player'])
  assert.deepEqual(result.scRsvps.map((row) => row.id), ['sc-rsvp-other-player'])
  assert.deepEqual(result.scLogs.map((row) => row.id), ['sc-log-other-player'])
  assert.deepEqual(result.challenges.map((row) => row.id), ['challenge-other-player', 'challenge-other-team'])
  assert.deepEqual(result.playerProfiles.map((row) => row.id), ['profile-other-player', 'profile-other-team'])
})

test('coach player data management UI is separate from account deletion and labels team-local removal', () => {
  assert.match(appSource, /data-testid="coach-player-data-management"/)
  assert.match(appSource, />ARCHIVE PLAYER</)
  assert.match(appSource, />REMOVE FROM TEAM</)
  assert.match(appSource, />DELETE TEAM-LOCAL PLAYER DATA</)
  assert.match(appSource, /CONFIRM TEAM-LOCAL DELETE/)
  assert.match(appSource, /does not delete accounts, team branding, drills, events, or other players/)
  assert.match(appSource, /deleteTeamLocalRosterPlayerData=\{deleteTeamLocalRosterPlayerData\}/)
  assert.match(appSource, /<AccountTrustActions deleteAccount=\{deleteAccount\} preserveTeamData\/>/)
  assert.match(appSource, /const cleanupDemoPlayerSessionData=useCallback/)
  assert.match(appSource, /const addScore=async\(drillId,score,src="home"\)=>/)
})
