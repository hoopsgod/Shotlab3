import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  archivePlayerForTeam,
  deleteTeamLocalPlayerData,
  filterActiveTeamChallengeRows,
  filterActiveTeamLeaderboardRows,
  filterActiveTeamPlayerRows,
  getActiveTeamPlayerEmails,
  getActiveTeamPlayerNames,
  isActiveRosterPlayer,
  isPlayerHiddenFromActiveLeaderboards,
  removePlayerFromTeam,
} from '../src/lib/playerDataManagement.js'

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

const coach = { email: 'coach@team.com', role: 'coach', teamId: 'team-a' }
const basePlayers = [
  { email: 'one@team.com', name: 'Player One', role: 'player', teamId: 'team-a' },
  { email: 'two@team.com', name: 'Player Two', role: 'player', teamId: 'team-a' },
  { email: 'third@team.com', name: 'Player Three', role: 'player', teamId: 'team-a' },
  { email: 'other@team.com', name: 'Other Team', role: 'player', teamId: 'team-b' },
  { email: 'coach@team.com', name: 'Coach', role: 'coach', teamId: 'team-a' },
]

const surfaceState = {
  leaderboardRows: [
    { id: 'leader-selected', player_display_name: 'Player One' },
    { id: 'leader-other', player_display_name: 'Player Two' },
  ],
  eventRsvps: [
    { id: 'rsvp-selected', eventId: 'event-1', teamId: 'team-a', email: 'one@team.com' },
    { id: 'rsvp-other', eventId: 'event-1', teamId: 'team-a', email: 'two@team.com' },
  ],
  scRsvps: [
    { id: 'sc-rsvp-selected', sessionId: 'sc-1', teamId: 'team-a', email: 'one@team.com' },
    { id: 'sc-rsvp-other', sessionId: 'sc-1', teamId: 'team-a', email: 'two@team.com' },
  ],
  scLogs: [
    { id: 'sc-log-selected', sessionId: 'sc-1', teamId: 'team-a', email: 'one@team.com' },
    { id: 'sc-log-other', sessionId: 'sc-1', teamId: 'team-a', email: 'two@team.com' },
  ],
  challenges: [
    { id: 'challenge-selected', teamId: 'team-a', from: 'one@team.com', to: 'two@team.com' },
    { id: 'challenge-other', teamId: 'team-a', from: 'two@team.com', to: 'third@team.com' },
  ],
}

const activeSurfaceIds = (players) => {
  const activeEmails = getActiveTeamPlayerEmails(players, 'team-a')
  const activeNames = getActiveTeamPlayerNames(players, 'team-a')
  return {
    roster: players.filter((player) => isActiveRosterPlayer(player, 'team-a')).map((player) => player.email),
    leaderboards: filterActiveTeamLeaderboardRows(surfaceState.leaderboardRows, activeEmails, activeNames).map((row) => row.id),
    eventRsvps: filterActiveTeamPlayerRows(surfaceState.eventRsvps, activeEmails).map((row) => row.id),
    missingRsvpCandidates: basePlayers.filter((player) => activeEmails.includes(player.email) && !surfaceState.eventRsvps.some((rsvp) => rsvp.email === player.email)).map((player) => player.email),
    eventWalkInCandidates: basePlayers.filter((player) => activeEmails.includes(player.email) && !surfaceState.eventRsvps.some((rsvp) => rsvp.email === player.email)).map((player) => player.email),
    scRsvps: filterActiveTeamPlayerRows(surfaceState.scRsvps, activeEmails).map((row) => row.id),
    scLogs: filterActiveTeamPlayerRows(surfaceState.scLogs, activeEmails).map((row) => row.id),
    challenges: filterActiveTeamChallengeRows(surfaceState.challenges, activeEmails).map((row) => row.id),
  }
}

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
  assert.deepEqual(result.players.find((player) => player.email === 'coach@team.com'), basePlayers[4])
})


