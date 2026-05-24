import { getBackendRuntime } from './backendConfig.js'

const SHOT_LOGS_TABLE = 'shot_logs'

export const LEADERBOARD_TYPES = Object.freeze({
  HOME_SHOTS: 'home_shots',
  DRILL_SHOTS: 'drill_shots',
  EVENT_PARTICIPATION: 'event_participation',
  STRENGTH_CONDITIONING_PARTICIPATION: 'strength_conditioning_participation',
})

const SUPPORTED_LEADERBOARD_TYPES = new Set(Object.values(LEADERBOARD_TYPES))

const asText = (value) => String(value ?? '').trim()
const toNum = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const safeArray = (value) => (Array.isArray(value) ? value : [])

const toDemo = (data, reason, extra = {}) => ({ ok: true, data, mode: 'demo', reason, ...extra })

const resolveLeaderboardType = (leaderboardType) => {
  const normalized = asText(leaderboardType || LEADERBOARD_TYPES.HOME_SHOTS)
  return SUPPORTED_LEADERBOARD_TYPES.has(normalized) ? normalized : null
}

const toLeaderboardRow = ({ row, rank, leaderboardType, playerContext = {}, drillName = '' }) => ({
  team_id: asText(row?.team_id || row?.teamId),
  player_id: asText(row?.player_id || row?.playerId || row?.email),
  player_display_name: asText(playerContext?.nameById?.[row?.player_id]) || asText(row?.player_display_name || row?.player_id || row?.playerId || row?.email),
  leaderboard_type: leaderboardType,
  drill_id: asText(row?.drill_id || row?.drillId),
  drill_name: asText(drillName || row?.drill_name || row?.drillName),
  score: toNum(row?.score ?? row?.total_makes),
  rank,
  total_makes: toNum(row?.total_makes),
  total_attempts: toNum(row?.total_attempts),
  total_reps: toNum(row?.total_reps),
  participation_count: toNum(row?.participation_count),
  last_activity_at: asText(row?.updated_at || row?.created_at || row?.last_activity_at || null) || null,
  total_home_shots: toNum(row?.total_makes),
})

export function calculateLeaderboardFromShotLogs({ shotLogs = [], teamId = '', playerContext = {}, leaderboardType = LEADERBOARD_TYPES.HOME_SHOTS, drillId = '', drillName = '' } = {}) {
  const team = asText(teamId || playerContext?.teamId)
  const resolvedType = resolveLeaderboardType(leaderboardType)
  if (!team || !resolvedType) return []

  if (resolvedType === LEADERBOARD_TYPES.EVENT_PARTICIPATION || resolvedType === LEADERBOARD_TYPES.STRENGTH_CONDITIONING_PARTICIPATION) {
    return []
  }

  const normalizedDrillId = asText(drillId)
  const normalizedDrillName = asText(drillName).toLowerCase()

  const grouped = new Map()
  safeArray(shotLogs)
    .filter((row) => asText(row?.team_id || row?.teamId) === team)
    .filter((row) => {
      if (resolvedType !== LEADERBOARD_TYPES.DRILL_SHOTS) return true
      if (!normalizedDrillId && !normalizedDrillName) return false
      const rowDrillId = asText(row?.drill_id || row?.drillId)
      const rowDrillName = asText(row?.drill_name || row?.drillName || row?.session_name || row?.sessionName || row?.name).toLowerCase()
      if (normalizedDrillId) return rowDrillId === normalizedDrillId
      return Boolean(rowDrillName) && rowDrillName === normalizedDrillName
    })
    .forEach((row) => {
      const playerId = asText(row?.player_id || row?.playerId || row?.email)
      if (!playerId) return
      const current = grouped.get(playerId) || {
        player_id: playerId,
        team_id: team,
        total_makes: 0,
        total_attempts: 0,
        total_reps: 0,
        participation_count: 0,
        drill_id: asText(row?.drill_id || row?.drillId),
        drill_name: asText(row?.drill_name || row?.drillName || row?.session_name || row?.sessionName || row?.name),
        updated_at: row?.updated_at || row?.created_at || null,
      }
      current.total_makes += toNum(row?.made)
      const attempts = toNum(row?.attempted_shots ?? row?.attemptedShots)
      const reps = toNum(row?.total_reps ?? row?.totalReps)
      current.total_attempts += attempts
      current.total_reps += reps
      const updatedAt = row?.updated_at || row?.created_at
      if (updatedAt && (!current.updated_at || String(updatedAt) > String(current.updated_at))) current.updated_at = updatedAt
      if (!current.drill_id) current.drill_id = asText(row?.drill_id || row?.drillId)
      if (!current.drill_name) current.drill_name = asText(row?.drill_name || row?.drillName || row?.session_name || row?.sessionName || row?.name)
      grouped.set(playerId, current)
    })

  const rows = [...grouped.values()].sort((a, b) => b.total_makes - a.total_makes || String(a.player_id).localeCompare(String(b.player_id)))
  return rows.map((row, index) => toLeaderboardRow({ row: { ...row, score: row.total_makes }, rank: index + 1, leaderboardType: resolvedType, playerContext, drillName }))
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
      return { ok: true, data: safeArray(res?.data), mode: 'supabase' }
    } catch {
      return toDemo(safeArray(fallbackShotLogs), 'backend_unavailable')
    }
  }

  const loadLeaderboardRows = async ({ teamId, leaderboardType = LEADERBOARD_TYPES.HOME_SHOTS, drillId = '', drillName = '', dateRange, fallbackShotLogs = [] } = {}) => {
    const resolvedType = resolveLeaderboardType(leaderboardType)
    if (!resolvedType) return toDemo([], 'unsupported_leaderboard_type')
    if (resolvedType === LEADERBOARD_TYPES.EVENT_PARTICIPATION || resolvedType === LEADERBOARD_TYPES.STRENGTH_CONDITIONING_PARTICIPATION) {
      return toDemo([], 'missing_participation_records', { leaderboardType: resolvedType, dateRange: dateRange || null })
    }
    const loaded = await loadTeamLogsSafe({ teamId, fallbackShotLogs })
    return {
      ...loaded,
      data: calculateLeaderboardFromShotLogs({
        shotLogs: safeArray(loaded?.data),
        teamId,
        leaderboardType: resolvedType,
        drillId,
        drillName,
      }),
    }
  }

  return {
    runtime,
    calculateRank({ shotLogs = [], teamId, playerId } = {}) {
      const rows = calculateLeaderboardFromShotLogs({ shotLogs, teamId })
      const idx = rows.findIndex((row) => asText(row.player_id) === asText(playerId))
      return idx >= 0 ? idx + 1 : null
    },
    loadLeaderboardRows,
    async loadPlayerShotLeaderboard({ teamId, playerId, fallbackShotLogs = [] } = {}) {
      if (!asText(playerId)) return toDemo([], 'missing_player_context')
      const loaded = await loadLeaderboardRows({ teamId, leaderboardType: LEADERBOARD_TYPES.HOME_SHOTS, fallbackShotLogs })
      return { ...loaded, data: safeArray(loaded?.data).filter((row) => asText(row.player_id) === asText(playerId)) }
    },
    async loadTeamLeaderboard({ teamId, fallbackShotLogs = [] } = {}) {
      return loadLeaderboardRows({ teamId, leaderboardType: LEADERBOARD_TYPES.HOME_SHOTS, fallbackShotLogs })
    },
  }
}
