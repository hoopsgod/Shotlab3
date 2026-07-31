import { getBackendRuntime } from './backendConfig.js'
import {
  LEADERBOARD_TIME_SCOPES,
  buildAllTimeEventParticipationLeaderboardRows,
  buildAllTimeStrengthParticipationLeaderboardRows,
  buildCurrentEventParticipationLeaderboardRows,
  buildCurrentStrengthParticipationLeaderboardRows,
} from './seasonLeaderboardAnalytics.js'

const SHOT_LOGS_TABLE = 'shot_logs'
const PLAYERS_TABLE = 'players'
const PROFILES_TABLE = 'player_profiles'
export const LEADERBOARD_TYPES = {
  home_shots: 'home_shots',
  drill_shots: 'drill_shots',
  event_participation: 'event_participation',
  strength_conditioning_participation: 'strength_conditioning_participation',
}

const asText = (value) => String(value ?? '').trim()
const lowerText = (value) => asText(value).toLowerCase()
const toNum = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const safeArray = (value) => (Array.isArray(value) ? value : [])

const toDemo = (data, reason, extra = {}) => ({ ok: true, data, mode: 'demo', reason, ...extra })

const rowTeamId = (row = {}) => asText(row?.team_id || row?.teamId)
const shotIdentity = (row = {}) => asText(row?.player_id || row?.playerId || row?.email)
const rosterPlayerKey = (row = {}) => asText(row?.player_id || row?.playerId || row?.id || row?.user_id || row?.userId || row?.email)
const displayNameFor = (row = {}) => {
  const firstLast = [asText(row?.firstName || row?.first_name), asText(row?.lastName || row?.last_name)].filter(Boolean).join(' ')
  return asText(row?.name || row?.display_name || row?.displayName || firstLast || row?.email)
}
const isHidden = (row = {}) => row?.hideFromLeaderboards === true || row?.hide_from_leaderboards === true
const roleOf = (row = {}) => lowerText(row?.role || row?.player_role || row?.playerRole || 'player') || 'player'

const aliasValuesForPlayer = (player = {}) => [
  player?.player_id,
  player?.playerId,
  player?.id,
  player?.user_id,
  player?.userId,
  player?.email,
].map(asText).filter(Boolean)

function buildRosterLookup({ players = [], profiles = [], teamId = '' } = {}) {
  const team = asText(teamId)
  const lookup = new Map()
  const byKey = new Map()
  const attach = (record = {}, source = 'player') => {
    if (team && rowTeamId(record) && rowTeamId(record) !== team) return
    const aliases = aliasValuesForPlayer(record)
    if (!aliases.length) return
    const key = rosterPlayerKey(record) || aliases[0]
    const existing = byKey.get(key) || {}
    const merged = { ...existing, ...record, source: existing.source || source, key }
    byKey.set(key, merged)
    aliases.forEach((alias) => lookup.set(alias, merged))
    aliases.map(lowerText).filter(Boolean).forEach((alias) => lookup.set(alias, merged))
  }
  safeArray(players).forEach((player) => attach(player, 'player'))
  safeArray(profiles).forEach((profile) => attach(profile, 'profile'))
  return { lookup, byKey }
}

function resolveShotPlayer(row = {}, rosterLookup) {
  const aliases = [row?.player_id, row?.playerId, row?.email].map(asText).filter(Boolean)
  const matched = aliases.map((alias) => rosterLookup.get(alias) || rosterLookup.get(lowerText(alias))).find(Boolean)
  const playerId = matched ? rosterPlayerKey(matched) : aliases[0]
  const email = asText(matched?.email || row?.email)
  const displayName = displayNameFor(matched || {}) || asText(row?.name) || (email.includes('@') ? email.split('@')[0] : '') || playerId || 'Player'
  return { playerId, email, displayName, matched }
}

