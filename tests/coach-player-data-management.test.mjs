import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  archivePlayerForTeam,
  deleteTeamLocalPlayerData,
  filterActiveTeamChallengeRows,
  filterActiveTeamLeaderboardRows,
  filterActiveTeamPlayerRows,
  getActiveTeamPlayerIdentity,
  getCoachRosterPlayers,
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
  const identity = getActiveTeamPlayerIdentity(players, 'team-a')
  const activeEmails = identity.emails
  const activeNames = identity.names
  const activeKeys = identity.keySet
  return {
    roster: players.filter((player) => isActiveRosterPlayer(player, 'team-a')).map((player) => player.email),
    leaderboards: filterActiveTeamLeaderboardRows(surfaceState.leaderboardRows, activeKeys, activeEmails, activeNames).map((row) => row.id),
    eventRsvps: filterActiveTeamPlayerRows(surfaceState.eventRsvps, activeEmails, activeKeys).map((row) => row.id),
    missingRsvpCandidates: basePlayers.filter((player) => activeEmails.includes(player.email) && !surfaceState.eventRsvps.some((rsvp) => rsvp.email === player.email)).map((player) => player.email),
    eventWalkInCandidates: basePlayers.filter((player) => activeEmails.includes(player.email) && !surfaceState.eventRsvps.some((rsvp) => rsvp.email === player.email)).map((player) => player.email),
    scRsvps: filterActiveTeamPlayerRows(surfaceState.scRsvps, activeEmails, activeKeys).map((row) => row.id),
    scLogs: filterActiveTeamPlayerRows(surfaceState.scLogs, activeEmails, activeKeys).map((row) => row.id),
    challenges: filterActiveTeamChallengeRows(surfaceState.challenges, activeKeys, activeEmails).map((row) => row.id),
  }
}

test('active team identity centralizes active roster emails and names', () => {
  const identity = getActiveTeamPlayerIdentity(basePlayers, 'team-a')

  assert.deepEqual(identity.players.map((player) => player.email), ['one@team.com', 'two@team.com', 'third@team.com'])
  assert.deepEqual(identity.emails, ['one@team.com', 'two@team.com', 'third@team.com'])
  assert.deepEqual(identity.names, ['player one', 'player two', 'player three'])
  assert.equal(identity.emailSet.has('one@team.com'), true)
  assert.equal(identity.nameSet.has('player one'), true)
  assert.equal(identity.keySet.has('one@team.com'), true)
})

test('coach roster merges registered players and profile-only roster entries', () => {
  const roster = getCoachRosterPlayers({
    players: [
      { id: 'player-1', email: 'one@team.com', name: 'Registered One', role: 'player', teamId: 'team-a' },
      { id: 'coach-1', email: 'coach@team.com', name: 'Coach', role: 'coach', teamId: 'team-a' },
      { id: 'archived', email: 'archived@team.com', name: 'Archived', role: 'player', teamId: 'team-a', rosterStatus: 'archived' },
    ],
    playerProfiles: [
      { id: 'profile-one', userId: 'one@team.com', teamId: 'team-a', firstName: 'Profile', lastName: 'One', jerseyNumber: '1' },
      { id: 'profile-only', userId: null, team_id: 'team-a', firstName: 'Coach', lastName: 'Added', jerseyNumber: '23' },
      { id: 'profile-removed', userId: null, teamId: 'team-a', firstName: 'Removed', rosterStatus: 'removed' },
      { id: 'profile-other-team', userId: null, teamId: 'team-b', firstName: 'Other' },
    ],
    teamId: 'team-a',
  })

  assert.deepEqual(roster.map((row) => [row.name, row.source, row.email, row.profileId, row.jerseyNumber]), [
    ['Coach Added', 'profile', '', 'profile-only', '23'],
    ['Registered One', 'merged', 'one@team.com', 'profile-one', '1'],
  ])
})

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

test('removed player is hidden from active roster, coach/player leaderboards, RSVPs/logs, and challenges', () => {
  const removed = removePlayerFromTeam({ players: basePlayers, coach, playerEmail: 'one@team.com', now: 1000 }).players
  const surfaces = activeSurfaceIds(removed)

  assert.deepEqual(surfaces.roster, ['two@team.com', 'third@team.com'])
  assert.deepEqual(surfaces.leaderboards, ['leader-other'], 'removed player disappears from coach leaderboard')
  assert.deepEqual(surfaces.leaderboards, ['leader-other'], 'removed player disappears from player leaderboard')
  assert.deepEqual(surfaces.eventRsvps, ['rsvp-other'])
  assert.deepEqual(surfaces.scRsvps, ['sc-rsvp-other'])
  assert.deepEqual(surfaces.scLogs, ['sc-log-other'])
  assert.deepEqual(surfaces.challenges, ['challenge-other'])
})