test('archived player is hidden from all active coach-facing surfaces while other players remain visible', () => {
  const archived = archivePlayerForTeam({ players: basePlayers, coach, playerEmail: 'one@team.com', now: 1000 }).players
  const surfaces = activeSurfaceIds(archived)

  assert.deepEqual(surfaces.roster, ['two@team.com', 'third@team.com'])
  assert.deepEqual(surfaces.leaderboards, ['leader-other'])
  assert.deepEqual(surfaces.eventRsvps, ['rsvp-other'])
  assert.deepEqual(surfaces.missingRsvpCandidates, ['third@team.com'])
  assert.deepEqual(surfaces.eventWalkInCandidates, ['third@team.com'])
  assert.deepEqual(surfaces.scRsvps, ['sc-rsvp-other'])
  assert.deepEqual(surfaces.scLogs, ['sc-log-other'])
  assert.deepEqual(surfaces.challenges, ['challenge-other'])
})

test('removed player is hidden from active roster, leaderboards, event RSVPs, and S&C RSVPs', () => {
  const removed = removePlayerFromTeam({ players: basePlayers, coach, playerEmail: 'one@team.com', now: 1000 }).players
  const surfaces = activeSurfaceIds(removed)

  assert.deepEqual(surfaces.roster, ['two@team.com', 'third@team.com'])
  assert.deepEqual(surfaces.leaderboards, ['leader-other'])
  assert.deepEqual(surfaces.eventRsvps, ['rsvp-other'])
  assert.deepEqual(surfaces.scRsvps, ['sc-rsvp-other'])
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

  const teamEvents = [{ id: 'event-1', teamId: 'team-a' }]
  const scSessions = [{ id: 'sc-1', teamId: 'team-a' }]
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
  assert.deepEqual(teamEvents, [{ id: 'event-1', teamId: 'team-a' }])
  assert.deepEqual(scSessions, [{ id: 'sc-1', teamId: 'team-a' }])
})

test('coach player data management UI is separate from account deletion and labels team-local removal', () => {
  assert.match(appSource, /data-testid="coach-player-data-management"/)
  assert.match(appSource, />ARCHIVE PLAYER</)
  assert.match(appSource, />REMOVE FROM TEAM</)
  assert.match(appSource, />DELETE TEAM-LOCAL PLAYER DATA</)
  assert.match(appSource, /CONFIRM TEAM-LOCAL DELETE/)
  assert.match(appSource, /does not delete accounts, team branding, drills, events, or other players/)
  assert.match(appSource, /deleteTeamLocalRosterPlayerData=\{deleteTeamLocalRosterPlayerData\}/)
  assert.match(appSource, /const activeTeamPlayerEmails=useMemo\(\(\)=>getActiveTeamPlayerEmails\(players,u\?\.teamId\)/)
  assert.match(appSource, /const safeRsvps=useMemo\(\(\)=>filterActiveTeamPlayerRows\(rsvps,activeTeamPlayerEmailSet\)/)
  assert.match(appSource, /const safeScRsvps=useMemo\(\(\)=>filterActiveTeamPlayerRows\(scRsvps,activeTeamPlayerEmailSet\)/)
  assert.match(appSource, /const activeLeaderboardRows=useMemo\(\(\)=>filterActiveTeamLeaderboardRows\(homeShotsLeaderboard\?\.rows\|\|\[\],activeTeamPlayerEmailSet,activeTeamPlayerNameSet\)/)
  assert.match(appSource, /const allKnown=useMemo\(\(\)=>ups\.map\(p=>\(\{email:normalizeEmail\(p\.email\),name:p\.name\}\)\),\[ups\]\)/)
  assert.match(appSource, /<AccountTrustActions deleteAccount=\{deleteAccount\} preserveTeamData\/>/)
  assert.match(appSource, /const cleanupDemoPlayerSessionData=useCallback/)
  assert.match(appSource, /const addScore=async\(drillId,score,src="home"\)=>/)
})