export function calculateLeaderboardFromShotLogs({ shotLogs = [], teamId = '', playerContext = {} } = {}) {
  const team = asText(teamId || playerContext?.teamId)
  if (!team) return []

  const { lookup } = buildRosterLookup({ players: playerContext?.players, profiles: playerContext?.profiles, teamId: team })
  const scope = lowerText(playerContext?.scope || 'players')
  const grouped = new Map()
  safeArray(shotLogs)
    .filter((row) => rowTeamId(row) === team)
    .forEach((row) => {
      const rawIdentity = shotIdentity(row)
      if (!rawIdentity) return
      const resolved = resolveShotPlayer(row, lookup)
      const playerId = resolved.playerId || rawIdentity
      if (!playerId) return
      if (resolved.matched && isHidden(resolved.matched)) return
      const role = roleOf(resolved.matched || {})
      if (scope === 'players' && role === 'coach') return
      if (scope === 'coaches' && role !== 'coach') return
      const current = grouped.get(playerId) || {
        player_id: playerId,
        email: resolved.email,
        team_id: team,
        total_makes: 0,
        total_attempts: 0,
        total_reps: 0,
        drill_id: asText(row?.drill_id || row?.drillId),
        session_id: asText(row?.session_id || row?.sessionId),
        player_display_name: asText(playerContext?.nameById?.[playerId]) || resolved.displayName,
        updated_at: row?.updated_at || row?.created_at || new Date(0).toISOString(),
      }
      if (!current.email && resolved.email) current.email = resolved.email
      if (!current.player_display_name || current.player_display_name === current.player_id) current.player_display_name = resolved.displayName
      current.total_makes += toNum(row?.made)
      const attempts = toNum(row?.attempted_shots ?? row?.attemptedShots)
      const reps = toNum(row?.total_reps ?? row?.totalReps)
      current.total_attempts += attempts
      current.total_reps += reps
      const updatedAt = row?.updated_at || row?.created_at
      if (updatedAt && String(updatedAt) > String(current.updated_at)) current.updated_at = updatedAt
      if (!current.drill_id) current.drill_id = asText(row?.drill_id || row?.drillId)
      if (!current.session_id) current.session_id = asText(row?.session_id || row?.sessionId)
      grouped.set(playerId, current)
    })

  const rows = [...grouped.values()].sort((a, b) => b.total_makes - a.total_makes || String(a.player_display_name || a.player_id).localeCompare(String(b.player_display_name || b.player_id)) || String(a.player_id).localeCompare(String(b.player_id)))
  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    total_home_shots: row.total_makes,
    player_display_name: asText(row.player_display_name) || asText(playerContext?.nameById?.[row.player_id]) || row.player_id,
  }))
}

export function calculateDrillLeaderboardFromShotLogs({ shotLogs = [], teamId = '', drillId = '', drillName = '', playerContext = {} } = {}) {
  const team = asText(teamId || playerContext?.teamId)
  if (!team) return []
  const normalizedDrillId = asText(drillId)
  const normalizedDrillName = asText(drillName).toLowerCase()
  const filtered = safeArray(shotLogs).filter((row) => {
    if (rowTeamId(row) !== team) return false
    const rowDrillId = asText(row?.drill_id || row?.drillId)
    const rowDrillName = asText(row?.drill_name || row?.drillName).toLowerCase()
    if (normalizedDrillId) return rowDrillId === normalizedDrillId
    if (normalizedDrillName) return rowDrillName === normalizedDrillName
    return false
  })
  return calculateLeaderboardFromShotLogs({ shotLogs: filtered, teamId: team, playerContext }).map((row) => ({
    ...row,
    leaderboard_type: LEADERBOARD_TYPES.drill_shots,
    drill_id: normalizedDrillId || asText(row?.drill_id),
    drill_name: asText(drillName),
  }))
}

async function selectAllSafe(supabaseClient, tableName) {
  const res = await supabaseClient.from(tableName).select()
  if (res?.error) return { rows: [], error: res.error }
  return { rows: safeArray(res?.data), error: null }
}

