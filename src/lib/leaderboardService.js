import { getBackendRuntime } from './backendConfig.js'

const SHOT_LOGS_TABLE = 'shot_logs'
export const LEADERBOARD_TYPES = {
  home_shots: 'home_shots',
  drill_shots: 'drill_shots',
  event_participation: 'event_participation',
  strength_conditioning_participation: 'strength_conditioning_participation',
}

const asText = (value) => String(value ?? '').trim()
const toNum = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const safeArray = (value) => (Array.isArray(value) ? value : [])

const toDemo = (data, reason, extra = {}) => ({ ok: true, data, mode: 'demo', reason, ...extra })

export function calculateLeaderboardFromShotLogs({ shotLogs = [], teamId = '', playerContext = {} } = {}) {
  const team = asText(teamId || playerContext?.teamId)
  if (!team) return []

  const grouped = new Map()
  safeArray(shotLogs)
    .filter((row) => asText(row?.team_id || row?.teamId) === team)
    .forEach((row) => {
      const playerId = asText(row?.player_id || row?.playerId || row?.email)
      if (!playerId) return
      const current = grouped.get(playerId) || {
        player_id: playerId,
        team_id: team,
        total_makes: 0,
        total_attempts: 0,
        total_reps: 0,
        drill_id: asText(row?.drill_id || row?.drillId),
        session_id: asText(row?.session_id || row?.sessionId),
        updated_at: row?.updated_at || row?.created_at || new Date(0).toISOString(),
      }
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

  const rows = [...grouped.values()].sort((a, b) => b.total_makes - a.total_makes || String(a.player_id).localeCompare(String(b.player_id)))
  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    total_home_shots: row.total_makes,
    player_display_name: asText(playerContext?.nameById?.[row.player_id]) || row.player_id,
  }))
}

export function calculateDrillLeaderboardFromShotLogs({ shotLogs = [], teamId = '', drillId = '', drillName = '', playerContext = {} } = {}) {
  const team = asText(teamId || playerContext?.teamId)
  if (!team) return []
  const normalizedDrillId = asText(drillId)
  const normalizedDrillName = asText(drillName).toLowerCase()
  const filtered = safeArray(shotLogs).filter((row) => {
    if (asText(row?.team_id || row?.teamId) !== team) return false
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

export function createLeaderboardService({ supabaseClient } = {}) {
  const runtime = getBackendRuntime()
  const configured = Boolean(supabaseClient?.isConfigured)

  const loadTeamLogsSafe = async ({ teamId, fallbackShotLogs = [] } = {}) => {
    if (!asText(teamId)) return toDemo([], 'missing_team_context')
    if (!configured) return toDemo(calculateLeaderboardFromShotLogs({ shotLogs: fallbackShotLogs, teamId }), 'missing_supabase_env')
    try {
      const res = await supabaseClient.from(SHOT_LOGS_TABLE).select()
      if (res?.error) return toDemo(calculateLeaderboardFromShotLogs({ shotLogs: fallbackShotLogs, teamId }), 'backend_load_failed')
      const rows = calculateLeaderboardFromShotLogs({ shotLogs: res?.data, teamId })
      return { ok: true, data: rows, mode: 'supabase' }
    } catch {
      return toDemo(calculateLeaderboardFromShotLogs({ shotLogs: fallbackShotLogs, teamId }), 'backend_unavailable')
    }
  }

  return {
    runtime,
    LEADERBOARD_TYPES,
    calculateRank({ shotLogs = [], teamId, playerId } = {}) {
      const rows = calculateLeaderboardFromShotLogs({ shotLogs, teamId })
      const idx = rows.findIndex((row) => asText(row.player_id) === asText(playerId))
      return idx >= 0 ? idx + 1 : null
    },
    async loadPlayerShotLeaderboard({ teamId, playerId, fallbackShotLogs = [] } = {}) {
      if (!asText(playerId)) return toDemo([], 'missing_player_context')
      const loaded = await loadTeamLogsSafe({ teamId, fallbackShotLogs })
      return { ...loaded, data: safeArray(loaded?.data).filter((row) => asText(row.player_id) === asText(playerId)) }
    },
    async loadTeamLeaderboard({ teamId, fallbackShotLogs = [] } = {}) {
      return loadTeamLogsSafe({ teamId, fallbackShotLogs })
    },
    async loadLeaderboardByType({ leaderboardType = LEADERBOARD_TYPES.home_shots, teamId, fallbackShotLogs = [], drillId = '', drillName = '' } = {}) {
      const type = asText(leaderboardType)
      if (type === LEADERBOARD_TYPES.home_shots) return loadTeamLogsSafe({ teamId, fallbackShotLogs })
      if (type === LEADERBOARD_TYPES.drill_shots) {
        const loaded = await loadTeamLogsSafe({ teamId, fallbackShotLogs })
        const drillRows = calculateDrillLeaderboardFromShotLogs({ shotLogs: loaded?.data, teamId, drillId, drillName })
        return { ...loaded, data: drillRows }
      }
      if (type === LEADERBOARD_TYPES.event_participation || type === LEADERBOARD_TYPES.strength_conditioning_participation) {
        return toDemo([], 'missing_durable_participation_records', { leaderboard_type: type })
      }
      return toDemo([], 'unsupported_leaderboard_type', { leaderboard_type: type || 'unknown' })
    },
  }
}