test('team-local-deleted player is hidden from player and coach leaderboard rows while other active players remain', () => {
  const deleted = deleteTeamLocalPlayerData({
    players: basePlayers,
    coach,
    playerEmail: 'one@team.com',
    confirmationText: 'Player One one@team.com',
    now: 1000,
  }).players
  const identity = getActiveTeamPlayerIdentity(deleted, 'team-a')
  const rows = filterActiveTeamLeaderboardRows(surfaceState.leaderboardRows, identity.keySet, identity.emailSet, identity.nameSet)

  assert.deepEqual(rows.map((row) => row.id), ['leader-other'])
})

test('server-returned leaderboard rows are filtered before player and coach render with contiguous ranks', () => {
  const archived = archivePlayerForTeam({ players: basePlayers, coach, playerEmail: 'one@team.com', now: 1000 }).players
  const identity = getActiveTeamPlayerIdentity(archived, 'team-a')
  const serverRows = [
    { id: 'server-archived', player_display_name: 'Player One', total_home_shots: 999 },
    { id: 'server-active', player_display_name: 'Player Two', total_home_shots: 25 },
  ]

  const filteredRows = filterActiveTeamLeaderboardRows(serverRows, identity.keySet, identity.emailSet, identity.nameSet)

  assert.deepEqual(filteredRows.map((row) => row.id), ['server-active'])
  assert.deepEqual(filteredRows.map((row) => row.rank), [1])
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


test('active generated roster keys keep matching leaderboard rows visible', () => {
  const players = [
    { email: 'generated@team.com', id: 'player:team_123', player_id: 'player:team_123', role: 'player', teamId: 'team-a', name: 'Generated Player' },
    { email: 'other@team.com', id: 'player:team_456', role: 'player', teamId: 'team-a', name: 'Other Player' },
  ]
  const identity = getActiveTeamPlayerIdentity(players, 'team-a')
  const rows = filterActiveTeamLeaderboardRows([
    { id: 'generated-row', player_id: 'player:team_123', player_display_name: 'Different Live Name', total_home_shots: 90, rank: 5 },
  ], identity.keySet, identity.emailSet, identity.nameSet)

  assert.equal(identity.keySet.has('player:team_123'), true)
  assert.deepEqual(rows.map((row) => row.id), ['generated-row'])
  assert.deepEqual(rows.map((row) => row.rank), [1])
})

test('archived generated roster-key player is filtered and ranks are recomputed without gaps', () => {
  const players = [
    { email: 'generated@team.com', id: 'player:team_123', player_id: 'player:team_123', role: 'player', teamId: 'team-a', name: 'Generated Player' },
    { email: 'other@team.com', id: 'player:team_456', player_id: 'player:team_456', role: 'player', teamId: 'team-a', name: 'Other Player' },
  ]
  const archived = archivePlayerForTeam({ players, coach, playerEmail: 'player:team_123', now: 1000 }).players
  const identity = getActiveTeamPlayerIdentity(archived, 'team-a')
  const rows = filterActiveTeamLeaderboardRows([
    { id: 'archived-row', player_id: 'player:team_123', total_home_shots: 100, rank: 1 },
    { id: 'active-row', player_id: 'player:team_456', total_home_shots: 50, rank: 2 },
  ], identity.keySet, identity.emailSet, identity.nameSet)

  assert.deepEqual(rows.map((row) => row.id), ['active-row'])
  assert.deepEqual(rows.map((row) => row.rank), [1])
})


test('removed generated roster-key player is filtered and active player ranks start at one', () => {
  const players = [
    { email: 'generated@team.com', id: 'player:team_123', player_id: 'player:team_123', role: 'player', teamId: 'team-a', name: 'Generated Player' },
    { email: 'other@team.com', id: 'player:team_456', player_id: 'player:team_456', role: 'player', teamId: 'team-a', name: 'Other Player' },
  ]
  const removed = removePlayerFromTeam({ players, coach, playerEmail: 'player:team_123', now: 1000 }).players
  const identity = getActiveTeamPlayerIdentity(removed, 'team-a')
  const rows = filterActiveTeamLeaderboardRows([
    { id: 'removed-row', player_id: 'player:team_123', total_home_shots: 120, rank: 1 },
    { id: 'active-row', player_id: 'player:team_456', total_home_shots: 100, rank: 2 },
  ], identity.keySet, identity.emailSet, identity.nameSet)

  assert.deepEqual(rows.map((row) => row.id), ['active-row'])
  assert.deepEqual(rows.map((row) => row.rank), [1])
})

test('team-local deleted generated roster-key player data is removed without rank gaps', () => {
  const players = [
    { email: 'generated@team.com', id: 'player:team_123', player_id: 'player:team_123', role: 'player', teamId: 'team-a', name: 'Generated Player' },
    { email: 'other@team.com', id: 'player:team_456', player_id: 'player:team_456', role: 'player', teamId: 'team-a', name: 'Other Player' },
  ]
  const result = deleteTeamLocalPlayerData({
    players,
    coach,
    playerEmail: 'player:team_123',
    confirmationText: 'Generated Player generated@team.com',
    scores: [{ id: 'deleted-score', teamId: 'team-a', player_id: 'player:team_123' }, { id: 'active-score', teamId: 'team-a', player_id: 'player:team_456' }],
    challenges: [{ id: 'deleted-challenge', teamId: 'team-a', from: 'player:team_123', to: 'player:team_456' }, { id: 'active-challenge', teamId: 'team-a', from: 'player:team_456' }],
    now: 1000,
  })
  const identity = getActiveTeamPlayerIdentity(result.players, 'team-a')
  const rows = filterActiveTeamLeaderboardRows([
    { id: 'deleted-row', player_id: 'player:team_123', total_home_shots: 80, rank: 1 },
    { id: 'active-row', player_id: 'player:team_456', total_home_shots: 70, rank: 2 },
  ], identity.keySet, identity.emailSet, identity.nameSet)

  assert.equal(result.ok, true)
  assert.deepEqual(result.scores.map((row) => row.id), ['active-score'])
  assert.deepEqual(result.challenges.map((row) => row.id), ['active-challenge'])
  assert.deepEqual(rows.map((row) => [row.id, row.rank]), [['active-row', 1]])
})

test('coach player data management UI is separate from account deletion and labels team-local removal', () => {
  assert.match(appSource, /data-testid="coach-player-data-management"/)
  assert.match(appSource, />ARCHIVE PLAYER</)
  assert.match(appSource, />REMOVE FROM TEAM</)
  assert.match(appSource, />DELETE TEAM-LOCAL PLAYER DATA</)
  assert.match(appSource, /CONFIRM TEAM-LOCAL DELETE/)
  assert.match(appSource, /It does not delete Supabase Auth users, app account rows, team branding, drills, events, or other players/)
  assert.match(appSource, /deleteTeamLocalRosterPlayerData=\{deleteTeamLocalRosterPlayerData\}/)
  assert.match(appSource, /playerProfiles=\{playerProfiles\.filter\(pp=>String\(pp\.teamId\|\|pp\.team_id\|\|""\)===String\(user\?\.teamId\|\|""\)\)\}/)
  assert.match(appSource, /const coachRosterPlayers=useMemo\(\(\)=>getCoachRosterPlayers\(\{players,playerProfiles,teamId:u\?\.teamId\}\)/)
  assert.match(appSource, /const activeTeamPlayerIdentity=useMemo\(\(\)=>getActiveTeamPlayerIdentity\(coachRosterPlayers,u\?\.teamId\)/)
  assert.match(appSource, /\{ups\.length\} players on roster/)
  assert.match(appSource, /const allKnown=useMemo\(\(\)=>ups\.map\(p=>\(\{email:normalizeEmail\(p\.email\),name:p\.name\}\)\),\[ups\]\)/)
  assert.match(appSource, /<CoachRoster players=\{coachRosterPlayers\}/)
  assert.match(appSource, /\{ups\.map\(\(p,i\)=>/)
  assert.match(appSource, /const activeHomeShotsLeaderboard=useMemo\(\(\)=>\(\{/)
  assert.match(appSource, /homeShotsLeaderboard=\{activeHomeShotsLeaderboard\} refreshHomeShotsLeaderboard=\{\(\)=>fetchHomeShotsLeaderboard\(user\?\.teamId,"players"\)\} statSyncError=\{statSyncError\}/)
  assert.match(appSource, /homeShotsLeaderboard=\{activeHomeShotsLeaderboard\} refreshHomeShotsLeaderboard=\{\(\)=>fetchHomeShotsLeaderboard\(user\?\.teamId,"players"\)\}\/>/)
  assert.match(appSource, /const safeRsvps=useMemo\(\(\)=>filterActiveTeamPlayerRows\(rsvps,activeTeamPlayerEmailSet,activeTeamPlayerKeySet\)/)
  assert.match(appSource, /const safeScRsvps=useMemo\(\(\)=>filterActiveTeamPlayerRows\(scRsvps,activeTeamPlayerEmailSet,activeTeamPlayerKeySet\)/)
  assert.match(appSource, /const activeLeaderboardRows=useMemo\(\(\)=>filterActiveTeamLeaderboardRows\(homeShotsLeaderboard\?\.rows\|\|\[\],activeTeamPlayerKeySet,activeTeamPlayerEmailSet,activeTeamPlayerNameSet\)/)
  assert.match(appSource, /const allKnown=useMemo\(\(\)=>ups\.map\(p=>\(\{email:normalizeEmail\(p\.email\),name:p\.name\}\)\),\[ups\]\)/)
  assert.match(appSource, /<AccountTrustActions deleteAccount=\{deleteAccount\} preserveTeamData\/>/)
  assert.match(appSource, /const cleanupDemoPlayerSessionData=useCallback/)
  assert.match(appSource, /const addScore=async\(drillId,score,src="home"\)=>/)
})

test('stabilization: remove, archive, and team-local delete are explicitly not Supabase Auth deletion paths', () => {
  const removed = removePlayerFromTeam({ players: basePlayers, coach, playerEmail: 'one@team.com', now: 1000 }).players.find((player) => player.email === 'one@team.com')
  const archived = archivePlayerForTeam({ players: basePlayers, coach, playerEmail: 'one@team.com', now: 1000 }).players.find((player) => player.email === 'one@team.com')
  const deleted = deleteTeamLocalPlayerData({ players: basePlayers, coach, playerEmail: 'one@team.com', confirmationText: 'Player One one@team.com', now: 1000 }).players.find((player) => player.email === 'one@team.com')

  assert.equal(removed.rosterAction, 'coach_remove_from_team')
  assert.equal(removed.accountDeletion, false)
  assert.equal(removed.supabaseAuthUserDeleted, false)
  assert.equal(archived.rosterAction, 'coach_archive_player')
  assert.equal(archived.accountDeletion, false)
  assert.equal(archived.supabaseAuthUserDeleted, false)
  assert.equal(deleted.rosterAction, 'coach_delete_team_local_player_data')
  assert.equal(deleted.accountDeletion, false)
  assert.equal(deleted.supabaseAuthUserDeleted, false)
})

test('stabilization: deleting team-local data preserves external auth/user account assumptions and AQ coach account', () => {
  const authAccounts = [
    { id: 'auth-player-one', email: 'one@team.com', provider: 'supabase' },
    { id: 'aq-coach-auth', email: 'coach@team.com', label: 'AQ coach' },
  ]
  const result = deleteTeamLocalPlayerData({
    players: basePlayers,
    authAccounts,
    coach,
    playerEmail: 'one@team.com',
    confirmationText: 'Player One one@team.com',
    now: 1000,
  })

  assert.equal(result.ok, true)
  assert.equal(result.accountDeletion, false)
  assert.equal(result.supabaseAuthUserDeleted, false)
  assert.deepEqual(result.authAccounts, authAccounts)
  assert.deepEqual(result.authAccounts.map((account) => account.email), ['one@team.com', 'coach@team.com'])
  assert.equal(result.players.some((player) => player.email === 'coach@team.com' && player.role === 'coach'), true, 'AQ coach app account row is preserved')
})

test('stabilization: removed player cannot reappear from a profile row without current join-code flow creating active membership', () => {
  const removedPlayers = removePlayerFromTeam({ players: basePlayers, coach, playerEmail: 'one@team.com', now: 1000 }).players
  const roster = getCoachRosterPlayers({
    players: removedPlayers,
    playerProfiles: [
      { id: 'stale-profile-one', userId: 'one@team.com', teamId: 'team-a', firstName: 'Player', lastName: 'One' },
      { id: 'active-profile-two', userId: 'two@team.com', teamId: 'team-a', firstName: 'Player', lastName: 'Two' },
    ],
    teamId: 'team-a',
  })

  assert.deepEqual(roster.map((player) => player.email).sort(), ['third@team.com', 'two@team.com'].sort())
  assert.equal(removedPlayers.find((player) => player.email === 'one@team.com').removedFromTeamId, 'team-a')
  assert.match(appSource, /const joinTeam=async\(code\)=>/)
  assert.match(appSource, /startJoinContext\(normalizedCode,user\.email\)/)
  assert.match(appSource, /consumeJoinContext\(user,null,activeContext\)/)
})

test('stabilization: coach-facing labels never imply coach can delete a Supabase Auth user', () => {
  assert.match(appSource, /Remove from Team removes roster membership only/)
  assert.match(appSource, /does not delete .*Supabase Auth account or app account row/)
  assert.match(appSource, /Supabase Auth account and app account row were not deleted/)
  assert.match(appSource, /It does not delete Supabase Auth users, app account rows, team branding, drills, events, or other players/)
  assert.doesNotMatch(appSource, /coach can delete .*Supabase Auth/i)
})


test('coach removal updates roster state before awaiting persistence', () => {
  assert.match(appSource, /setPlayers\(result\.players\);\s*await P\("sl:players",result\.players,setPlayers\);/);
  assert.match(appSource, /setPlayerProfiles\(nextProfiles\);\s*await P\("sl:player-profiles",nextProfiles,setPlayerProfiles\);/);
});