export function createLeaderboardService({ supabaseClient } = {}) {
  const runtime = getBackendRuntime()
  const configured = Boolean(supabaseClient?.isConfigured)

  const loadTeamLogsSafe = async ({ teamId, fallbackShotLogs = [], fallbackPlayers = [], fallbackProfiles = [], scope = 'players' } = {}) => {
    if (!asText(teamId)) return toDemo([], 'missing_team_context')
    const fallbackRows = () => calculateLeaderboardFromShotLogs({ shotLogs: fallbackShotLogs, teamId, playerContext: { players: fallbackPlayers, profiles: fallbackProfiles, scope } })
    if (!configured) return toDemo(fallbackRows(), 'missing_supabase_env')
    try {
      const shotLogsResponse = await supabaseClient.from(SHOT_LOGS_TABLE).select()
      const [{ rows: playerRows }, { rows: profileRows }] = await Promise.all([
        selectAllSafe(supabaseClient, PLAYERS_TABLE).catch(() => ({ rows: [] })),
        selectAllSafe(supabaseClient, PROFILES_TABLE).catch(() => ({ rows: [] })),
      ])
      if (shotLogsResponse?.error) return toDemo(fallbackRows(), 'backend_load_failed')
      const shotRows = safeArray(shotLogsResponse?.data)
      const rows = calculateLeaderboardFromShotLogs({
        shotLogs: shotRows,
        teamId,
        playerContext: { players: playerRows.length ? playerRows : fallbackPlayers, profiles: profileRows.length ? profileRows : fallbackProfiles, scope },
      })
      const localFallbackRows = rows.length ? [] : fallbackRows()
      return { ok: true, data: rows.length ? rows : localFallbackRows, mode: 'supabase', rpcResultCount: rows.length, fallbackResultCount: localFallbackRows.length }
    } catch {
      return toDemo(fallbackRows(), 'backend_unavailable')
    }
  }

  return {
    runtime,
    LEADERBOARD_TYPES,
    calculateRank({ shotLogs = [], teamId, playerId, players = [], profiles = [] } = {}) {
      const rows = calculateLeaderboardFromShotLogs({ shotLogs, teamId, playerContext: { players, profiles } })
      const idx = rows.findIndex((row) => asText(row.player_id) === asText(playerId))
      return idx >= 0 ? idx + 1 : null
    },
    async loadPlayerShotLeaderboard({ teamId, playerId, fallbackShotLogs = [], fallbackPlayers = [], fallbackProfiles = [] } = {}) {
      if (!asText(playerId)) return toDemo([], 'missing_player_context')
      const loaded = await loadTeamLogsSafe({ teamId, fallbackShotLogs, fallbackPlayers, fallbackProfiles })
      const target = asText(playerId)
      const targetLower = lowerText(playerId)
      return { ...loaded, data: safeArray(loaded?.data).filter((row) => asText(row.player_id) === target || lowerText(row.email) === targetLower) }
    },
    async loadTeamLeaderboard({ teamId, fallbackShotLogs = [], fallbackPlayers = [], fallbackProfiles = [], scope = 'players' } = {}) {
      return loadTeamLogsSafe({ teamId, fallbackShotLogs, fallbackPlayers, fallbackProfiles, scope })
    },
    async loadLeaderboardByType({
      leaderboardType = LEADERBOARD_TYPES.home_shots,
      teamId,
      fallbackShotLogs = [],
      fallbackPlayers = [],
      fallbackProfiles = [],
      fallbackEvents = [],
      fallbackRsvps = [],
      fallbackScSessions = [],
      fallbackScLogs = [],
      fallbackSeasonArchives = [],
      drillId = '',
      drillName = '',
      scope = 'players',
      timeScope = LEADERBOARD_TIME_SCOPES.CURRENT,
    } = {}) {
      const type = asText(leaderboardType)
      if (type === LEADERBOARD_TYPES.home_shots) return loadTeamLogsSafe({ teamId, fallbackShotLogs, fallbackPlayers, fallbackProfiles, scope })
      if (type === LEADERBOARD_TYPES.drill_shots) {
        const loaded = await loadTeamLogsSafe({ teamId, fallbackShotLogs, fallbackPlayers, fallbackProfiles, scope })
        const drillRows = calculateDrillLeaderboardFromShotLogs({ shotLogs: loaded?.data, teamId, drillId, drillName, playerContext: { players: fallbackPlayers, profiles: fallbackProfiles, scope } })
        return { ...loaded, data: drillRows }
      }
      if (type === LEADERBOARD_TYPES.event_participation) {
        const builder = timeScope === LEADERBOARD_TIME_SCOPES.ALL_TIME
          ? buildAllTimeEventParticipationLeaderboardRows
          : buildCurrentEventParticipationLeaderboardRows
        const rows = builder({
          teamId,
          seasonArchives: fallbackSeasonArchives,
          events: fallbackEvents,
          rsvps: fallbackRsvps,
          players: fallbackPlayers,
          profiles: fallbackProfiles,
        })
        return toDemo(rows, rows.length ? 'local_participation_projection' : 'no_participation_records', { leaderboard_type: type })
      }
      if (type === LEADERBOARD_TYPES.strength_conditioning_participation) {
        const builder = timeScope === LEADERBOARD_TIME_SCOPES.ALL_TIME
          ? buildAllTimeStrengthParticipationLeaderboardRows
          : buildCurrentStrengthParticipationLeaderboardRows
        const rows = builder({
          teamId,
          seasonArchives: fallbackSeasonArchives,
          scSessions: fallbackScSessions,
          scLogs: fallbackScLogs,
          players: fallbackPlayers,
          profiles: fallbackProfiles,
        })
        return toDemo(rows, rows.length ? 'local_participation_projection' : 'no_participation_records', { leaderboard_type: type })
      }
      return toDemo([], 'unsupported_leaderboard_type', { leaderboard_type: type || 'unknown' })
    },
  }
}
